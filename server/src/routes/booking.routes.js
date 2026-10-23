const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  payBooking,
  cancelBooking
} = require('../controllers/booking.controller');
const { protect } = require('../middleware/authMiddleware');

// All booking operations require authentication
router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/:id', getBookingById);
router.patch('/:id/pay', payBooking);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
