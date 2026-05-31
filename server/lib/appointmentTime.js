/**
 * Normalize appointment_time for comparisons and inserts.
 * Handles MySQL TIME ("09:00:00"), HH:MM strings, and Date-like values.
 * @param {string|Date|null|undefined} time
 * @returns {string} HH:MM (24h)
 */
function normalizeAppointmentTime(time) {
  if (time == null) return '';
  if (time instanceof Date) {
    const h = String(time.getHours()).padStart(2, '0');
    const m = String(time.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  const raw = String(time).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw;
  const h = String(parseInt(match[1], 10)).padStart(2, '0');
  const m = match[2];
  return `${h}:${m}`;
}

/**
 * Calendar date as YYYY-MM-DD (never UTC-shifted for local date pickers).
 * @param {string|Date|null|undefined} date
 * @returns {string} YYYY-MM-DD
 */
function normalizeAppointmentDate(date) {
  if (date == null) return '';

  if (typeof date === 'string') {
    const trimmed = date.trim();
    const isoDate = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDate) return isoDate[1];
  }

  if (date instanceof Date) {
    if (!Number.isNaN(date.getTime())) {
      const y = date.getFullYear();
      const mo = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${mo}-${d}`;
    }
  }

  const raw = String(date).trim();
  const fromString = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (fromString) return fromString[1];

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const mo = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }

  return raw.slice(0, 10);
}

/**
 * MySQL TIME column accepts HH:MM:SS; store consistently for inserts.
 * @param {string} hhmm from normalizeAppointmentTime
 */
function toMysqlTime(hhmm) {
  const normalized = normalizeAppointmentTime(hhmm);
  return `${normalized}:00`;
}

module.exports = {
  normalizeAppointmentTime,
  normalizeAppointmentDate,
  toMysqlTime,
};
