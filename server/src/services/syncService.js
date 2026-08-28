const { getDb } = require('../database/db');
const { simulateDelay, applyRoute, recalculateRoute, updateShipmentLocation } = require('./shipmentService');
const { createEvent } = require('./eventService');

/**
 * Processes queued offline actions submitted by the frontend
 * @param {Array<Object>} actions
 * @returns {{ success: boolean, syncedCount: number, failedCount: number, errors: Array }}
 */
function processSyncQueue(actions = []) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0, errors: [] };
  }

  const db = getDb();
  let syncedCount = 0;
  let failedCount = 0;
  const errors = [];
  const nowStr = new Date().toISOString();

  const insertQueueRecord = db.prepare(`
    INSERT INTO sync_queue (id, event_type, payload_json, created_at, synced)
    VALUES (?, ?, ?, ?, 1)
  `);

  for (const action of actions) {
    try {
      const actionId = action.id || ('SYNC-ACT-' + Math.random().toString(36).substring(2, 9));
      const type = action.type;
      const shipmentId = action.shipmentId || action.trackingNumber;
      const payload = action.payload || {};

      switch (type) {
        case 'DELAY_EVENT':
        case 'SIMULATE_DELAY':
          if (shipmentId) {
            simulateDelay(shipmentId, payload.minutesToAdd || 20);
          }
          break;

        case 'ROUTE_UPDATE':
        case 'APPLY_ROUTE':
          if (shipmentId) {
            applyRoute(shipmentId);
          }
          break;

        case 'RECALCULATE_ROUTE':
          if (shipmentId) {
            recalculateRoute(shipmentId);
          }
          break;

        case 'PACKAGE_EVENT':
        case 'RFID_SCAN':
          if (shipmentId && payload.location) {
            updateShipmentLocation(shipmentId, payload.location, 'OFFLINE_SYNC');
          }
          break;

        case 'HUB_UPDATE':
          if (payload.hubId && payload.status) {
            db.prepare('UPDATE hubs SET status = ? WHERE id = ? OR name LIKE ?').run(payload.status, payload.hubId, `%${payload.hubId}%`);
          }
          break;

        default:
          console.warn('Unknown sync action type:', type);
          break;
      }

      // Record in sync_queue table
      insertQueueRecord.run(actionId, type, JSON.stringify(action), action.timestamp || nowStr);
      syncedCount++;
    } catch (err) {
      console.error(`Failed to process action ${action.id}:`, err.message);
      failedCount++;
      errors.push({ id: action.id, error: err.message });
    }
  }

  // Create SYNC event log
  createEvent({
    type: 'SYNC',
    shipmentId: null,
    message: `Offline synchronization completed: ${syncedCount} queued action(s) reconciled to server SQLite database.`,
    source: 'USER'
  });

  return {
    success: true,
    syncedCount,
    failedCount,
    errors
  };
}

module.exports = {
  processSyncQueue
};
