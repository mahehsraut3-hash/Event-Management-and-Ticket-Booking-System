const express = require('express');
const router = express.Router();
const {
  getTicketById,
  getTicketsByBooking,
  getMyTickets,
  validateTicket
} = require('../controllers/ticket.controller');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All ticket routes require authentication
router.use(protect);

// Attendee / Owner routes
router.get('/my', getMyTickets);
router.get('/booking/:bookingId', getTicketsByBooking);

// Gate Validation (Organizer or Admin only)
router.post('/validate', requireRole('organizer', 'admin'), validateTicket);

// Single ticket details
router.get('/:id', getTicketById);

module.exports = router;
