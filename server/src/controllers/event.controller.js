const Event = require('../models/Event');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Get all published events with filtering, search, sorting & pagination
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      city,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      sort = 'date',
      page = 1,
      limit = 9
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 9));
    const skip = (pageNum - 1) * limitNum;

    // Filter criteria: only return published events
    const filter = { status: 'published' };

    // 1. Text search across title, venue, and description
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { venue: searchRegex },
        { description: searchRegex }
      ];
    }

    // 2. Category filter
    if (category && category !== 'All' && category.trim() !== '') {
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // 3. City filter
    if (city && city !== 'All' && city.trim() !== '') {
      filter.city = { $regex: `^${city.trim()}$`, $options: 'i' };
    }

    // 4. Date range filter
    if (startDate || endDate) {
      filter.startDateTime = {};
      if (startDate) {
        filter.startDateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        // End of the day if just a date string is passed
        const end = new Date(endDate);
        if (endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        filter.startDateTime.$lte = end;
      }
    }

    // 5. Price range filter across ticket types
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['ticketTypes.price'] = {};
      if (minPrice !== undefined && minPrice !== '') {
        filter['ticketTypes.price'].$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        filter['ticketTypes.price'].$lte = parseFloat(maxPrice);
      }
    }

    // 6. Sorting configuration
    let sortOption = { startDateTime: 1 };
    switch (sort) {
      case 'date_desc':
        sortOption = { startDateTime: -1 };
        break;
      case 'price_asc':
        sortOption = { minPrice: 1 };
        break;
      case 'price_desc':
        sortOption = { minPrice: -1 };
        break;
      case 'popularity':
        sortOption = { popularity: 1 };
        break;
      case 'date':
      default:
        sortOption = { startDateTime: 1 };
        break;
    }

    // Query database
    const totalEvents = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('organizer', 'name email role')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(totalEvents / limitNum) || 1;

    return successResponse(res, 200, 'Events retrieved successfully', {
      events,
      pagination: {
        totalEvents,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('[EventController getEvents Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve events', error.message);
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate('organizer', 'name email role');

    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    // If event is not published, only allow access if authorized organizer or admin
    if (event.status !== 'published') {
      const user = req.user;
      const isOwner = user && (user._id.toString() === event.organizer?._id?.toString() || user.role === 'admin');
      if (!isOwner) {
        return errorResponse(res, 404, 'This event is not published or has been cancelled');
      }
    }

    return successResponse(res, 200, 'Event retrieved successfully', { event });
  } catch (error) {
    console.error('[EventController getEventById Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve event details', error.message);
  }
};

/**
 * @desc    Get all distinct categories for filter navigation
 * @route   GET /api/events/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Event.distinct('category', { status: 'published' });
    return successResponse(res, 200, 'Categories retrieved', { categories });
  } catch (error) {
    console.error('[EventController getCategories Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve categories');
  }
};

/**
 * @desc    Get all distinct cities for filter navigation
 * @route   GET /api/events/cities
 * @access  Public
 */
const getCities = async (req, res) => {
  try {
    const cities = await Event.distinct('city', { status: 'published' });
    return successResponse(res, 200, 'Cities retrieved', { cities });
  } catch (error) {
    console.error('[EventController getCities Error]:', error);
    return errorResponse(res, 500, 'Failed to retrieve cities');
  }
};

module.exports = {
  getEvents,
  getEventById,
  getCategories,
  getCities
};
