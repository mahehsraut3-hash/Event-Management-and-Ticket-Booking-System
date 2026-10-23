const { Booking, Event } = require('../models');
const {
  razorpayInstance,
  isConfigured,
  keyId,
  verifyPaymentSignature,
  verifyWebhookSignature
} = require('../config/razorpay');
const { checkAndExpireSingleBooking } = require('../utils/bookingExpiry');
const { generateTicketsForBooking } = require('../utils/ticketGenerator');
const { sendBookingConfirmationEmail } = require('../utils/emailService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get payment configuration (Public Key ID, currency, mode)
 * @route   GET /api/payments/config
 * @access  Private
 */
const getPaymentConfig = async (req, res) => {
  return successResponse(res, 200, 'Payment gateway configuration', {
    keyId: isConfigured ? keyId : 'rzp_test_simulated_mode',
    currency: 'INR',
    isSimulated: !isConfigured,
    expirationMinutes: parseInt(process.env.BOOKING_EXPIRATION_MINUTES, 10) || 15
  });
};

/**
 * @desc    Create Razorpay Order for a pending booking
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      return errorResponse(res, 400, 'Please provide bookingId');
    }

    const booking = await Booking.findById(bookingId).populate('event');
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Ownership check
    const isOwner = (booking.user?._id || booking.user)?.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not own this booking');
    }

    // Check if expired
    const isExpired = await checkAndExpireSingleBooking(booking);
    if (isExpired || booking.bookingStatus === 'expired') {
      return errorResponse(res, 400, 'This booking has expired and ticket inventory was released. Please book again.');
    }

    if (booking.bookingStatus === 'cancelled') {
      return errorResponse(res, 400, 'Cannot pay for a cancelled booking');
    }

    if (booking.paymentStatus === 'paid') {
      return errorResponse(res, 400, 'This booking has already been paid and confirmed.');
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(booking.totalAmount) * 100);
    const currency = 'INR';

    let orderData = null;

    if (isConfigured && razorpayInstance) {
      try {
        orderData = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency,
          receipt: booking._id.toString(),
          notes: {
            bookingId: booking._id.toString(),
            eventId: (booking.event?._id || booking.event).toString(),
            userEmail: req.user.email
          }
        });
      } catch (rzpErr) {
        console.warn('[Razorpay API Warning]:', rzpErr.message, '- Falling back to test simulation');
      }
    }

    // Fallback to test simulation order if Razorpay credentials are demo or API unreachable
    if (!orderData) {
      const simOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      orderData = {
        id: simOrderId,
        amount: amountInPaise,
        currency,
        receipt: booking._id.toString(),
        status: 'created'
      };
    }

    // Save order ID to booking
    await Booking.findByIdAndUpdate(booking._id, {
      $set: { razorpayOrderId: orderData.id }
    });

    const expirationMinutes = parseInt(process.env.BOOKING_EXPIRATION_MINUTES, 10) || 15;
    const expiryTimestamp = booking.expiresAt
      ? new Date(booking.expiresAt).getTime()
      : new Date(booking.createdAt).getTime() + expirationMinutes * 60 * 1000;
    const remainingSeconds = Math.max(0, Math.floor((expiryTimestamp - Date.now()) / 1000));

    return successResponse(res, 201, 'Payment order created successfully', {
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: isConfigured ? keyId : 'rzp_test_simulated_mode',
      bookingId: booking._id,
      isSimulated: !isConfigured || orderData.id.startsWith('order_sim_'),
      expiresInSeconds: remainingSeconds
    });
  } catch (error) {
    console.error('[PaymentController createPaymentOrder Error]:', error);
    return errorResponse(res, 500, 'Failed to create payment order', error.message);
  }
};

/**
 * @desc    Verify Razorpay payment signature, confirm booking, and generate tickets
 * @route   POST /api/payments/verify
 * @access  Private
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      return errorResponse(res, 400, 'Booking ID is required');
    }

    const booking = await Booking.findById(bookingId).populate('event');
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Ownership check
    const isOwner = (booking.user?._id || booking.user)?.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not own this booking');
    }

    // Check expiry
    const isExpired = await checkAndExpireSingleBooking(booking);
    if (isExpired || booking.bookingStatus === 'expired') {
      return errorResponse(
        res,
        400,
        'Booking window expired before payment verification. Held inventory has been released.'
      );
    }

    // If already paid, return early
    if (booking.paymentStatus === 'paid') {
      const tickets = await generateTicketsForBooking(booking);
      const populated = await Booking.findById(bookingId)
        .populate('event', 'title bannerImage startDateTime endDateTime venue city')
        .populate('user', 'name email');

      return successResponse(res, 200, 'Payment already verified and tickets are active', {
        booking: populated,
        tickets
      });
    }

    // Signature verification
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return errorResponse(
        res,
        400,
        'Payment signature verification failed. The transaction payload could not be verified.'
      );
    }

    // Update booking to paid
    await Booking.findByIdAndUpdate(bookingId, {
      $set: {
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paymentDetails: {
          gateway: 'razorpay',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          paidAt: new Date()
        }
      }
    });

    // Generate cryptographic QR tickets
    const tickets = await generateTicketsForBooking(booking);

    const populated = await Booking.findById(bookingId)
      .populate('event', 'title bannerImage startDateTime endDateTime venue city')
      .populate('user', 'name email');

    // Send confirmation email asynchronously with QR tickets
    sendBookingConfirmationEmail({
      booking: populated,
      user: populated.user,
      tickets,
      event: populated.event
    }).catch(err => console.error('[PaymentController] Async email error:', err.message));

    return successResponse(res, 200, 'Payment verified successfully! Tickets generated.', {
      booking: populated,
      ticketsCount: tickets.length,
      tickets
    });
  } catch (error) {
    console.error('[PaymentController verifyPayment Error]:', error);
    return errorResponse(res, 500, 'Payment verification failed', error.message);
  }
};

/**
 * @desc    Handle Razorpay Webhooks (payment.captured, payment.failed, order.paid)
 * @route   POST /api/payments/webhook
 * @access  Public
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const eventPayload = req.body;

    // Verify webhook signature if configured
    if (process.env.RAZORPAY_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(req.body, signature);
      if (!isValid) {
        console.warn('[Webhook] Invalid Razorpay webhook signature');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const eventType = eventPayload?.event;
    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = eventPayload?.payload?.payment?.entity;
      const orderEntity = eventPayload?.payload?.order?.entity;

      const bookingId =
        paymentEntity?.notes?.bookingId ||
        orderEntity?.receipt ||
        orderEntity?.notes?.bookingId;

      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking && booking.paymentStatus !== 'paid') {
          await Booking.findByIdAndUpdate(bookingId, {
            $set: {
              paymentStatus: 'paid',
              bookingStatus: 'confirmed',
              razorpayOrderId: paymentEntity?.order_id || orderEntity?.id,
              razorpayPaymentId: paymentEntity?.id,
              paymentDetails: {
                gateway: 'razorpay-webhook',
                event: eventType,
                paymentId: paymentEntity?.id,
                orderId: paymentEntity?.order_id || orderEntity?.id,
                capturedAt: new Date()
              }
            }
          });

          const tickets = await generateTicketsForBooking(booking);
          console.log(`[Razorpay Webhook] Booking ${bookingId} confirmed and tickets created via webhook.`);

          const populated = await Booking.findById(bookingId)
            .populate('event', 'title bannerImage startDateTime endDateTime venue city')
            .populate('user', 'name email');

          sendBookingConfirmationEmail({
            booking: populated,
            user: populated.user,
            tickets,
            event: populated.event
          }).catch(err => console.error('[Webhook] Async email error:', err.message));
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = eventPayload?.payload?.payment?.entity;
      const bookingId = paymentEntity?.notes?.bookingId;

      if (bookingId) {
        console.warn(`[Razorpay Webhook] Payment failed for booking ${bookingId}:`, paymentEntity?.error_description);
      }
    }

    // Always acknowledge Razorpay webhooks with 200 OK
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[PaymentController handleWebhook Error]:', error);
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }
};

module.exports = {
  getPaymentConfig,
  createPaymentOrder,
  verifyPayment,
  handleWebhook
};
