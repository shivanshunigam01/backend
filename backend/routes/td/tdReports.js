const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/tdReportController');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.get('/admin', authorize('superadmin', 'manager'), ctrl.getAdminDashboard);
router.get('/manager', authorize('superadmin', 'manager'), ctrl.getManagerDashboard);
router.get('/executive', ctrl.getExecutiveDashboard);

module.exports = router;
