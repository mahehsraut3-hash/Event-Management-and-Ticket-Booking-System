const { Booking, Event, Ticket } = require('../models');
const { generateTicketCode, generateSignedQrToken } = require('../utils/qrToken');
const { generateId } = require('../models/dataStore');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create online ticket booking with atomic inventory reservation
 * @route   POST /api/bookings
 * @access  Private (Attendee | Organizer | Admin)
 */
const createBooking = async (req, res) => {
  try {
    const { eventId, tickets } = req.body;
    const userId = req.user._id;

    // 1. Basic validation
    if (!eventId) {
      return errorResponse(res, 400, 'Please provide an eventId');
    }

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return errorResponse(res, 400, 'Please select at least one ticket to book');
    }

    // 2. Fetch event
    const event = await Event.findById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    if (event.status !== 'published') {
      return errorResponse(res, 400, 'This event is not published or currently unavailable for booking');
    }

    if (new Date(event.startDateTime) < new Date()) {
      return errorResponse(res, 400, 'Cannot book tickets for an event that has already passed');
    }

    // 3. Validate inventory and calculate totals
    let totalAmount = 0;
    const reservedTickets = [];

    // Verify all tiers first before updating anything (prevent partial overselling)
    for (const item of tickets) {
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return errorResponse(res, 400, `Invalid ticket quantity for tier ${item.ticketTypeName}`);
      }

      const tier = event.ticketTypes.find(
        (t) => t.name.toLowerCase() === (item.ticketTypeName || '').toLowerCase()
      );

      if (!tier) {
        return errorResponse(res, 400, `Ticket tier '${item.ticketTypeName}' was not found for this event`);
      }

      const available = (tier.totalQuantity || 0) - (tier.soldQuantity || 0);
      if (quantity > available) {
        return errorResponse(
          res,
          400,
          `Overselling prevented: Not enough tickets available for ${tier.name}. Requested: ${quantity}, Remaining: ${available}`
        );
      }

      totalAmount += tier.price * quantity;
      reservedTickets.push({
        ticketTypeName: tier.name,
        quantity,
        price: tier.price
      });
    }

    // 4. Reserve inventory atomically
    for (const reserved of reservedTickets) {
      const tierIndex = event.ticketTypes.findIndex(
        (t) => t.name.toLowerCase() === reserved.ticketTypeName.toLowerCase()
      );

      if (tierIndex !== -1) {
        await Event.findByIdAndUpdate(event._id, {
          $inc: { [`ticketTypes.${tierIndex}.soldQuantity`]: reserved.quantity }
        });
      }
    }

    // 5. Create Booking record
    const booking = await Booking.create({
      user: userId,
      event: event._id,
      tickets: reservedTickets,
      totalAmount,
      paymentStatus: 'pending',
      bookingStatus: 'confirmed'
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('event', 'title bannerImage startDateTime endDateTime venue city status')
      .populate('user', 'name email');

    return successResponse(res, 201, 'Booking reserved successfully', {
      booking: populatedBooking
    });
  } catch (error) {
    console.error('[BookingController createBooking Error]:', error);
    return errorResponse(res, 500, 'Failed to create booking', error.message);
  }
};

/**
 * @desc    Get all bookings belonging to the currently logged in user
 * @route   GET /api/bookings/my
 * @access  Private
 */
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ user: userId })
      .populate('event', 'title bannerImage startDateTime endDateTime venue city status')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'User bookings retrieved', {
      bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('[BookingController getMyBookings Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve bookings', error.message);
  }
};

/**
 * @desc    Get specific booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id)
      .populate('event', 'title bannerImage startDateTime endDateTime venue city status organizer')
      .populate('user', 'name email');

    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    // Authorization: owner, event organizer, or admin
    const isOwner = booking.user?._id?.toString() === userId.toString();
    const isEventOrg = booking.event?.organizer?.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isEventOrg && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not have access to this booking');
    }

    return successResponse(res, 200, 'Booking retrieved successfully', { booking });
  } catch (error) {
    console.error('[BookingController getBookingById Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve booking details', error.message);
  }
};

/**
 * @desc    Simulate mock payment completion for a booking
 * @route   PATCH /api/bookings/:id/pay
 * @access  Private
 */
const payBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    if (booking.user?.toString() !== userId.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Forbidden: You do not own this booking');
    }

    if (booking.bookingStatus === 'cancelled') {
      return errorResponse(res, 400, 'Cannot pay for a cancelled booking');
    }

    if (booking.paymentStatus === 'paid') {
      return successResponse(res, 200, 'Booking is already paid', { booking });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      {
        $set: {
          paymentStatus: 'paid'
        }
      },
      { new: true }
    );

    // Generate one cryptographically signed Ticket per reserved seat
    const existingTickets = await Ticket.find({ booking: booking._id });
    const generatedTickets = [];

    if (existingTickets.length === 0 && Array.isArray(booking.tickets)) {
      const event = await Event.findById(booking.event._id || booking.event);
      const city = event?.city || 'TBS';

      for (const item of booking.tickets) {
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
          const ticketId = generateId();
          const ticketCode = generateTicketCode(city);
          const qrData = generateSignedQrToken({
            ticketId,
            ticketCode,
            eventId: (booking.event._id || booking.event).toString(),
            userId: (booking.user._id || booking.user).toString(),
            tierName: item.ticketTypeName
          });

          const newTicket = await Ticket.create({
            _id: ticketId,
            id: ticketId,
            booking: booking._id,
            event: booking.event._id || booking.event,
            user: booking.user._id || booking.user,
            ticketTypeName: item.ticketTypeName,
            ticketCode,
            qrData,
            isUsed: false,
            usedAt: null
          });
          generatedTickets.push(newTicket);
        }
      }
    }

    const populated = await Booking.findById(id)
      .populate('event', 'title bannerImage startDateTime endDateTime venue city')
      .populate('user', 'name email');

    return successResponse(res, 200, 'Mock payment completed successfully! Booking marked as paid.', {
      booking: populated,
      ticketsGenerated: generatedTickets.length
    });
  } catch (error) {
    console.error('[BookingController payBooking Error]:', error);
    return errorResponse(res, 500, 'Payment processing simulation failed', error.message);
  }
};

/**
 * @desc    Cancel booking and release reserved ticket inventory back to the event
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('event');
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    if (booking.user?.toString() !== userId.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Forbidden: You do not have permission to cancel this booking');
    }

    if (booking.bookingStatus === 'cancelled') {
      return errorResponse(res, 400, 'This booking has already been cancelled');
    }

    // Check if event has already started
    if (booking.event && new Date(booking.event.startDateTime) <= new Date()) {
      return errorResponse(
        res,
        400,
        'Cannot cancel booking: Event has already started or concluded.'
      );
    }

    // Release ticket inventory back to the event
    if (booking.event && Array.isArray(booking.tickets)) {
      const event = await Event.findById(booking.event._id || booking.event);
      if (event && event.ticketTypes) {
        for (const bookedTicket of booking.tickets) {
          const tierIndex = event.ticketTypes.findIndex(
            (t) => t.name.toLowerCase() === bookedTicket.ticketTypeName.toLowerCase()
          );

          if (tierIndex !== -1) {
            // Decrement soldQuantity (releasing inventory)
            await Event.findByIdAndUpdate(event._id, {
              $inc: { [`ticketTypes.${tierIndex}.soldQuantity`]: -bookedTicket.quantity }
            });
          }
        }
      }
    }

    // Mark booking as cancelled
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      {
        $set: {
          bookingStatus: 'cancelled'
        }
      },
      { new: true }
    );

    const populated = await Booking.findById(id)
      .populate('event', 'title bannerImage startDateTime endDateTime venue city status')
      .populate('user', 'name email');

    return successResponse(res, 200, 'Booking cancelled successfully and ticket inventory restored', {
      booking: populated
    });
  } catch (error) {
    console.error('[BookingController cancelBooking Error]:', error);
    return errorResponse(res, 500, 'Failed to cancel booking', error.message);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  payBooking,
  cancelBooking
};
