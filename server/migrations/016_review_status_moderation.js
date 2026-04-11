const name = '016_review_status_moderation';

async function up(pool) {
  await pool.query(`
    ALTER TABLE Reviews
    MODIFY COLUMN status ENUM(
      'pending',
      'approved',
      'rejected',
      'hidden',
      'flagged'
    ) NOT NULL DEFAULT 'pending'
  `);
}

async function down(pool) {
  await pool.query(`
    UPDATE Reviews SET status = 'pending' WHERE status NOT IN ('pending', 'approved')
  `);
  await pool.query(`
    ALTER TABLE Reviews
    MODIFY COLUMN status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending'
  `);
}

module.exports = { name, up, down };
