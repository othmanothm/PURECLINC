/**
 * Public storefront hides inactive products; admin still lists them for history/edits.
 */

const name = '011_products_is_active';

async function up(pool) {
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Products' AND COLUMN_NAME = 'is_active'
  `);
  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE Products
      ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
      AFTER image_url
    `);
    await pool.query(`
      CREATE INDEX idx_products_active ON Products (is_active)
    `);
  }
}

async function down(pool) {
  await pool.query(`DROP INDEX idx_products_active ON Products`);
  await pool.query(`ALTER TABLE Products DROP COLUMN is_active`);
}

module.exports = { name, up, down };
