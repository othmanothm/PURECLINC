const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'app.env' });

function signToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  const secret = process.env.JWT_SECRET || 'changeme';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = {
  signToken,
};


