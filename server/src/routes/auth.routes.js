const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);

// Verification route for role-based access
router.get('/organizer-test', protect, requireRole('organizer', 'admin'), (req, res) => {
  res.json({
    success: true,
    message: `Welcome, ${req.user.name}. You have authorized ${req.user.role} access!`
  });
});

module.exports = router;
