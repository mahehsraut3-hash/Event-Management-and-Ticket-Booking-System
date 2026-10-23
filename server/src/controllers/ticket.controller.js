const { Ticket, Event, Booking } = require('../models');
const { verifyQrToken } = require('../utils/qrToken');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get single ticket by ID
 * @route   GET /api/tickets/:id
 * @access  Private (Owner, Event Organizer, Admin)
 */
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const ticket = await Ticket.findById(id)
      .populate('event', 'title bannerImage startDateTime endDateTime venue city organizer')
      .populate('user', 'name email')
      .populate('booking', 'totalAmount paymentStatus bookingStatus createdAt');

    if (!ticket) {
      return errorResponse(res, 404, 'Ticket not found');
    }

    const isOwner = ticket.user?._id?.toString() === userId.toString();
    const isOrganizer = ticket.event?.organizer?.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not have access to view this ticket');
    }

    return successResponse(res, 200, 'Ticket retrieved successfully', { ticket });
  } catch (error) {
    console.error('[TicketController getTicketById Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve ticket', error.message);
  }
};

/**
 * @desc    Get all tickets for a specific booking
 * @route   GET /api/tickets/booking/:bookingId
 * @access  Private
 */
const getTicketsByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId).populate('event');
    if (!booking) {
      return errorResponse(res, 404, 'Booking not found');
    }

    const isOwner = booking.user?.toString() === userId.toString();
    const isOrganizer = booking.event?.organizer?.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isOrganizer && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not have access to tickets for this booking');
    }

    const tickets = await Ticket.find({ booking: bookingId })
      .populate('event', 'title bannerImage startDateTime endDateTime venue city')
      .populate('user', 'name email');

    return successResponse(res, 200, 'Booking tickets retrieved', {
      tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('[TicketController getTicketsByBooking Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve booking tickets', error.message);
  }
};

/**
 * @desc    Get all tickets for currently authenticated user
 * @route   GET /api/tickets/my
 * @access  Private
 */
const getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;

    const tickets = await Ticket.find({ user: userId })
      .populate('event', 'title bannerImage startDateTime endDateTime venue city')
      .populate('user', 'name email');

    return successResponse(res, 200, 'User tickets retrieved', {
      tickets,
      count: tickets.length
    });
  } catch (error) {
    console.error('[TicketController getMyTickets Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve tickets', error.message);
  }
};

/**
 * @desc    Validate scanned QR ticket token or manual ticket code at gate
 * @route   POST /api/tickets/validate
 * @access  Private (Organizer only)
 */
const validateTicket = async (req, res) => {
  try {
    const { qrData, ticketCode, eventId } = req.body;
    const organizerId = req.user._id;

    // 1. Basic request checks
    if (!eventId) {
      return res.status(400).json({
        success: false,
        result: 'INVALID',
        message: 'Missing eventId. Please select which event gate you are scanning for.'
      });
    }

    if (!qrData && !ticketCode) {
      return res.status(400).json({
        success: false,
        result: 'INVALID',
        message: 'Please provide either scanned qrData or a manual ticketCode.'
      });
    }

    // 2. Verify that the organizer owns this event or is an admin
    const gateEvent = await Event.findById(eventId);
    if (!gateEvent) {
      return res.status(404).json({
        success: false,
        result: 'INVALID',
        message: 'Specified event does not exist.'
      });
    }

    const isAuthorized =
      gateEvent.organizer?.toString() === organizerId.toString() ||
      gateEvent.organizer?._id?.toString() === organizerId.toString() ||
      req.user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        result: 'FORBIDDEN',
        message: 'You are not authorized to validate tickets for this event.'
      });
    }

    // 3. Locate ticket document
    let ticket = null;

    if (qrData) {
      // Cryptographic verification
      const verifyResult = verifyQrToken(qrData);
      if (!verifyResult.isValid || !verifyResult.payload) {
        return res.status(200).json({
          success: false,
          result: 'INVALID',
          message: 'INVALID: Cryptographic signature verification failed or QR data has been tampered with.',
          details: verifyResult.error
        });
      }

      const { ticketId, ticketCode: decodedCode } = verifyResult.payload;
      ticket = await Ticket.findOne({
        $or: [{ _id: ticketId }, { ticketCode: decodedCode }]
      })
        .populate('event', 'title startDateTime venue city')
        .populate('user', 'name email');

      if (!ticket) {
        return res.status(200).json({
          success: false,
          result: 'INVALID',
          message: 'INVALID: Ticket record not found in system database.'
        });
      }
    } else if (ticketCode) {
      // Manual code lookup fallback
      ticket = await Ticket.findOne({
        ticketCode: ticketCode.trim().toUpperCase()
      })
        .populate('event', 'title startDateTime venue city')
        .populate('user', 'name email');

      if (!ticket) {
        return res.status(200).json({
          success: false,
          result: 'INVALID',
          message: `INVALID: No ticket found matching code '${ticketCode.trim().toUpperCase()}'.`
        });
      }
    }

    // 4. Check if ticket is for this specific event
    const ticketEventId = (ticket.event?._id || ticket.event)?.toString();
    if (ticketEventId !== eventId.toString()) {
      return res.status(200).json({
        success: false,
        result: 'WRONG_EVENT',
        message: `WRONG EVENT: This ticket is for "${ticket.event?.title || 'Another Event'}", not for "${gateEvent.title}".`,
        ticket: {
          ticketCode: ticket.ticketCode,
          tierName: ticket.ticketTypeName,
          attendeeName: ticket.user?.name,
          ticketEvent: ticket.event?.title,
          gateEvent: gateEvent.title
        }
      });
    }

    // 5. Check if ticket has already been used
    if (ticket.isUsed) {
      const usedFormatted = ticket.usedAt ? new Date(ticket.usedAt).toLocaleTimeString() : 'earlier';
      return res.status(200).json({
        success: false,
        result: 'ALREADY_USED',
        message: `ALREADY USED: This ticket was already checked in at ${usedFormatted}. Entry denied.`,
        ticket: {
          ticketCode: ticket.ticketCode,
          tierName: ticket.ticketTypeName,
          attendeeName: ticket.user?.name,
          usedAt: ticket.usedAt
        }
      });
    }

    // 6. VALID! Mark ticket as used and record timestamp
    const now = new Date();
    await Ticket.findByIdAndUpdate(ticket._id, {
      $set: {
        isUsed: true,
        usedAt: now
      }
    });

    return res.status(200).json({
      success: true,
      result: 'VALID',
      message: 'VALID TICKET: Verification successful. Welcome to the event!',
      ticket: {
        _id: ticket._id,
        ticketCode: ticket.ticketCode,
        tierName: ticket.ticketTypeName,
        attendeeName: ticket.user?.name,
        attendeeEmail: ticket.user?.email,
        eventName: gateEvent.title,
        checkInTime: now.toISOString()
      }
    });
  } catch (error) {
    console.error('[TicketController validateTicket Error]:', error);
    return errorResponse(res, 500, 'Ticket validation encounter an unexpected error', error.message);
  }
};

module.exports = {
  getTicketById,
  getTicketsByBooking,
  getMyTickets,
  validateTicket
};
