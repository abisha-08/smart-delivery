const { getDb } = require('../database/db');

/**
 * Creates a system event in the database
 */
function createEvent({ type, shipmentId = null, message, source = 'SYSTEM', timestamp = null }) {
  const db = getDb();
  const id = 'EVT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const eventTime = timestamp || new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO events (id, timestamp, type, shipment_id, message, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, eventTime, type, shipmentId, message, source);

  return {
    id,
    timestamp: eventTime,
    type,
    shipment_id: shipmentId,
    message,
    source
  };
}

/**
 * Retrieves recent events
 */
function getEvents({ limit = 50, type = null, shipmentId = null } = {}) {
  const db = getDb();
  let query = 'SELECT * FROM events';
  const conditions = [];
  const params = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (shipmentId) {
    conditions.push('shipment_id = ?');
    params.push(shipmentId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  return db.prepare(query).all(...params);
}

/**
 * Count events created today
 */
function getEventsCountToday() {
  const db = getDb();
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const row = db.prepare('SELECT COUNT(*) as count FROM events WHERE timestamp LIKE ?').get(`${todayPrefix}%`);
  return row ? row.count : 0;
}

module.exports = {
  createEvent,
  getEvents,
  getEventsCountToday
};
