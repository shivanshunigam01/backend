const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/tdLogController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.get('/', ctrl.getLogs);
router.get('/:id', ctrl.getLogById);
router.post('/start', ctrl.startTestDrive);
router.patch('/:logId/end', ctrl.endTestDrive);
router.patch('/:logId/gps', ctrl.updateGpsRoute);

module.exports = router;
