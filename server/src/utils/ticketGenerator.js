const { Ticket, Event } = require('../models');
const { generateTicketCode, generateSignedQrToken } = require('./qrToken');
const { generateId } = require('../models/dataStore');

/**
 * Generate cryptographically signed QR tickets for a confirmed/paid booking
 * @param {Object} booking 
 * @returns {Promise<Array>} Array of generated Ticket documents
 */
const generateTicketsForBooking = async (booking) => {
  if (!booking) return [];

  // Check if tickets already exist for this booking
  const existingTickets = await Ticket.find({ booking: booking._id });
  if (existingTickets.length > 0) {
    return existingTickets;
  }

  const generatedTickets = [];
  const eventId = booking.event?._id || booking.event;
  const userId = booking.user?._id || booking.user;

  const event = await Event.findById(eventId);
  const city = event?.city || 'TBS';

  if (Array.isArray(booking.tickets)) {
    for (const item of booking.tickets) {
      const qty = item.quantity || 1;
      for (let i = 0; i < qty; i++) {
        const ticketId = generateId();
        const ticketCode = generateTicketCode(city);
        const qrData = generateSignedQrToken({
          ticketId,
          ticketCode,
          eventId: eventId.toString(),
          userId: userId.toString(),
          tierName: item.ticketTypeName
        });

        const newTicket = await Ticket.create({
          _id: ticketId,
          id: ticketId,
          booking: booking._id,
          event: eventId,
          user: userId,
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

  console.log(`[TicketGenerator] Created ${generatedTickets.length} signed QR tickets for booking ${booking._id}`);
  return generatedTickets;
};

module.exports = {
  generateTicketsForBooking
};
