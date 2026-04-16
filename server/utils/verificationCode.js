const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'app.env') });

function hashVerificationCode(code) {
  const normalized = String(code).trim();
  const pepper = process.env.JWT_SECRET || 'pureclinic-email-pepper';
  return crypto.createHash('sha256').update(`${pepper}:${normalized}`, 'utf8').digest('hex');
}

function verifyStoredCode(inputCode, storedHash) {
  if (!storedHash || !inputCode) return false;
  if (!/^[a-f0-9]{64}$/i.test(String(storedHash))) return false;
  try {
    const attempt = hashVerificationCode(inputCode);
    return crypto.timingSafeEqual(Buffer.from(attempt, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

function generateSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

module.exports = {
  hashVerificationCode,
  verifyStoredCode,
  generateSixDigitCode,
};
