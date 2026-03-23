const name = '003_add_payment_info_to_orders';

async function up(pool) {
  console.log(`Running migration: ${name}`);
  await pool.query(`
    ALTER TABLE Orders
    ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash_on_delivery',
    ADD COLUMN phone VARCHAR(30),
    ADD COLUMN address TEXT;
  `);
  console.log(`Migration ${name} completed.`);
}

async function down(pool) {
  console.log(`Reverting migration: ${name}`);
  await pool.query(`
    ALTER TABLE Orders
    DROP COLUMN payment_method,
    DROP COLUMN phone,
    DROP COLUMN address;
  `);
  console.log(`Migration ${name} reverted.`);
}

module.exports = { name, up, down };

