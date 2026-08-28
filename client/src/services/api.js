import { offlineStorage } from './offlineStorage';
import { evaluateShipmentStatus, addMinutesToTimeString } from '../utils/riskDetection';
import { calculateClientDijkstra } from '../utils/networkUtils';

const BASE_URL = '/api';

/**
 * Determine if system is currently considered offline
 */
export function isOffline() {
  return offlineStorage.isSimulatedOffline() || !navigator.onLine;
}

/**
 * Robust fetch wrapper with timeout
 */
async function request(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const api = {
  /**
   * Health check
   */
  async getHealth() {
    if (offlineStorage.isSimulatedOffline()) {
      return { status: 'OFFLINE_MODE', simulated: true };
    }
    try {
      return await request(`${BASE_URL}/health`);
    } catch (e) {
      return { status: 'UNAVAILABLE', error: e.message };
    }
  },

  /**
   * Fetch all shipments
   */
  async getShipments() {
    if (isOffline()) {
      const cached = offlineStorage.getCachedShipments();
      return { success: true, count: cached.length, data: cached, isOffline: true };
    }

    try {
      const res = await request(`${BASE_URL}/shipments`);
      if (res.success && Array.isArray(res.data)) {
        offlineStorage.saveCachedShipments(res.data);
      }
      return res;
    } catch (err) {
      console.warn('[API] Fetch shipments failed, falling back to cache:', err.message);
      const cached = offlineStorage.getCachedShipments();
      return { success: true, count: cached.length, data: cached, isOffline: true };
    }
  },

  /**
   * Fetch single shipment
   */
  async getShipment(idOrTracking) {
    if (isOffline()) {
      const cached = offlineStorage.getCachedShipments();
      const found = cached.find(s => s.id === idOrTracking || s.trackingNumber === idOrTracking);
      return { success: !!found, data: found, isOffline: true };
    }

    try {
      return await request(`${BASE_URL}/shipments/${idOrTracking}`);
    } catch (err) {
      const cached = offlineStorage.getCachedShipments();
      const found = cached.find(s => s.id === idOrTracking || s.trackingNumber === idOrTracking);
      return { success: !!found, data: found, isOffline: true };
    }
  },

  /**
   * Fetch dynamic dashboard stats
   */
  async getStats() {
    if (isOffline()) {
      const cached = offlineStorage.getCachedShipments();
      const activeShipments = cached.length || 12;
      const atRisk = cached.filter(s => s.status === 'AT_RISK').length;
      const delayed = cached.filter(s => s.status === 'DELAYED').length;
      const inTransit = cached.filter(s => s.currentLocation !== s.destination).length;
      const stats = { activeShipments, atRisk, inTransit, delayed };
      offlineStorage.saveCachedStats(stats);
      return { success: true, data: stats, isOffline: true };
    }

    try {
      const res = await request(`${BASE_URL}/stats`);
      if (res.success) {
        offlineStorage.saveCachedStats(res.data);
      }
      return res;
    } catch (err) {
      const stats = offlineStorage.getCachedStats();
      return { success: true, data: stats, isOffline: true };
    }
  },

  /**
   * Fetch Network data (hubs and routes)
   */
  async getNetwork() {
    if (isOffline()) {
      const cached = offlineStorage.getCachedNetwork();
      return { success: true, data: cached, isOffline: true };
    }

    try {
      const res = await request(`${BASE_URL}/network`);
      if (res.success && res.data) {
        offlineStorage.saveCachedNetwork(res.data);
      }
      return res;
    } catch (err) {
      const cached = offlineStorage.getCachedNetwork();
      return { success: true, data: cached, isOffline: true };
    }
  },

  /**
   * Fetch Live Events
   */
  async getEvents(params = {}) {
    if (isOffline()) {
      const cached = offlineStorage.getCachedEvents();
      let filtered = [...cached];
      if (params.type && params.type !== 'ALL') {
        filtered = filtered.filter(e => e.type === params.type);
      }
      if (params.shipmentId) {
        filtered = filtered.filter(e => e.shipment_id === params.shipmentId);
      }
      return { success: true, count: filtered.length, countToday: filtered.length, data: filtered, isOffline: true };
    }

    try {
      const query = new URLSearchParams(params).toString();
      const res = await request(`${BASE_URL}/events${query ? '?' + query : ''}`);
      if (res.success && Array.isArray(res.data)) {
        offlineStorage.saveCachedEvents(res.data);
      }
      return res;
    } catch (err) {
      const cached = offlineStorage.getCachedEvents();
      return { success: true, count: cached.length, countToday: cached.length, data: cached, isOffline: true };
    }
  },

  /**
   * Simulate Delay (Online OR Queued Offline)
   */
  async simulateDelay(shipmentId, minutes = 20) {
    if (isOffline()) {
      // Offline local handling
      const shipments = offlineStorage.getCachedShipments();
      const index = shipments.findIndex(s => s.id === shipmentId || s.trackingNumber === shipmentId);
      if (index === -1) throw new Error('Shipment not found in local cache');

      const s = shipments[index];
      const newDelay = (s.delayMinutes || 0) + minutes;
      const newEta = addMinutesToTimeString(s.eta, minutes);
      const newStatus = evaluateShipmentStatus(newEta, s.deadline, newDelay);

      const updated = {
        ...s,
        delayMinutes: newDelay,
        eta: newEta,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      shipments[index] = updated;
      offlineStorage.saveCachedShipments(shipments);

      // Create local event
      const localEvents = offlineStorage.getCachedEvents();
      const newEvent = {
        id: 'EVT-OFF-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'DELAY_EVENT',
        shipment_id: s.trackingNumber,
        message: `[OFFLINE] Delay detected for ${s.trackingNumber}: +${minutes}m accumulated delay (New ETA: ${newEta}, Status: ${newStatus.replace('_', ' ')})`,
        source: 'USER'
      };
      localEvents.unshift(newEvent);
      offlineStorage.saveCachedEvents(localEvents);

      // Queue action for sync
      offlineStorage.addToPendingQueue({
        type: 'DELAY_EVENT',
        shipmentId: s.id,
        trackingNumber: s.trackingNumber,
        payload: { minutesToAdd: minutes }
      });

      return { success: true, data: updated, isOffline: true };
    }

    try {
      const res = await request(`${BASE_URL}/shipments/${shipmentId}/delay`, {
        method: 'POST',
        body: JSON.stringify({ minutes })
      });
      return res;
    } catch (err) {
      // Fallback offline queue
      offlineStorage.setSimulatedOffline(true);
      return this.simulateDelay(shipmentId, minutes);
    }
  },

  /**
   * Simulate Sudden Disruption (Weather, Traffic, Hub Congestion, Connectivity Loss)
   */
  async simulateDisruption(shipmentId, disruptionType = 'WEATHER', options = {}) {
    const rawType = disruptionType.toUpperCase();

    // Special Case: Connectivity Loss directly activates offline mode & queues locally
    if (rawType.includes('CONNECTIVITY') || rawType.includes('OFFLINE')) {
      offlineStorage.setSimulatedOffline(true);
      const shipments = offlineStorage.getCachedShipments();
      const s = shipments.find(item => item.id === shipmentId || item.trackingNumber === shipmentId) || shipments[0];
      
      const localEvents = offlineStorage.getCachedEvents();
      const newEvent = {
        id: 'EVT-OFF-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'SYNC',
        shipment_id: s?.trackingNumber || null,
        message: `[CONNECTIVITY LOSS] Telemetry link dropped at ${s?.currentLocation || 'Denver'} Hub. Operating in local cache mode.`,
        source: 'SYSTEM'
      };
      localEvents.unshift(newEvent);
      offlineStorage.saveCachedEvents(localEvents);

      return {
        success: true,
        disruptionType: 'CONNECTIVITY_LOSS',
        delayAdded: 0,
        isOfflineTrigger: true,
        data: s,
        isOffline: true
      };
    }

    if (isOffline()) {
      // Offline local handling
      const shipments = offlineStorage.getCachedShipments();
      const index = shipments.findIndex(s => s.id === shipmentId || s.trackingNumber === shipmentId);
      if (index === -1) throw new Error('Shipment not found in local cache');

      const s = shipments[index];
      let delayAdded = 0;
      let eventPrefix = '';

      if (rawType.includes('WEATHER')) {
        delayAdded = options.minutes || 45;
        eventPrefix = `[WEATHER DISRUPTION] Severe weather along ${s.currentLocation} → ${s.destination} corridor`;
      } else if (rawType.includes('TRAFFIC')) {
        delayAdded = options.minutes || 35;
        eventPrefix = `[TRAFFIC DISRUPTION] Highway congestion detected on ${s.currentLocation} → ${s.destination} corridor`;
      } else if (rawType.includes('HUB') || rawType.includes('CONGESTION')) {
        delayAdded = options.minutes || 25;
        eventPrefix = `[HUB CONGESTION] Sorting facility backlog at ${s.currentLocation} Hub`;
      } else {
        delayAdded = options.minutes || 30;
        eventPrefix = `[DISRUPTION] Operational slowdown detected`;
      }

      const newDelay = (s.delayMinutes || 0) + delayAdded;
      const newEta = addMinutesToTimeString(s.eta, delayAdded);
      const newStatus = evaluateShipmentStatus(newEta, s.deadline, newDelay);

      // Local Dijkstra recommendation
      const network = offlineStorage.getCachedNetwork();
      let recommendedRoute = s.recommendedRoute;
      let travelTimeMinutes = null;
      if (newStatus === 'AT_RISK' || newStatus === 'DELAYED') {
        const dijkstraRes = calculateClientDijkstra(s.currentLocation, s.destination, network.routes || []);
        recommendedRoute = dijkstraRes.path;
        travelTimeMinutes = dijkstraRes.distance;
      }

      const updated = {
        ...s,
        delayMinutes: newDelay,
        eta: newEta,
        status: newStatus,
        recommendedRoute,
        updatedAt: new Date().toISOString()
      };
      shipments[index] = updated;
      offlineStorage.saveCachedShipments(shipments);

      // Create local events
      const localEvents = offlineStorage.getCachedEvents();
      localEvents.unshift({
        id: 'EVT-OFF-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: rawType.includes('HUB') ? 'HUB_UPDATE' : 'DELAY_EVENT',
        shipment_id: s.trackingNumber,
        message: `[OFFLINE] ${eventPrefix}: +${delayAdded}m delay for ${s.trackingNumber} (New ETA: ${newEta}, Status: ${newStatus.replace('_', ' ')})`,
        source: 'SYSTEM'
      });

      if (recommendedRoute && recommendedRoute.length > 0) {
        localEvents.unshift({
          id: 'EVT-OFF-' + (Date.now() + 1),
          timestamp: new Date().toISOString(),
          type: 'ROUTE_UPDATE',
          shipment_id: s.trackingNumber,
          message: `[OFFLINE] Fastest alternative route calculated for ${s.trackingNumber}: ${recommendedRoute.join(' → ')} (${travelTimeMinutes || 230} min)`,
          source: 'SYSTEM'
        });
      }

      offlineStorage.saveCachedEvents(localEvents);

      // Queue action for sync
      offlineStorage.addToPendingQueue({
        type: 'DISRUPTION',
        shipmentId: s.id,
        trackingNumber: s.trackingNumber,
        payload: {
          disruptionType: rawType,
          minutes: delayAdded
        }
      });

      return {
        success: true,
        data: updated,
        disruptionType: rawType,
        delayAdded,
        newEta,
        newStatus,
        recommendedRoute,
        travelTimeMinutes,
        isOffline: true
      };
    }

    try {
      const res = await request(`${BASE_URL}/shipments/${shipmentId}/disruption`, {
        method: 'POST',
        body: JSON.stringify({
          disruptionType: rawType,
          minutes: options.minutes
        })
      });
      return res;
    } catch (err) {
      offlineStorage.setSimulatedOffline(true);
      return this.simulateDisruption(shipmentId, rawType, options);
    }
  },

  /**
   * Recalculate Fastest Route using Dijkstra (Online OR Local Dijkstra Offline)
   */
  async recalculateRoute(shipmentId) {
    if (isOffline()) {
      const shipments = offlineStorage.getCachedShipments();
      const index = shipments.findIndex(s => s.id === shipmentId || s.trackingNumber === shipmentId);
      if (index === -1) throw new Error('Shipment not found in local cache');

      const s = shipments[index];
      const network = offlineStorage.getCachedNetwork();
      const dijkstraResult = calculateClientDijkstra(s.currentLocation, s.destination, network.routes || []);

      const updated = {
        ...s,
        recommendedRoute: dijkstraResult.path,
        updatedAt: new Date().toISOString()
      };
      shipments[index] = updated;
      offlineStorage.saveCachedShipments(shipments);

      // Create local event
      const localEvents = offlineStorage.getCachedEvents();
      const newEvent = {
        id: 'EVT-OFF-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'ROUTE_UPDATE',
        shipment_id: s.trackingNumber,
        message: `[OFFLINE] Fastest alternative route calculated for ${s.trackingNumber}: ${dijkstraResult.path.join(' → ')} (${dijkstraResult.distance} min)`,
        source: 'SYSTEM'
      };
      localEvents.unshift(newEvent);
      offlineStorage.saveCachedEvents(localEvents);

      offlineStorage.addToPendingQueue({
        type: 'RECALCULATE_ROUTE',
        shipmentId: s.id,
        trackingNumber: s.trackingNumber,
        payload: { path: dijkstraResult.path }
      });

      return {
        success: true,
        shipmentId: s.id,
        trackingNumber: s.trackingNumber,
        path: dijkstraResult.path,
        travelTimeMinutes: dijkstraResult.distance,
        data: updated,
        isOffline: true
      };
    }

    try {
      const res = await request(`${BASE_URL}/shipments/${shipmentId}/recalculate`, {
        method: 'POST'
      });
      return res;
    } catch (err) {
      offlineStorage.setSimulatedOffline(true);
      return this.recalculateRoute(shipmentId);
    }
  },

  /**
   * Apply Recommended Route (Online OR Offline)
   */
  async applyRoute(shipmentId) {
    if (isOffline()) {
      const shipments = offlineStorage.getCachedShipments();
      const index = shipments.findIndex(s => s.id === shipmentId || s.trackingNumber === shipmentId);
      if (index === -1) throw new Error('Shipment not found in local cache');

      const s = shipments[index];
      const newRoute = s.recommendedRoute || ['Denver', 'Dallas', 'Houston'];
      const optimizedDelay = Math.max(0, (s.delayMinutes || 0) - 15);
      const optimizedEta = addMinutesToTimeString(s.eta, -15);
      const newStatus = evaluateShipmentStatus(optimizedEta, s.deadline, optimizedDelay);

      const updated = {
        ...s,
        route: newRoute,
        recommendedRoute: null,
        delayMinutes: optimizedDelay,
        eta: optimizedEta,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      shipments[index] = updated;
      offlineStorage.saveCachedShipments(shipments);

      // Create local event
      const localEvents = offlineStorage.getCachedEvents();
      const newEvent = {
        id: 'EVT-OFF-' + Date.now(),
        timestamp: new Date().toISOString(),
        type: 'ROUTE_UPDATE',
        shipment_id: s.trackingNumber,
        message: `[OFFLINE] Alternative route applied for ${s.trackingNumber}: ${newRoute.join(' → ')} (ETA improved to ${optimizedEta})`,
        source: 'USER'
      };
      localEvents.unshift(newEvent);
      offlineStorage.saveCachedEvents(localEvents);

      offlineStorage.addToPendingQueue({
        type: 'APPLY_ROUTE',
        shipmentId: s.id,
        trackingNumber: s.trackingNumber,
        payload: { newRoute }
      });

      return { success: true, data: updated, isOffline: true };
    }

    try {
      const res = await request(`${BASE_URL}/shipments/${shipmentId}/apply-route`, {
        method: 'POST'
      });
      return res;
    } catch (err) {
      offlineStorage.setSimulatedOffline(true);
      return this.applyRoute(shipmentId);
    }
  },

  /**
   * Sync Queued Actions to Backend
   */
  async syncQueue() {
    const queue = offlineStorage.getPendingQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    try {
      const res = await request(`${BASE_URL}/sync`, {
        method: 'POST',
        body: JSON.stringify(queue)
      });

      if (res.success) {
        offlineStorage.clearPendingQueue();
        // Refresh local cache from backend
        const freshShipments = await request(`${BASE_URL}/shipments`).catch(() => null);
        if (freshShipments?.data) offlineStorage.saveCachedShipments(freshShipments.data);
        const freshEvents = await request(`${BASE_URL}/events`).catch(() => null);
        if (freshEvents?.data) offlineStorage.saveCachedEvents(freshEvents.data);
        const freshNetwork = await request(`${BASE_URL}/network`).catch(() => null);
        if (freshNetwork?.data) offlineStorage.saveCachedNetwork(freshNetwork.data);
      }

      return res;
    } catch (err) {
      console.error('[API] Sync failed:', err);
      throw err;
    }
  },

  /**
   * Live Simulation Controls
   */
  async startSimulation() {
    try {
      return await request(`${BASE_URL}/simulation/start`, { method: 'POST' });
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async stopSimulation() {
    try {
      return await request(`${BASE_URL}/simulation/stop`, { method: 'POST' });
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getSimulationStatus() {
    try {
      return await request(`${BASE_URL}/simulation/status`);
    } catch (e) {
      return { success: false, active: false };
    }
  },

  /**
   * Reset Demo Data
   */
  async resetDemoData() {
    offlineStorage.clearAllCache();
    try {
      return await request(`${BASE_URL}/reset-demo`, { method: 'POST' });
    } catch (e) {
      return { success: true, message: 'Local cache reset complete.' };
    }
  }
};
