const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/customerController');
const { protect, authorize } = require('../../middleware/auth');

// Public customer routes (no auth)
router.post('/register', ctrl.registerCustomer);
router.post('/send-otp', ctrl.sendOtp);
router.post('/verify-otp', ctrl.verifyOtp);
router.post('/upload-dl', ctrl.uploadDL);

// Admin protected routes
router.use(protect);

router.get('/', ctrl.getCustomers);
router.get('/:id', ctrl.getCustomerById);
router.put('/:id', authorize('superadmin', 'manager'), ctrl.updateCustomer);

// Required by routes/index.js: require('./td/customers').router
module.exports = { router };
