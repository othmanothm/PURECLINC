// Migration: Add discount_percentage column to Products table

async function up(pool) {
  // Check if column already exists
  const [columns] = await pool.query(`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'Products' 
    AND COLUMN_NAME = 'discount_percentage'
  `);

  if (columns.length === 0) {
    await pool.query(`
      ALTER TABLE Products 
      ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0.00 
      AFTER price
    `);
    console.log('Added discount_percentage column to Products table');
  } else {
    console.log('discount_percentage column already exists');
  }
}

module.exports = {
  name: '002_add_discount_to_products',
  up,
};

