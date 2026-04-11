const name = '013_products_short_desc_low_stock';

async function up(pool) {
  const [c1] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Products' AND COLUMN_NAME = 'short_description'
  `);
  if (c1.length === 0) {
    await pool.query(`
      ALTER TABLE Products
      ADD COLUMN short_description VARCHAR(500) NULL AFTER description
    `);
  }
  const [c2] = await pool.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Products' AND COLUMN_NAME = 'low_stock_threshold'
  `);
  if (c2.length === 0) {
    await pool.query(`
      ALTER TABLE Products
      ADD COLUMN low_stock_threshold INT UNSIGNED NULL DEFAULT NULL COMMENT 'NULL = use global default (5)'
      AFTER stock
    `);
  }
}

async function down(pool) {
  await pool.query(`ALTER TABLE Products DROP COLUMN low_stock_threshold`);
  await pool.query(`ALTER TABLE Products DROP COLUMN short_description`);
}

module.exports = { name, up, down };
