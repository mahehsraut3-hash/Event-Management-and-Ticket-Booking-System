const express = require('express');
const router = express.Router();
const { getHealthStatus } = require('../controllers/health.controller');

// @route   GET /api/health
// @desc    Check API health and server status
// @access  Public
router.get('/', getHealthStatus);

module.exports = router;
