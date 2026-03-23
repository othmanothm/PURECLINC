const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg).join(', ');
    return res.status(422).json({
      message: `Validation failed: ${errorMessages}`,
      details: errors.array(),
    });
  }
  next();
}

module.exports = validate;


