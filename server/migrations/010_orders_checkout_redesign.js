/**
 * Orders: operational status vs payment_status, Stripe columns, webhook idempotency.
 *
 * Legacy mapping:
 * - status 'paid' (old) -> status 'pending', payment_status 'paid' (money was captured in old model)
 * - status 'confirmed' -> payment_status 'paid' (assumes confirmed orders were settled)
 * - status 'pending' -> payment_status 'unpaid' (only rows that were never 'paid')
 * - status 'cancelled' -> payment_status 'unpaid'
 *
 * Downgrade note: Reverting ENUM and dropping columns is lossy if new values
 * (awaiting_payment, refunded payment_status) were used in production.
 */

const name = '010_orders_checkout_redesign';

async function up(pool) {
  await pool.query(`
    ALTER TABLE Orders
    ADD COLUMN payment_status ENUM('unpaid', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid'
  `);

  await pool.query(`
    ALTER TABLE Orders
    ADD COLUMN stripe_checkout_session_id VARCHAR(255) NULL,
    ADD COLUMN stripe_payment_intent_id VARCHAR(255) NULL
  `);

  // Stripe webhook idempotency (Stripe event ids are strings like evt_...)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS StripeWebhookEvents (
      stripe_event_id VARCHAR(255) NOT NULL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  // Legacy: old enum included 'paid' as an order status
  await pool.query(`
    UPDATE Orders SET payment_status = 'paid' WHERE status = 'paid'
  `);
  await pool.query(`
    UPDATE Orders SET payment_status = 'paid' WHERE status = 'confirmed'
  `);
  await pool.query(`
    UPDATE Orders SET payment_status = 'unpaid' WHERE status = 'cancelled'
  `);

  await pool.query(`
    UPDATE Orders SET status = 'pending' WHERE status = 'paid'
  `);

  await pool.query(`
    ALTER TABLE Orders
    MODIFY COLUMN status ENUM(
      'awaiting_payment',
      'pending',
      'confirmed',
      'cancelled'
    ) NOT NULL DEFAULT 'pending'
  `);

  await pool.query(`
    CREATE UNIQUE INDEX uq_orders_stripe_checkout_session_id
    ON Orders (stripe_checkout_session_id)
  `);

  await pool.query(`
    CREATE INDEX idx_orders_payment_status ON Orders (payment_status)
  `);
}

async function down(pool) {
  await pool.query(`DROP INDEX idx_orders_payment_status ON Orders`);
  await pool.query(`DROP INDEX uq_orders_stripe_checkout_session_id ON Orders`);

  // Map new operational statuses back to legacy enum (lossy)
  await pool.query(`
    UPDATE Orders SET status = 'pending' WHERE status = 'awaiting_payment'
  `);
  await pool.query(`
    UPDATE Orders SET status = 'paid', payment_status = 'paid'
    WHERE payment_status = 'paid' AND status IN ('pending', 'confirmed')
  `);

  await pool.query(`
    ALTER TABLE Orders
    MODIFY COLUMN status ENUM('pending', 'confirmed', 'paid', 'cancelled') NOT NULL DEFAULT 'pending'
  `);

  await pool.query(`
    ALTER TABLE Orders
    DROP COLUMN stripe_checkout_session_id,
    DROP COLUMN stripe_payment_intent_id,
    DROP COLUMN payment_status
  `);

  await pool.query(`DROP TABLE IF EXISTS StripeWebhookEvents`);
}

module.exports = { name, up, down };
