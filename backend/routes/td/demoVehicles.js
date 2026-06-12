const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/demoVehicleController');
const { protect, authorize } = require('../../middleware/auth');

// Public: available vehicles for booking
router.get('/available', ctrl.getAvailableVehicles);

// All routes below require authentication
router.use(protect);

router.get('/', ctrl.getVehicles);
router.get('/:id', ctrl.getVehicleById);
router.post('/', authorize('superadmin', 'manager'), ctrl.createVehicle);
router.put('/:id', authorize('superadmin', 'manager'), ctrl.updateVehicle);
router.patch('/:id/status', authorize('superadmin', 'manager'), ctrl.updateVehicleStatus);
router.delete('/:id', authorize('superadmin'), ctrl.deleteVehicle);

module.exports = router;
