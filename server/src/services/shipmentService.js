const { getDb } = require('../database/db');
const { evaluateShipmentStatus, addMinutesToTimeString } = require('./riskService');
const { calculateBestRoute } = require('./routeService');
const { createEvent } = require('./eventService');

/**
 * Format a raw database shipment row into API object
 */
function formatShipment(row) {
  if (!row) return null;
  let route = [];
  let recommendedRoute = null;

  try {
    route = JSON.parse(row.route_json || '[]');
  } catch (e) {
    route = [row.origin, row.destination];
  }

  try {
    if (row.recommended_route_json) {
      recommendedRoute = JSON.parse(row.recommended_route_json);
    }
  } catch (e) {
    recommendedRoute = null;
  }

  // Ensure status reflects ground truth
  const status = evaluateShipmentStatus(row.eta, row.deadline, row.delay_minutes);

  return {
    id: row.id,
    trackingNumber: row.tracking_number,
    origin: row.origin,
    currentLocation: row.current_location,
    destination: row.destination,
    eta: row.eta,
    deadline: row.deadline,
    delayMinutes: row.delay_minutes,
    status: status,
    route: route,
    recommendedRoute: recommendedRoute,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Get all active shipments
 */
function getAllShipments() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM shipments ORDER BY created_at ASC').all();
  return rows.map(formatShipment);
}

/**
 * Get single shipment by id or tracking number
 */
function getShipmentById(idOrTracking) {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM shipments 
    WHERE id = ? OR tracking_number = ?
  `).get(idOrTracking, idOrTracking);
  return formatShipment(row);
}

/**
 * Simulates delay for a package
 */
function simulateDelay(idOrTracking, minutesToAdd = 20) {
  const db = getDb();
  const shipment = getShipmentById(idOrTracking);
  if (!shipment) {
    throw new Error(`Shipment ${idOrTracking} not found`);
  }

  const added = parseInt(minutesToAdd, 10) || 20;
  const newDelay = shipment.delayMinutes + added;
  const newEta = addMinutesToTimeString(shipment.eta, added);
  const newStatus = evaluateShipmentStatus(newEta, shipment.deadline, newDelay);
  const nowStr = new Date().toISOString();

  db.prepare(`
    UPDATE shipments 
    SET delay_minutes = ?, eta = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newDelay, newEta, newStatus, nowStr, shipment.id);

  // If shipment has a current leg, flag route as affected
  if (shipment.currentLocation && shipment.destination) {
    db.prepare(`
      UPDATE routes 
      SET status = 'DELAYED', delay_minutes = delay_minutes + ?
      WHERE (from_hub = ? AND to_hub = ?) OR (from_hub = ? AND to_hub = ?)
    `).run(added, shipment.currentLocation, shipment.destination, shipment.destination, shipment.currentLocation);
  }

  // Create DELAY_EVENT in timeline
  createEvent({
    type: 'DELAY_EVENT',
    shipmentId: shipment.trackingNumber,
    message: `Delay detected for ${shipment.trackingNumber}: +${added}m accumulated delay (New ETA: ${newEta}, Status: ${newStatus.replace('_', ' ')})`,
    source: 'SYSTEM'
  });

  return getShipmentById(shipment.id);
}

/**
 * Recalculate fastest route using Dijkstra
 */
function recalculateRoute(idOrTracking) {
  const db = getDb();
  const shipment = getShipmentById(idOrTracking);
  if (!shipment) {
    throw new Error(`Shipment ${idOrTracking} not found`);
  }

  // Execute Dijkstra shortest path
  const bestRoute = calculateBestRoute(shipment.currentLocation, shipment.destination);
  const recommendedRouteJson = JSON.stringify(bestRoute.path);
  const nowStr = new Date().toISOString();

  db.prepare(`
    UPDATE shipments 
    SET recommended_route_json = ?, updated_at = ?
    WHERE id = ?
  `).run(recommendedRouteJson, nowStr, shipment.id);

  // Log ROUTE_UPDATE event
  createEvent({
    type: 'ROUTE_UPDATE',
    shipmentId: shipment.trackingNumber,
    message: `Fastest alternative route calculated for ${shipment.trackingNumber}: ${bestRoute.path.join(' → ')} (${bestRoute.travelTimeMinutes} min)`,
    source: 'SYSTEM'
  });

  const updatedShipment = getShipmentById(shipment.id);

  return {
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    path: bestRoute.path,
    travelTimeMinutes: bestRoute.travelTimeMinutes,
    shipment: updatedShipment
  };
}

