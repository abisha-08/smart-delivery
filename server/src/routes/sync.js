const express = require('express');
const router = express.Router();
const syncService = require('../services/syncService');

// POST /api/sync
router.post('/', (req, res) => {
  try {
    const actions = Array.isArray(req.body) ? req.body : (req.body?.actions || []);
    const result = syncService.processSyncQueue(actions);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
