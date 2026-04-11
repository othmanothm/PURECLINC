const name = '015_product_stock_adjustments';

async function up(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ProductStockAdjustments (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id INT UNSIGNED NOT NULL,
      delta INT NOT NULL,
      reason VARCHAR(500) NULL,
      created_by_user_id INT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_psa_product FOREIGN KEY (product_id) REFERENCES Products(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_psa_user FOREIGN KEY (created_by_user_id) REFERENCES Users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
      INDEX idx_psa_product (product_id),
      INDEX idx_psa_created (created_at)
    ) ENGINE=InnoDB
  `);
}

async function down(pool) {
  await pool.query(`DROP TABLE IF EXISTS ProductStockAdjustments`);
}

module.exports = { name, up, down };
