const { Event, Booking, Ticket } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get comprehensive organizer analytics and sales performance
 * @route   GET /api/organizer/stats
 * @access  Private (Organizer | Admin)
 */
const getOrganizerStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // 1. Fetch organizer's events (or all if admin)
    const eventFilter = isAdmin ? {} : { organizer: userId };
    const events = await Event.find(eventFilter);

    const eventIds = events.map((e) => e._id.toString());

    // 2. Compute aggregate metrics
    let totalTicketsSold = 0;
    let totalCapacity = 0;

    events.forEach((ev) => {
      ev.ticketTypes?.forEach((tier) => {
        totalTicketsSold += tier.soldQuantity || 0;
        totalCapacity += tier.totalQuantity || 0;
      });
    });

    // 3. Fetch paid bookings for revenue calculation
    const allBookings = await Booking.find({ paymentStatus: 'paid' });
    const organizerBookings = allBookings.filter((b) =>
      eventIds.includes((b.event?._id || b.event)?.toString())
    );

    const grossRevenue = organizerBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    // 4. Fetch check-ins count
    const allTickets = await Ticket.find({});
    const organizerTickets = allTickets.filter((t) =>
      eventIds.includes((t.event?._id || t.event)?.toString())
    );
    const totalCheckIns = organizerTickets.filter((t) => t.isUsed).length;

    // 5. Build Sales by Event chart data (for Recharts)
    const salesByEvent = events.map((ev) => {
      const sold = ev.ticketTypes?.reduce((acc, t) => acc + (t.soldQuantity || 0), 0) || 0;
      const capacity = ev.ticketTypes?.reduce((acc, t) => acc + (t.totalQuantity || 0), 0) || 0;
      
      // Calculate revenue from paid bookings for this specific event
      const eventRevenue = organizerBookings
        .filter((b) => (b.event?._id || b.event)?.toString() === ev._id.toString())
        .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

      return {
        id: ev._id,
        name: ev.title.length > 22 ? ev.title.slice(0, 22) + '...' : ev.title,
        fullTitle: ev.title,
        sold,
        capacity,
        revenue: eventRevenue,
        category: ev.category
      };
    });

    // 6. Category distribution
    const categoryStats = {};
    events.forEach((ev) => {
      const cat = ev.category || 'Other';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { name: cat, count: 0, sold: 0 };
      }
      categoryStats[cat].count += 1;
      categoryStats[cat].sold += ev.ticketTypes?.reduce((acc, t) => acc + (t.soldQuantity || 0), 0) || 0;
    });

    return successResponse(res, 200, 'Organizer analytics retrieved successfully', {
      overview: {
        totalEvents: events.length,
        totalTicketsSold,
        totalCapacity,
        grossRevenue,
        totalCheckIns,
        occupancyRate: totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0
      },
      salesByEvent,
      categoryStats: Object.values(categoryStats)
    });
  } catch (error) {
    console.error('[OrganizerController getOrganizerStats Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve analytics', error.message);
  }
};

/**
 * @desc    Get all events owned by current organizer
 * @route   GET /api/organizer/events
 * @access  Private (Organizer | Admin)
 */
const getOrganizerEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    const { search, status } = req.query;

    const filter = isAdmin ? {} : { organizer: userId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { venue: { $regex: search.trim(), $options: 'i' } },
        { city: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const events = await Event.find(filter).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Organizer events retrieved', {
      events,
      count: events.length
    });
  } catch (error) {
    console.error('[OrganizerController getOrganizerEvents Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve events', error.message);
  }
};

/**
 * @desc    Create new event with multiple ticket tiers & optional banner image
 * @route   POST /api/organizer/events
 * @access  Private (Organizer | Admin)
 */
const createEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    let {
      title,
      description,
      category,
      venue,
      city,
      startDateTime,
      endDateTime,
      ticketTypes,
      status = 'published',
      bannerImage
    } = req.body;

    // Basic field validation
    if (!title || !description || !category || !venue || !city || !startDateTime || !endDateTime) {
      return errorResponse(res, 400, 'Please provide all required event details');
    }

    // Handle uploaded file if present
    let finalBannerImage = bannerImage;
    if (req.file) {
      finalBannerImage = `/uploads/${req.file.filename}`;
    }

    // Parse ticketTypes if stringified JSON (from multipart/form-data)
    let parsedTicketTypes = ticketTypes;
    if (typeof ticketTypes === 'string') {
      try {
        parsedTicketTypes = JSON.parse(ticketTypes);
      } catch (e) {
        return errorResponse(res, 400, 'Invalid ticketTypes JSON format');
      }
    }

    if (!Array.isArray(parsedTicketTypes) || parsedTicketTypes.length === 0) {
      parsedTicketTypes = [
        { name: 'General Admission', price: 25, totalQuantity: 100, soldQuantity: 0 }
      ];
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      venue: venue.trim(),
      city: city.trim(),
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      bannerImage: finalBannerImage || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80',
      organizer: userId,
      ticketTypes: parsedTicketTypes,
      status
    });

    return successResponse(res, 201, 'Event created successfully', { event });
  } catch (error) {
    console.error('[OrganizerController createEvent Error]:', error);
    return errorResponse(res, 500, 'Failed to create event', error.message);
  }
};

/**
 * @desc    Update an existing event
 * @route   PUT /api/organizer/events/:id
 * @access  Private (Organizer owner | Admin)
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    // Ownership check
    const isOwner = (event.organizer?._id || event.organizer)?.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not have permission to edit this event');
    }

    let {
      title,
      description,
      category,
      venue,
      city,
      startDateTime,
      endDateTime,
      ticketTypes,
      status,
      bannerImage
    } = req.body;

    const updates = {};
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (category) updates.category = category.trim();
    if (venue) updates.venue = venue.trim();
    if (city) updates.city = city.trim();
    if (startDateTime) updates.startDateTime = new Date(startDateTime);
    if (endDateTime) updates.endDateTime = new Date(endDateTime);
    if (status) updates.status = status;

    if (req.file) {
      updates.bannerImage = `/uploads/${req.file.filename}`;
    } else if (bannerImage) {
      updates.bannerImage = bannerImage;
    }

    if (ticketTypes) {
      let parsed = ticketTypes;
      if (typeof ticketTypes === 'string') {
        try {
          parsed = JSON.parse(ticketTypes);
        } catch (e) {
          // ignore parsing error if already array
        }
      }
      if (Array.isArray(parsed)) {
        // Preserve existing sold quantities
        updates.ticketTypes = parsed.map((tier) => {
          const existing = event.ticketTypes?.find(
            (t) => t.name.toLowerCase() === tier.name.toLowerCase()
          );
          return {
            name: tier.name,
            price: parseFloat(tier.price) || 0,
            totalQuantity: parseInt(tier.totalQuantity, 10) || 50,
            soldQuantity: existing ? existing.soldQuantity : 0
          };
        });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, { $set: updates }, { new: true });

    return successResponse(res, 200, 'Event updated successfully', { event: updatedEvent });
  } catch (error) {
    console.error('[OrganizerController updateEvent Error]:', error);
    return errorResponse(res, 500, 'Failed to update event', error.message);
  }
};

/**
 * @desc    Delete event or reject if tickets already sold
 * @route   DELETE /api/organizer/events/:id
 * @access  Private (Organizer owner | Admin)
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    const isOwner = (event.organizer?._id || event.organizer)?.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not own this event');
    }

    // Check if tickets have been sold
    const totalSold = event.ticketTypes?.reduce((acc, t) => acc + (t.soldQuantity || 0), 0) || 0;
    if (totalSold > 0) {
      return errorResponse(
        res,
        400,
        `Cannot delete event with ${totalSold} active ticket sales. You may unpublish or cancel the event instead.`
      );
    }

    await Event.findByIdAndDelete(id);

    return successResponse(res, 200, 'Event deleted successfully');
  } catch (error) {
    console.error('[OrganizerController deleteEvent Error]:', error);
    return errorResponse(res, 500, 'Failed to delete event', error.message);
  }
};

/**
 * @desc    Toggle event status (published <-> draft)
 * @route   PATCH /api/organizer/events/:id/status
 * @access  Private (Organizer owner | Admin)
 */
const toggleEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    const isOwner = (event.organizer?._id || event.organizer)?.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not own this event');
    }

    const newStatus = status || (event.status === 'published' ? 'draft' : 'published');

    const updated = await Event.findByIdAndUpdate(
      id,
      { $set: { status: newStatus } },
      { new: true }
    );

    return successResponse(res, 200, `Event status updated to ${newStatus}`, { event: updated });
  } catch (error) {
    console.error('[OrganizerController toggleEventStatus Error]:', error);
    return errorResponse(res, 500, 'Failed to update event status', error.message);
  }
};

/**
 * @desc    Get attendee list for an event with search & check-in filters
 * @route   GET /api/organizer/events/:id/attendees
 * @access  Private (Organizer owner | Admin)
 */
const getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const { search, checkInStatus } = req.query; // all | checked_in | pending
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    const isOwner = (event.organizer?._id || event.organizer)?.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not own this event');
    }

    // Fetch tickets for this event
    const filter = { event: id };
    if (checkInStatus === 'checked_in') filter.isUsed = true;
    if (checkInStatus === 'pending') filter.isUsed = false;

    let tickets = await Ticket.find(filter)
      .populate('user', 'name email role')
      .populate('booking', 'paymentStatus bookingStatus createdAt');

    // Filter in-memory by search if provided
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.ticketCode?.toLowerCase().includes(q) ||
          t.user?.name?.toLowerCase().includes(q) ||
          t.user?.email?.toLowerCase().includes(q) ||
          t.ticketTypeName?.toLowerCase().includes(q)
      );
    }

    const attendees = tickets.map((t) => ({
      ticketId: t._id,
      ticketCode: t.ticketCode,
      tierName: t.ticketTypeName,
      attendeeName: t.user?.name || 'Guest Attendee',
      attendeeEmail: t.user?.email || 'N/A',
      isUsed: t.isUsed,
      usedAt: t.usedAt,
      paymentStatus: t.booking?.paymentStatus || 'paid',
      purchaseDate: t.createdAt
    }));

    return successResponse(res, 200, 'Attendees retrieved successfully', {
      eventTitle: event.title,
      totalAttendees: attendees.length,
      checkedInCount: attendees.filter((a) => a.isUsed).length,
      attendees
    });
  } catch (error) {
    console.error('[OrganizerController getEventAttendees Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve attendees', error.message);
  }
};

/**
 * @desc    Export attendee list as CSV file
 * @route   GET /api/organizer/events/:id/attendees/export
 * @access  Private (Organizer owner | Admin)
 */
const exportAttendeesCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    const isOwner = (event.organizer?._id || event.organizer)?.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 403, 'Forbidden: You do not own this event');
    }

    const tickets = await Ticket.find({ event: id })
      .populate('user', 'name email')
      .populate('booking', 'createdAt');

    // Build CSV
    const headers = ['Ticket Code', 'Attendee Name', 'Attendee Email', 'Admission Tier', 'Checked In', 'Check-in Time', 'Purchase Date'];
    const rows = tickets.map((t) => [
      `"${t.ticketCode || ''}"`,
      `"${(t.user?.name || 'Guest').replace(/"/g, '""')}"`,
      `"${t.user?.email || ''}"`,
      `"${t.ticketTypeName || 'General'}"`,
      t.isUsed ? 'YES' : 'NO',
      t.usedAt ? `"${new Date(t.usedAt).toLocaleString()}"` : 'N/A',
      `"${new Date(t.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendees_${sanitizedTitle}.csv"`
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('[OrganizerController exportAttendeesCSV Error]:', error);
    return errorResponse(res, 500, 'Failed to export CSV', error.message);
  }
};

module.exports = {
  getOrganizerStats,
  getOrganizerEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  getEventAttendees,
  exportAttendeesCSV
};
