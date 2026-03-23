// Migration: Add 'confirmed' status to Orders table

const sql = `
ALTER TABLE Orders 
MODIFY COLUMN status ENUM('pending', 'confirmed', 'paid', 'cancelled') NOT NULL DEFAULT 'pending';
`;

module.exports = {
  name: '006_add_confirmed_to_orders',
  up: async (db) => {
    await db.query(sql);
  },
  down: async (db) => {
    // Revert to original enum
    await db.query(`
      ALTER TABLE Orders 
      MODIFY COLUMN status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending';
    `);
  },
};

