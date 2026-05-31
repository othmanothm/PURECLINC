function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: 'Not Found',
    path: req.originalUrl,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const poolMsg = 'Database pool not initialised. Call initDb() first.';
  if (err.message === poolMsg) {
    return res.status(503).json({
      message:
        'قاعدة البيانات غير متصلة. شغّل MySQL وتحقق من إعدادات DB_* في server/app.env، ثم أعد تشغيل السيرفر.',
      code: 'DB_NOT_READY',
    });
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    details: err.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};


