const { hasAnyPermission } = require('../constants/permissions');

/**
 * Requires Users.role === 'admin' and JWT must include admin_role (or default super_admin).
 * Pass one or more permissions; user needs ANY of them (OR).
 */
function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const adminRole = req.user.admin_role;
    if (hasAnyPermission(adminRole, permissions)) {
      return next();
    }
    return res.status(403).json({ message: 'Insufficient permissions' });
  };
}

module.exports = {
  requirePermission,
};
