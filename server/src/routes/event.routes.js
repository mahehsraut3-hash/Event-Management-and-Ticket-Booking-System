const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  getCategories,
  getCities
} = require('../controllers/event.controller');

// Distinct metadata routes (must precede /:id)
router.get('/categories', getCategories);
router.get('/cities', getCities);

// Public event listing with filters, pagination and search
router.get('/', getEvents);

// Event details by ID
router.get('/:id', getEventById);

module.exports = router;
