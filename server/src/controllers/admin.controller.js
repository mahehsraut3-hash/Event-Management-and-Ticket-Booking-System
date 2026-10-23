const { User, Event, Booking, Ticket } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get system-wide platform analytics for Admin
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
const getAdminStats = async (req, res) => {
  try {
    const [users, events, bookings, tickets] = await Promise.all([
      User.find({}).select('-passwordHash'),
      Event.find({}),
      Booking.find({}),
      Ticket.find({})
    ]);

    const totalUsers = users.length;
    const organizers = users.filter((u) => u.role === 'organizer');
    const attendees = users.filter((u) => u.role === 'attendee');

    const publishedEvents = events.filter((e) => e.status === 'published').length;
    const draftEvents = events.filter((e) => e.status === 'draft').length;
    const cancelledEvents = events.filter((e) => e.status === 'cancelled').length;

    const paidBookings = bookings.filter((b) => b.paymentStatus === 'paid');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const checkedInTickets = tickets.filter((t) => t.isUsed).length;

    return successResponse(res, 200, 'Admin platform statistics', {
      overview: {
        totalUsers,
        totalAttendees: attendees.length,
        totalOrganizers: organizers.length,
        pendingOrganizers: organizers.filter((o) => o.status === 'pending').length,
        totalEvents: events.length,
        publishedEvents,
        draftEvents,
        cancelledEvents,
        totalBookings: bookings.length,
        paidBookings: paidBookings.length,
        grossRevenue: totalRevenue,
        totalTicketsIssued: tickets.length,
        checkedInTickets
      }
    });
  } catch (error) {
    console.error('[AdminController getAdminStats Error]:', error);
    return errorResponse(res, 500, 'Failed to fetch admin statistics', error.message);
  }
};

/**
 * @desc    Get list of all event organizers with status and event counts
 * @route   GET /api/admin/organizers
 * @access  Private (Admin Only)
 */
const getOrganizers = async (req, res) => {
  try {
    const { status, search } = req.query;

    let organizers = await User.find({ role: 'organizer' }).select('-passwordHash');
    const allEvents = await Event.find({});

    if (status && status !== 'all') {
      organizers = organizers.filter((o) => o.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      organizers = organizers.filter(
        (o) => o.name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q)
      );
    }

    const organizersWithCounts = organizers.map((org) => {
      const orgEvents = allEvents.filter(
        (e) => (e.organizer?._id || e.organizer)?.toString() === org._id.toString()
      );
      return {
        _id: org._id,
        name: org.name,
        email: org.email,
        role: org.role,
        status: org.status || 'approved',
        isApproved: org.isApproved !== false,
        createdAt: org.createdAt,
        eventsCount: orgEvents.length,
        publishedEventsCount: orgEvents.filter((e) => e.status === 'published').length
      };
    });

    return successResponse(res, 200, 'Organizers retrieved', {
      count: organizersWithCounts.length,
      organizers: organizersWithCounts
    });
  } catch (error) {
    console.error('[AdminController getOrganizers Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve organizers', error.message);
  }
};

/**
 * @desc    Approve, Suspend, or Reset an Organizer
 * @route   PATCH /api/admin/organizers/:id/status
 * @access  Private (Admin Only)
 */
const updateOrganizerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved | suspended | pending

    if (!['approved', 'suspended', 'pending'].includes(status)) {
      return errorResponse(res, 400, "Status must be 'approved', 'suspended', or 'pending'");
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          isApproved: status === 'approved'
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse(res, 404, 'Organizer not found');
    }

    return successResponse(res, 200, `Organizer status updated to '${status}'`, {
      organizer: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        isApproved: updatedUser.isApproved
      }
    });
  } catch (error) {
    console.error('[AdminController updateOrganizerStatus Error]:', error);
    return errorResponse(res, 500, 'Failed to update organizer status', error.message);
  }
};

/**
 * @desc    Get all events across the entire platform for moderation
 * @route   GET /api/admin/events
 * @access  Private (Admin Only)
 */
const getAdminEvents = async (req, res) => {
  try {
    const { status, search } = req.query;

    let events = await Event.find({}).populate('organizer', 'name email');

    if (status && status !== 'all') {
      events = events.filter((e) => e.status === status);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      events = events.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q) ||
          e.venue?.toLowerCase().includes(q) ||
          e.organizer?.name?.toLowerCase().includes(q)
      );
    }

    return successResponse(res, 200, 'Platform events retrieved', {
      count: events.length,
      events
    });
  } catch (error) {
    console.error('[AdminController getAdminEvents Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve events for moderation', error.message);
  }
};

/**
 * @desc    Moderate an event (Publish, Unpublish/Draft, Cancel)
 * @route   PATCH /api/admin/events/:id/moderate
 * @access  Private (Admin Only)
 */
const moderateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, moderationNote } = req.body;

    if (!['published', 'draft', 'cancelled'].includes(status)) {
      return errorResponse(res, 400, "Status must be 'published', 'draft', or 'cancelled'");
    }

    const event = await Event.findById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    const updated = await Event.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          moderationNote: moderationNote || `Moderated by Admin on ${new Date().toLocaleDateString()}`
        }
      },
      { new: true }
    );

    return successResponse(res, 200, `Event status updated to '${status}' by administrator`, {
      event: updated
    });
  } catch (error) {
    console.error('[AdminController moderateEvent Error]:', error);
    return errorResponse(res, 500, 'Failed to moderate event', error.message);
  }
};

module.exports = {
  getAdminStats,
  getOrganizers,
  updateOrganizerStatus,
  getAdminEvents,
  moderateEvent
};
