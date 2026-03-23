function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: 'Not Found',
    path: req.originalUrl,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    details: err.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};


