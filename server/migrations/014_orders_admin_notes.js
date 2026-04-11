const name = '014_orders_admin_notes';

async function up(pool) {
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Orders' AND COLUMN_NAME = 'admin_notes'
  `);
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE Orders
      ADD COLUMN admin_notes TEXT NULL AFTER address
    `);
  }
}

async function down(pool) {
  await pool.query(`ALTER TABLE Orders DROP COLUMN admin_notes`);
}

module.exports = { name, up, down };
