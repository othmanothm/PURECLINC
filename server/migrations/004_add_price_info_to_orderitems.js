const name = '004_add_price_info_to_orderitems';

async function up(pool) {
  console.log(`Running migration: ${name}`);
  await pool.query(`
    ALTER TABLE OrderItems
    ADD COLUMN original_price DECIMAL(10,2) DEFAULT NULL,
    ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT NULL;
  `);
  console.log(`Migration ${name} completed.`);
}

async function down(pool) {
  console.log(`Reverting migration: ${name}`);
  await pool.query(`
    ALTER TABLE OrderItems
    DROP COLUMN original_price,
    DROP COLUMN discount_percentage;
  `);
  console.log(`Migration ${name} reverted.`);
}

module.exports = { name, up, down };

