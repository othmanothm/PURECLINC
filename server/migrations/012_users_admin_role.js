/**
 * Staff sub-roles for Users with role = 'admin'. NULL means legacy full access (treated as super_admin in app).
 */

const name = '012_users_admin_role';

async function up(pool) {
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Users' AND COLUMN_NAME = 'admin_role'
  `);
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE Users
      ADD COLUMN admin_role ENUM(
        'super_admin',
        'store_manager',
        'catalog_manager',
        'inventory_manager',
        'order_manager',
        'support_staff'
      ) NULL DEFAULT NULL
      AFTER role
    `);
    await pool.query(`
      UPDATE Users SET admin_role = 'super_admin' WHERE role = 'admin' AND admin_role IS NULL
    `);
  }
}

async function down(pool) {
  await pool.query(`ALTER TABLE Users DROP COLUMN admin_role`);
}

module.exports = { name, up, down };
