const { getStripe } = require('../config/stripe');
const {
  getOrderByStripeSessionId,
  getOrderById,
  getOrderItems,
} = require('../models/orderModel');
const { decrementStockGuarded } = require('../models/productModel');
const { getDb } = require('../config/db');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
} = require('../constants/orderConstants');

async function webhookEventAlreadyProcessed(stripeEventId) {
  const pool = getDb();
  const [rows] = await pool.query(
    'SELECT 1 FROM StripeWebhookEvents WHERE stripe_event_id = ? LIMIT 1',
    [stripeEventId]
  );
  return rows.length > 0;
}

async function recordWebhookEvent(stripeEventId) {
  const pool = getDb();
  await pool.query('INSERT INTO StripeWebhookEvents (stripe_event_id) VALUES (?)', [stripeEventId]);
}

/**
 * POST /api/webhooks/stripe — raw body required (see app.js)
 */
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).send('Webhook not configured');
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await fulfillCheckoutSession(session, event.id);
    } catch (err) {
      console.error('checkout.session.completed fulfillment error:', err);
      return res.status(500).json({ received: false, error: err.message });
    }
  }

  return res.json({ received: true });
}

/**
 * @param {import('stripe').Stripe.Checkout.Session} session
 * @param {string} stripeEventId
 */
async function fulfillCheckoutSession(session, stripeEventId) {
  if (await webhookEventAlreadyProcessed(stripeEventId)) {
    return;
  }

  const sessionId = session.id;
  let order = await getOrderByStripeSessionId(sessionId);
  if (!order && session.metadata && session.metadata.order_id) {
    order = await getOrderById(parseInt(session.metadata.order_id, 10));
  }
  if (!order) {
    console.error('Webhook: no order for session', sessionId);
    return;
  }

  const pool = getDb();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [locked] = await conn.query(`SELECT * FROM Orders WHERE id = ? FOR UPDATE`, [order.id]);
    const row = locked[0];
    if (!row) {
      await conn.rollback();
      return;
    }

    if (row.payment_status === PAYMENT_STATUS.PAID) {
      await conn.commit();
      await recordWebhookEventSafe(stripeEventId);
      return;
    }

    if (
      row.status !== ORDER_STATUS.AWAITING_PAYMENT ||
      row.payment_status !== PAYMENT_STATUS.UNPAID
    ) {
      await conn.commit();
      await recordWebhookEventSafe(stripeEventId);
      return;
    }

    const amountTotalCents = session.amount_total;
    const expectedCents = Math.round(parseFloat(row.total_price) * 100);
    if (amountTotalCents != null && expectedCents !== amountTotalCents) {
      await conn.rollback();
      throw new Error(
        `Amount mismatch: order ${row.id} expected ${expectedCents} got ${amountTotalCents}`
      );
    }

    const items = await getOrderItems(row.id, conn);
    for (const line of items) {
      const n = await decrementStockGuarded(conn, line.product_id, line.quantity);
      if (n !== 1) {
        await conn.rollback();
        throw new Error(`Insufficient stock for product ${line.product_id} on order ${row.id}`);
      }
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

    await conn.query(
      `UPDATE Orders SET payment_status = ?, status = ?, stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id)
       WHERE id = ?`,
      [PAYMENT_STATUS.PAID, ORDER_STATUS.PENDING, paymentIntentId, row.id]
    );

    await conn.commit();
    await recordWebhookEventSafe(stripeEventId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function recordWebhookEventSafe(stripeEventId) {
  try {
    await recordWebhookEvent(stripeEventId);
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      throw err;
    }
  }
}

module.exports = {
  handleStripeWebhook,
};