/**
 * Apply the recommended route to the shipment
 */
function applyRoute(idOrTracking) {
  const db = getDb();
  const shipment = getShipmentById(idOrTracking);
  if (!shipment) {
    throw new Error(`Shipment ${idOrTracking} not found`);
  }

  if (!shipment.recommendedRoute || shipment.recommendedRoute.length === 0) {
    // If none recommended yet, calculate and apply
    const bestRoute = calculateBestRoute(shipment.currentLocation, shipment.destination);
    shipment.recommendedRoute = bestRoute.path;
  }

  const newRouteJson = JSON.stringify(shipment.recommendedRoute);
  // Mitigate delay by optimizing route (reduce delay minutes by 15 or set on-track if optimized)
  const optimizedDelay = Math.max(0, shipment.delayMinutes - 15);
  const optimizedEta = addMinutesToTimeString(shipment.eta, -15);
  const newStatus = evaluateShipmentStatus(optimizedEta, shipment.deadline, optimizedDelay);
  const nowStr = new Date().toISOString();

  db.prepare(`
    UPDATE shipments 
    SET route_json = ?, recommended_route_json = NULL, delay_minutes = ?, eta = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newRouteJson, optimizedDelay, optimizedEta, newStatus, nowStr, shipment.id);

  createEvent({
    type: 'ROUTE_UPDATE',
    shipmentId: shipment.trackingNumber,
    message: `Alternative route applied for ${shipment.trackingNumber}: ${shipment.recommendedRoute.join(' → ')} (ETA improved to ${optimizedEta})`,
    source: 'USER'
  });

  return getShipmentById(shipment.id);
}

/**
 * Update shipment location (e.g. from RFID scanner or arrival)
 */
function updateShipmentLocation(idOrTracking, newLocation, source = 'RFID_SCANNER') {
  const db = getDb();
  const shipment = getShipmentById(idOrTracking);
  if (!shipment) {
    throw new Error(`Shipment ${idOrTracking} not found`);
  }

  const prevLocation = shipment.currentLocation;
  const nowStr = new Date().toISOString();

  db.prepare(`
    UPDATE shipments 
    SET current_location = ?, updated_at = ?
    WHERE id = ?
  `).run(newLocation, nowStr, shipment.id);

  // Update Hub counts
  if (prevLocation !== newLocation) {
    db.prepare('UPDATE hubs SET package_count = MAX(0, package_count - 1), outbound_count = outbound_count + 1 WHERE city LIKE ? OR name LIKE ?')
      .run(`%${prevLocation}%`, `%${prevLocation}%`);
    db.prepare('UPDATE hubs SET package_count = package_count + 1, inbound_count = inbound_count + 1 WHERE city LIKE ? OR name LIKE ?')
      .run(`%${newLocation}%`, `%${newLocation}%`);
  }

  const eventType = (newLocation === shipment.destination) ? 'PACKAGE_ARRIVAL' : 'RFID_SCAN';
  createEvent({
    type: eventType,
    shipmentId: shipment.trackingNumber,
    message: `${shipment.trackingNumber} ${eventType === 'PACKAGE_ARRIVAL' ? 'arrived at destination' : 'scanned at'} ${newLocation} Hub.`,
    source
  });

  return getShipmentById(shipment.id);
}

/**
 * Dynamically calculated platform statistics
 */
function getPlatformStats() {
  const shipments = getAllShipments();
  const activeShipments = shipments.length;
  const atRisk = shipments.filter(s => s.status === 'AT_RISK').length;
  const delayed = shipments.filter(s => s.status === 'DELAYED').length;
  const inTransit = shipments.filter(s => s.currentLocation !== s.destination).length;

  return {
    activeShipments,
    atRisk,
    inTransit,
    delayed
  };
}

module.exports = {
  getAllShipments,
  getShipmentById,
  simulateDelay,
  recalculateRoute,
  applyRoute,
  updateShipmentLocation,
  getPlatformStats
};
