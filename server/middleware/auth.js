const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'app.env' });

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = {
      id: payload.id,
      role: payload.role,
      name: payload.name,
      email: payload.email,
      admin_role: payload.admin_role,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;


