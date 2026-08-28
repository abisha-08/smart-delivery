const express = require('express');
const router = express.Router();
const routeService = require('../services/routeService');

// GET /api/network
router.get('/', (req, res) => {
  try {
    const data = routeService.getNetworkData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/network/routes/:id/delay
router.post('/routes/:id/delay', (req, res) => {
  try {
    const { delayMinutes, status } = req.body;
    const updated = routeService.updateRouteStatus(req.params.id, status || 'DELAYED', delayMinutes || 15);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
