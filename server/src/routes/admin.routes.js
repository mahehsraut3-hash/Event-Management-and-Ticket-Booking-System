const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getOrganizers,
  updateOrganizerStatus,
  getAdminEvents,
  moderateEvent
} = require('../controllers/admin.controller');
const { protect, requireRole } = require('../middleware/authMiddleware');

// All admin routes strictly require valid JWT and admin role
router.use(protect);
router.use(requireRole('admin'));

router.get('/stats', getAdminStats);
router.get('/organizers', getOrganizers);
router.patch('/organizers/:id/status', updateOrganizerStatus);
router.get('/events', getAdminEvents);
router.patch('/events/:id/moderate', moderateEvent);

module.exports = router;
