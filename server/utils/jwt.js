const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'app.env' });

function signToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
  if (user.role === 'admin') {
    payload.admin_role = user.admin_role != null ? user.admin_role : null;
  }

  const secret = process.env.JWT_SECRET || 'changeme';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = {
  signToken,
};


