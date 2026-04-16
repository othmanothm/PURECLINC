const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'app.env') });

function createTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.SMTP_REQUIRE_TLS !== 'false',
    auth:
      process.env.SMTP_USER != null && process.env.SMTP_USER !== ''
        ? { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '') }
        : undefined,
  });
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

/**
 * @returns {{ sent: boolean }}
 */
async function sendPatientVerificationEmail(to, name, code) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@pureclinic.local';
  const transport = createTransport();
  const subject = 'PureSkin Clinic — Email verification code';
  const text = `Hello ${name},\n\nYour verification code is: ${code}\n\nIt expires in ${process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES || '15'} minutes.\n\nIf you did not register, you can ignore this email.`;
  const html = `
    <p>Hello ${escapeHtml(name)},</p>
    <p>Your verification code is:</p>
    <p style="font-size:1.5rem;font-weight:bold;letter-spacing:0.2em;">${escapeHtml(code)}</p>
    <p>This code expires in ${escapeHtml(process.env.EMAIL_VERIFICATION_EXPIRY_MINUTES || '15')} minutes.</p>
    <p>If you did not register, you can ignore this email.</p>
  `;

  if (!transport) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      throw new Error('SMTP is not configured (set SMTP_HOST and related variables)');
    }
    console.warn(`[email] SMTP not configured; dev verification code for ${to}: ${code}`);
    return { sent: false };
  }

  try {
    await transport.sendMail({ from, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    console.error('[email] sendMail failed:', err.message || err);
    if (err.response) console.error('[email] SMTP response:', err.response);
    throw err;
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Best-effort transactional mail (orders, appointment notices). Never throws; logs on failure.
 * @returns {Promise<boolean>}
 */
async function sendTemplatedMail(to, subject, text, html) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@pureclinic.local';
  const transport = createTransport();
  if (!transport) {
    console.warn(`[email] no SMTP; skipped "${subject}" → ${to}`);
    console.warn(`[email] body:\n${text}`);
    return false;
  }
  try {
    await transport.sendMail({ from, to, subject, text, html });
    return true;
  } catch (err) {
    console.error(`[email] send failed "${subject}" → ${to}:`, err.message || err);
    if (err.response) console.error('[email] SMTP response:', err.response);
    return false;
  }
}

module.exports = {
  createTransport,
  isSmtpConfigured,
  sendPatientVerificationEmail,
  sendTemplatedMail,
  escapeHtml,
};
