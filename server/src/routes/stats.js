const express = require('express');
const router = express.Router();
const shipmentService = require('../services/shipmentService');

// GET /api/stats
router.get('/', (req, res) => {
  try {
    const stats = shipmentService.getPlatformStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
