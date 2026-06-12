const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/tdFeedbackController');
const { protect } = require('../../middleware/auth');

// Public: customers can submit feedback without admin auth
router.post('/submit', ctrl.submitFeedback);

router.use(protect);

router.get('/', ctrl.getFeedbacks);
router.get('/stats', ctrl.getFeedbackStats);
router.get('/booking/:bookingId', ctrl.getFeedbackByBooking);

module.exports = router;
