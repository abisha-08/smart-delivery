const { getAllShipments, updateShipmentLocation, simulateDelay } = require('./shipmentService');
const { createEvent } = require('./eventService');
const { getDb } = require('../database/db');

let simulationInterval = null;
let isSimulationActive = false;
let eventCounter = 0;

const HUBS = ['Chicago', 'Detroit', 'Denver', 'Dallas', 'Houston'];

/**
 * Executes a single controlled legacy event tick
 */
function tickSimulation() {
  try {
    const shipments = getAllShipments();
    if (!shipments || shipments.length === 0) return null;

    eventCounter++;
    const cycle = eventCounter % 5;

    // Pick a shipment (prefer ones not already completed)
    const activeShipments = shipments.filter(s => s.currentLocation !== s.destination);
    const targetShipment = activeShipments.length > 0 
      ? activeShipments[Math.floor(Math.random() * activeShipments.length)] 
      : shipments[Math.floor(Math.random() * shipments.length)];

    let generatedEvent = null;

    if (cycle === 0) {
      // RFID Scan at a hub
      const hub = targetShipment.currentLocation || 'Denver';
      const bay = Math.floor(Math.random() * 8) + 1;
      generatedEvent = createEvent({
        type: 'RFID_SCAN',
        shipmentId: targetShipment.trackingNumber,
        message: `${targetShipment.trackingNumber} scanned at ${hub} Hub Gate ${bay} (RFID Tag: 0x${Math.floor(Math.random()*16777215).toString(16).toUpperCase()})`,
        source: 'RFID_SCANNER'
      });
    } else if (cycle === 1) {
      // Hub update / sorting message
      const hub = HUBS[Math.floor(Math.random() * HUBS.length)];
      generatedEvent = createEvent({
        type: 'HUB_UPDATE',
        shipmentId: targetShipment.trackingNumber,
        message: `${hub} Hub high-speed sorting lane active. Container assigned for ${targetShipment.destination}.`,
        source: 'LEGACY_QUEUE'
      });
    } else if (cycle === 2) {
      // Package progress along its route
      const currentRoute = targetShipment.route || [];
      const currentIdx = currentRoute.indexOf(targetShipment.currentLocation);
      if (currentIdx >= 0 && currentIdx < currentRoute.length - 1) {
        const nextHub = currentRoute[currentIdx + 1];
        updateShipmentLocation(targetShipment.id, nextHub, 'RFID_SCANNER');
        generatedEvent = createEvent({
          type: nextHub === targetShipment.destination ? 'PACKAGE_ARRIVAL' : 'RFID_SCAN',
          shipmentId: targetShipment.trackingNumber,
          message: `${targetShipment.trackingNumber} transit transfer: reached ${nextHub} Hub`,
          source: 'RFID_SCANNER'
        });
      } else {
        generatedEvent = createEvent({
          type: 'HUB_UPDATE',
          shipmentId: targetShipment.trackingNumber,
          message: `${targetShipment.trackingNumber} outbound manifest verified at ${targetShipment.currentLocation} Hub.`,
          source: 'SYSTEM'
        });
      }
    } else if (cycle === 3) {
      // Occasional minor delay warning or traffic alert
      generatedEvent = createEvent({
        type: 'DELAY_EVENT',
        shipmentId: targetShipment.trackingNumber,
        message: `Weather slowdown detected along Interstate corridor near ${targetShipment.currentLocation} Hub (+10 min buffer advisory).`,
        source: 'LEGACY_QUEUE'
      });
    } else {
      // System legacy sync heartbeat
      generatedEvent = createEvent({
        type: 'SYNC',
        shipmentId: null,
        message: `Legacy IBM MQ scanner batch synchronized (4,120 packets processed across 5 hubs).`,
        source: 'LEGACY_QUEUE'
      });
    }

    return generatedEvent;
  } catch (err) {
    console.error('Error during simulation tick:', err.message);
    return null;
  }
}

function startSimulation(intervalMs = 4000) {
  if (isSimulationActive) return { active: true, message: 'Simulation is already running.' };
  
  isSimulationActive = true;
  simulationInterval = setInterval(() => {
    tickSimulation();
  }, intervalMs);

  console.log(`✓ Live Legacy Simulation started (interval: ${intervalMs}ms)`);
  return { active: true, message: 'Simulation started successfully.' };
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isSimulationActive = false;
  console.log('✓ Live Legacy Simulation paused.');
  return { active: false, message: 'Simulation stopped successfully.' };
}

function getSimulationStatus() {
  return {
    active: isSimulationActive
  };
}

module.exports = {
  startSimulation,
  stopSimulation,
  getSimulationStatus,
  tickSimulation
};
