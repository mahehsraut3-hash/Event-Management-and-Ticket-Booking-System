const express = require('express');
const router = express.Router();
const {
  getOrganizerStats,
  getOrganizerEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  getEventAttendees,
  exportAttendeesCSV
} = require('../controllers/organizer.controller');
const { protect, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All organizer endpoints require active organizer or admin role
router.use(protect, requireRole('organizer', 'admin'));

// Stats & Analytics
router.get('/stats', getOrganizerStats);

// Event CRUD
router.get('/events', getOrganizerEvents);
router.post('/events', upload.single('bannerImage'), createEvent);
router.put('/events/:id', upload.single('bannerImage'), updateEvent);
router.delete('/events/:id', deleteEvent);
router.patch('/events/:id/status', toggleEventStatus);

// Attendee Management & CSV Export
router.get('/events/:id/attendees', getEventAttendees);
router.get('/events/:id/attendees/export', exportAttendeesCSV);

module.exports = router;
