const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const QR_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_replace_in_production';

/**
 * Generate human-readable unique ticket alphanumeric code (e.g. TBS-MUM-8F92-K4A1)
 */
const generateTicketCode = (eventCity = 'TBS') => {
  const cityPrefix = (eventCity || 'TBS').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'TBS';
  const randomPart1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const randomPart2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TBS-${cityPrefix}-${randomPart1}-${randomPart2}`;
};

/**
 * Create cryptographically signed QR code token
 * @param {Object} data - { ticketId, ticketCode, eventId, userId, tierName }
 * @returns {string} Signed verifiable token
 */
const generateSignedQrToken = (data) => {
  const payload = {
    tId: data.ticketId.toString(),
    tCode: data.ticketCode,
    eId: data.eventId.toString(),
    uId: data.userId.toString(),
    tier: data.tierName,
    iat: Math.floor(Date.now() / 1000)
  };

  // Sign with QR secret
  return jwt.sign(payload, QR_SECRET, { algorithm: 'HS256' });
};

/**
 * Verify scanned QR code payload and check signature
 * @param {string} token - Scanned raw QR token
 * @returns {Object} { isValid: boolean, payload: Object | null, reason: string | null }
 */
const verifyQrToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return { isValid: false, payload: null, reason: 'INVALID' };
    }

    const decoded = jwt.verify(token.trim(), QR_SECRET, { algorithms: ['HS256'] });
    return {
      isValid: true,
      payload: {
        ticketId: decoded.tId,
        ticketCode: decoded.tCode,
        eventId: decoded.eId,
        userId: decoded.uId,
        tierName: decoded.tier
      },
      reason: null
    };
  } catch (err) {
    return { isValid: false, payload: null, reason: 'INVALID', error: err.message };
  }
};

module.exports = {
  generateTicketCode,
  generateSignedQrToken,
  verifyQrToken
};
