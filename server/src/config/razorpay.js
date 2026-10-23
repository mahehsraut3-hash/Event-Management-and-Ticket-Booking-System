const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Check if actual production/test Razorpay API credentials have been configured
const isConfigured = Boolean(
  keyId &&
  keySecret &&
  keyId !== 'rzp_test_your_key_id' &&
  !keyId.startsWith('rzp_test_placeholder')
);

let razorpayInstance = null;

if (isConfigured) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('[Razorpay] Razorpay SDK initialized in test mode with Key ID:', keyId.substring(0, 8) + '...');
  } catch (err) {
    console.warn('[Razorpay] Failed to initialize Razorpay instance:', err.message);
  }
} else {
  console.log('[Razorpay] Razorpay credentials not configured or using demo placeholder. Test simulated mode enabled.');
}

/**
 * Verify Razorpay payment signature
 * @param {string} orderId 
 * @param {string} paymentId 
 * @param {string} signature 
 * @returns {boolean}
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature) return false;

  // In simulated test mode with demo credentials, accept simulated signatures
  if (!isConfigured || orderId.startsWith('order_sim_')) {
    return signature.startsWith('sig_sim_') || signature.length >= 10;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

/**
 * Verify Razorpay webhook signature
 * @param {string|Buffer} rawBody 
 * @param {string} signature 
 * @returns {boolean}
 */
const verifyWebhookSignature = (rawBody, signature) => {
  if (!webhookSecret || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  razorpayInstance,
  isConfigured,
  keyId,
  verifyPaymentSignature,
  verifyWebhookSignature
};
