const express = require('express');
const router = express.Router();
const eventService = require('../services/eventService');

// GET /api/events
router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const type = req.query.type || null;
    const shipmentId = req.query.shipmentId || null;

    const events = eventService.getEvents({ limit, type, shipmentId });
    const countToday = eventService.getEventsCountToday();

    res.json({
      success: true,
      count: events.length,
      countToday,
      data: events
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/events
router.post('/', (req, res) => {
  try {
    const { type, shipmentId, message, source, timestamp } = req.body;
    if (!type || !message) {
      return res.status(400).json({ success: false, error: 'Event type and message are required' });
    }

    const event = eventService.createEvent({
      type,
      shipmentId,
      message,
      source: source || 'SYSTEM',
      timestamp
    });

    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
