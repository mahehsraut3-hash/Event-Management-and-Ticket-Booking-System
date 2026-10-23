const jwt = require('jsonwebtoken');

/**
 * Generate signed JWT token containing user id and role
 * @param {string} userId - User Object ID
 * @param {string} role - User role (attendee | organizer | admin)
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'supersecretjwtkey_replace_in_production',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

module.exports = generateToken;
