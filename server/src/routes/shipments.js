const express = require('express');
const router = express.Router();
const shipmentService = require('../services/shipmentService');

// GET /api/shipments
router.get('/', (req, res) => {
  try {
    const shipments = shipmentService.getAllShipments();
    res.json({ success: true, count: shipments.length, data: shipments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shipments/:id
router.get('/:id', (req, res) => {
  try {
    const shipment = shipmentService.getShipmentById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ success: false, error: 'Shipment not found' });
    }
    res.json({ success: true, data: shipment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipments/:id/delay
router.post('/:id/delay', (req, res) => {
  try {
    const { minutes } = req.body || {};
    const updated = shipmentService.simulateDelay(req.params.id, minutes || 20);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipments/:id/recalculate
router.post('/:id/recalculate', (req, res) => {
  try {
    const result = shipmentService.recalculateRoute(req.params.id);
    res.json({
      success: true,
      shipmentId: result.shipmentId,
      trackingNumber: result.trackingNumber,
      path: result.path,
      travelTimeMinutes: result.travelTimeMinutes,
      data: result.shipment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipments/:id/apply-route
router.post('/:id/apply-route', (req, res) => {
  try {
    const updated = shipmentService.applyRoute(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
