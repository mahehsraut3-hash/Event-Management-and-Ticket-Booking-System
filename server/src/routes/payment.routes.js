const express = require('express');
const router = express.Router();
const {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  handleWebhook
} = require('../controllers/payment.controller');
const { protect } = require('../middleware/authMiddleware');

// Public webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected payment endpoints
router.get('/config', protect, getPaymentConfig);
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
