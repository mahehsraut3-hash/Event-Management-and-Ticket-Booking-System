const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const bookingRoutes = require('./routes/booking.routes');
const ticketRoutes = require('./routes/ticket.routes');
const organizerRoutes = require('./routes/organizer.routes');
const paymentRoutes = require('./routes/payment.routes');
const { startBookingExpiryJob } = require('./utils/bookingExpiry');
const helmet = require('helmet');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to Database
connectDB();

// Security Middleware: Helmet (headers) & CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Apply global API rate limiter
app.use('/api', apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Event Management & Ticket Booking System (TBS) Backend API',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      events: {
        list: 'GET /api/events',
        details: 'GET /api/events/:id',
        categories: 'GET /api/events/categories',
        cities: 'GET /api/events/cities'
      },
      bookings: {
        create: 'POST /api/bookings',
        my: 'GET /api/bookings/my',
        details: 'GET /api/bookings/:id',
        pay: 'PATCH /api/bookings/:id/pay',
        cancel: 'PATCH /api/bookings/:id/cancel'
      },
      tickets: {
        my: 'GET /api/tickets/my',
        byBooking: 'GET /api/tickets/booking/:bookingId',
        details: 'GET /api/tickets/:id',
        validate: 'POST /api/tickets/validate'
      },
      organizer: {
        stats: 'GET /api/organizer/stats',
        events: 'GET /api/organizer/events',
        create: 'POST /api/organizer/events',
        update: 'PUT /api/organizer/events/:id',
        delete: 'DELETE /api/organizer/events/:id',
        toggleStatus: 'PATCH /api/organizer/events/:id/status',
        attendees: 'GET /api/organizer/events/:id/attendees',
        exportCSV: 'GET /api/organizer/events/:id/attendees/export'
      },
      payments: {
        config: 'GET /api/payments/config',
        createOrder: 'POST /api/payments/create-order',
        verify: 'POST /api/payments/verify',
        webhook: 'POST /api/payments/webhook'
      },
      admin: {
        stats: 'GET /api/admin/stats',
        organizers: 'GET /api/admin/organizers',
        updateOrganizerStatus: 'PATCH /api/admin/organizers/:id/status',
        events: 'GET /api/admin/events',
        moderateEvent: 'PATCH /api/admin/events/:id/moderate'
      }
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] TBS Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Start background auto-expiry worker for pending reservations (clears after 15 mins)
  startBookingExpiryJob(30000);
});

module.exports = { app, server };
