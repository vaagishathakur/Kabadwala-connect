// src/utils/generateReference.js
const { v4: uuidv4 } = require('uuid');

/**
 * Generate an 8-character alphanumeric uppercase handover reference code.
 * Format: KC + 6 random chars (e.g., KC3F8A2B)
 * @returns {string} 8-char reference code
 */
function generateHandoverRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omit confusing chars: 0/O, 1/I
  let result = 'KC';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = { generateHandoverRef };
