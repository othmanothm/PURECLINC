/**
 * Granular permissions for staff (Users.role = 'admin').
 * JWT carries admin_role; NULL/undefined is treated as super_admin for backward compatibility.
 */

const PERMISSION = {
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_PUBLISH: 'products.publish',
  PRODUCTS_DELETE: 'products.delete',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  ORDERS_VIEW_ALL: 'orders.view_all',
  ORDERS_UPDATE_STATUS: 'orders.update_status',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_EDIT_PAYMENT_STATUS: 'orders.edit_payment_status',
  ORDERS_EDIT_NOTES: 'orders.edit_notes',
  REPORTS_VIEW: 'reports.view',
  ADMIN_MANAGE_USERS: 'admin.manage_users',
  ADMIN_MANAGE_DOCTORS: 'admin.manage_doctors',
  ADMIN_MANAGE_REVIEWS: 'admin.manage_reviews',
  ADMIN_MANAGE_ROLES: 'admin.manage_roles',
};

/** @type {Record<string, string[]>} */
const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  store_manager: [
    PERMISSION.PRODUCTS_CREATE,
    PERMISSION.PRODUCTS_EDIT,
    PERMISSION.PRODUCTS_PUBLISH,
    PERMISSION.PRODUCTS_DELETE,
    PERMISSION.INVENTORY_VIEW,
    PERMISSION.INVENTORY_ADJUST,
    PERMISSION.ORDERS_VIEW_ALL,
    PERMISSION.ORDERS_UPDATE_STATUS,
    PERMISSION.ORDERS_CANCEL,
    PERMISSION.ORDERS_EDIT_PAYMENT_STATUS,
    PERMISSION.ORDERS_EDIT_NOTES,
    PERMISSION.REPORTS_VIEW,
  ],
  catalog_manager: [
    PERMISSION.PRODUCTS_CREATE,
    PERMISSION.PRODUCTS_EDIT,
    PERMISSION.PRODUCTS_PUBLISH,
    PERMISSION.PRODUCTS_DELETE,
    PERMISSION.INVENTORY_VIEW,
    PERMISSION.REPORTS_VIEW,
  ],
  inventory_manager: [
    PERMISSION.INVENTORY_VIEW,
    PERMISSION.INVENTORY_ADJUST,
    PERMISSION.PRODUCTS_EDIT,
    PERMISSION.REPORTS_VIEW,
  ],
  order_manager: [
    PERMISSION.ORDERS_VIEW_ALL,
    PERMISSION.ORDERS_UPDATE_STATUS,
    PERMISSION.ORDERS_CANCEL,
    PERMISSION.ORDERS_EDIT_PAYMENT_STATUS,
    PERMISSION.ORDERS_EDIT_NOTES,
    PERMISSION.REPORTS_VIEW,
  ],
  support_staff: [PERMISSION.ORDERS_VIEW_ALL, PERMISSION.REPORTS_VIEW],
};

function resolveAdminRole(adminRole) {
  if (adminRole == null || adminRole === '') {
    return 'super_admin';
  }
  return adminRole;
}

/**
 * @param {string|null|undefined} adminRole
 * @param {string} permission
 */
function hasPermission(adminRole, permission) {
  const role = resolveAdminRole(adminRole);
  const list = ROLE_PERMISSIONS[role];
  if (!list) {
    return role === 'super_admin';
  }
  if (list.includes('*')) return true;
  if (list.includes(permission)) return true;
  const [prefix] = permission.split('.');
  if (list.includes(`${prefix}.*`)) return true;
  return false;
}

/**
 * @param {string|null|undefined} adminRole
 * @param {string[]} permissions — pass if ANY matches
 */
function hasAnyPermission(adminRole, permissions) {
  return permissions.some((p) => hasPermission(adminRole, p));
}

module.exports = {
  PERMISSION,
  ROLE_PERMISSIONS,
  resolveAdminRole,
  hasPermission,
  hasAnyPermission,
};
