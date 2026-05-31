const { getDb } = require('../config/db');

/** Reject appointment (and other DB) routes when MySQL pool was not initialised. */
function requireDb(req, res, next) {
  try {
    getDb();
    return next();
  } catch {
    return res.status(503).json({
      message:
        'Database is not connected. Start MySQL, check server/app.env (DB_*), and restart the backend.',
      code: 'DB_NOT_READY',
    });
  }
}

module.exports = requireDb;
