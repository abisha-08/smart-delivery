/**
 * Offline Storage Service
 * Manages localStorage caching and pending action queues with complete fault tolerance.
 */

const STORAGE_KEYS = {
  SHIPMENTS: 'ups_cached_shipments',
  NETWORK: 'ups_cached_network',
  EVENTS: 'ups_cached_events',
  STATS: 'ups_cached_stats',
  PENDING_QUEUE: 'ups_pending_queue',
  SIMULATED_OFFLINE: 'ups_simulated_offline'
};

function safeGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to read ${key}:`, err);
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[OfflineStorage] Failed to write ${key}:`, err);
  }
}

export const offlineStorage = {
  // Shipments Cache
  getCachedShipments() {
    return safeGet(STORAGE_KEYS.SHIPMENTS, []);
  },
  saveCachedShipments(shipments) {
    safeSet(STORAGE_KEYS.SHIPMENTS, shipments);
  },

  // Network Cache
  getCachedNetwork() {
    return safeGet(STORAGE_KEYS.NETWORK, { hubs: [], routes: [] });
  },
  saveCachedNetwork(network) {
    safeSet(STORAGE_KEYS.NETWORK, network);
  },

  // Events Cache
  getCachedEvents() {
    return safeGet(STORAGE_KEYS.EVENTS, []);
  },
  saveCachedEvents(events) {
    safeSet(STORAGE_KEYS.EVENTS, events);
  },

  // Stats Cache
  getCachedStats() {
    return safeGet(STORAGE_KEYS.STATS, {
      activeShipments: 12,
      atRisk: 3,
      inTransit: 11,
      delayed: 2
    });
  },
  saveCachedStats(stats) {
    safeSet(STORAGE_KEYS.STATS, stats);
  },

  // Pending Actions Queue
  getPendingQueue() {
    return safeGet(STORAGE_KEYS.PENDING_QUEUE, []);
  },
  addToPendingQueue(action) {
    const queue = this.getPendingQueue();
    const item = {
      id: action.id || ('off-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
      type: action.type,
      shipmentId: action.shipmentId || null,
      payload: action.payload || {},
      timestamp: action.timestamp || new Date().toISOString()
    };
    queue.push(item);
    safeSet(STORAGE_KEYS.PENDING_QUEUE, queue);
    return item;
  },
  clearPendingQueue() {
    safeSet(STORAGE_KEYS.PENDING_QUEUE, []);
  },
  removePendingItem(id) {
    const queue = this.getPendingQueue().filter(item => item.id !== id);
    safeSet(STORAGE_KEYS.PENDING_QUEUE, queue);
  },

  // Simulated Offline Toggle
  isSimulatedOffline() {
    return safeGet(STORAGE_KEYS.SIMULATED_OFFLINE, false);
  },
  setSimulatedOffline(value) {
    safeSet(STORAGE_KEYS.SIMULATED_OFFLINE, Boolean(value));
  },

  // Clear Entire Cache (excluding reset)
  clearAllCache() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SHIPMENTS);
      localStorage.removeItem(STORAGE_KEYS.NETWORK);
      localStorage.removeItem(STORAGE_KEYS.EVENTS);
      localStorage.removeItem(STORAGE_KEYS.STATS);
      localStorage.removeItem(STORAGE_KEYS.PENDING_QUEUE);
      localStorage.removeItem(STORAGE_KEYS.SIMULATED_OFFLINE);
      console.log('✓ Offline cache cleared');
    } catch (e) {
      console.warn('Failed clearing cache:', e);
    }
  }
};
