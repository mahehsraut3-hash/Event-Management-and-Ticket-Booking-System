/**
 * Health check controller
 */
const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Event Management & Ticket Booking System (TBS) API is healthy and operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
};

module.exports = {
  getHealthStatus
};
