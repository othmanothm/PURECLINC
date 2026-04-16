const { getStripe } = require('../config/stripe');
const { getPatientByUserId } = require('../models/patientModel');
const {
  createOrder,
  createOrderItems,
  getOrderById,
  getOrderByStripeSessionId,
  getOrderItems,
  getPatientOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderAdminNotes,
  updateOrderPaymentStatus,
} = require('../models/orderModel');
const { decrementStockGuarded, incrementStock, getProductById } = require('../models/productModel');
const { getDb } = require('../config/db');
const { buildCheckoutPricing } = require('../services/checkoutPricingService');
const { inventoryWasDeductedForOrder } = require('../services/orderInventoryService');
const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  ADMIN_ALLOWED_ORDER_STATUS,
} = require('../constants/orderConstants');
const { notifyOrderConfirmation } = require('../services/emailNotifications');

function isStripeConfigured() {
  const k = process.env.STRIPE_SECRET_KEY;
  return Boolean(
    k &&
      !k.includes('your_key_here') &&
      !k.includes('sk_test_********') &&
      k.startsWith('sk_')
  );
}

async function placeCodOrderTx(patientId, orderLines, orderTotal, phone, address) {
  const pool = getDb();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const line of orderLines) {
      const n = await decrementStockGuarded(conn, line.productId, line.quantity);
      if (n !== 1) {
        await conn.rollback();
        const err = new Error(`Insufficient stock for product ${line.productId}`);
        err.statusCode = 400;
        err.code = 'INSUFFICIENT_STOCK';
        throw err;
      }
    }

    const order = await createOrder(
      {
        patientId,
        totalPrice: orderTotal,
        status: ORDER_STATUS.PENDING,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        paymentMethod: PAYMENT_METHOD.CASH_ON_DELIVERY,
        phone,
        address,
      },
      conn
    );

    await createOrderItems(
      order.id,
      orderLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        price: l.price,
        originalPrice: l.originalPrice,
        discountPercentage: l.discountPercentage,
      })),
      conn
    );

    await conn.commit();
    return getOrderById(order.id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * @param {import('../services/checkoutPricingService').buildCheckoutPricing} pricing - result of buildCheckoutPricing ok branch
 */
async function createStripeOrderAndSession(pricing, patientId, phone, address, paymentMethod) {
  const { orderLines, orderTotal, stripeLineItems } = pricing;
  const pool = getDb();
  const conn = await pool.getConnection();
  let orderId;

  try {
    await conn.beginTransaction();

    const order = await createOrder(
      {
        patientId,
        totalPrice: orderTotal,
        status: ORDER_STATUS.AWAITING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        paymentMethod:
          paymentMethod === PAYMENT_METHOD.APPLE_PAY ? PAYMENT_METHOD.APPLE_PAY : PAYMENT_METHOD.CARD,
        phone,
        address,
      },
      conn
    );
    orderId = order.id;

    await createOrderItems(
      order.id,
      orderLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        price: l.price,
        originalPrice: l.originalPrice,
        discountPercentage: l.discountPercentage,
      })),
      conn
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const stripe = getStripe();
  let paymentMethodTypes = ['card'];
  if (paymentMethod === PAYMENT_METHOD.APPLE_PAY) {
    paymentMethodTypes = ['card', 'apple_pay'];
  }

  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      line_items: stripeLineItems,
      mode: 'payment',
      client_reference_id: String(orderId),
      metadata: {
        order_id: String(orderId),
      },
      success_url: `${clientOrigin}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOrigin}/cart?canceled=true`,
    });

    const pool2 = getDb();
    await pool2.query(`UPDATE Orders SET stripe_checkout_session_id = ? WHERE id = ?`, [
      session.id,
      orderId,
    ]);

    return { url: session.url, sessionId: session.id, orderId };
  } catch (stripeErr) {
    const pool3 = getDb();
    await pool3.query(`DELETE FROM OrderItems WHERE order_id = ?`, [orderId]);
    await pool3.query(`DELETE FROM Orders WHERE id = ?`, [orderId]);
    throw stripeErr;
  }
}

/**
 * POST /api/orders/create-checkout-session
 * Body: items[{ productId, quantity }], paymentMethod, phone, address
 */
async function createCheckoutSession(req, res, next) {
  try {
    const { items, paymentMethod, phone, address } = req.body;

    if (!phone || !address) {
      return res.status(400).json({ message: 'Phone and address are required' });
    }

    const pm = paymentMethod || PAYMENT_METHOD.CASH_ON_DELIVERY;

    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const pricing = await buildCheckoutPricing(items, getProductById, { requireSellable: true });
    if (!pricing.ok) {
      const status = pricing.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ message: pricing.message, code: pricing.code });
    }

    const { orderLines, orderTotal } = pricing;

    if (pm === PAYMENT_METHOD.CASH_ON_DELIVERY) {
      const order = await placeCodOrderTx(patient.id, orderLines, orderTotal, phone, address);
      const full = await getOrderById(order.id);
      const lineItems = await getOrderItems(order.id);
      if (full && full.patient_email) {
        try {
          await notifyOrderConfirmation({
            to: full.patient_email,
            patientName: full.patient_name || 'Patient',
            order: full,
            items: lineItems,
          });
        } catch (mailErr) {
          console.error('[email] COD order confirmation:', mailErr.message || mailErr);
        }
      }
      return res.status(201).json({
        directOrder: true,
        order: full,
        items: lineItems,
        url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/orders?orderId=${order.id}&success=cod`,
      });
    }

    if (pm !== PAYMENT_METHOD.CARD && pm !== PAYMENT_METHOD.APPLE_PAY) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    if (!isStripeConfigured()) {
      return res.status(503).json({
        message: 'Card payment is not configured. Choose cash on delivery or contact support.',
        code: 'STRIPE_NOT_CONFIGURED',
      });
    }

    const { url, orderId } = await createStripeOrderAndSession(
      pricing,
      patient.id,
      phone,
      address,
      pm
    );

    return res.json({
      url,
      orderId,
      sessionId: undefined,
      directOrder: false,
    });
  } catch (err) {
    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({
        message: 'Payment system configuration error. Please contact administrator.',
      });
    }
    return next(err);
  }
}

/** POST /api/orders/checkout-preview — read-only totals */
async function previewCheckout(req, res, next) {
  try {
    const { items } = req.body;
    const pricing = await buildCheckoutPricing(items, getProductById, { requireSellable: true });
    if (!pricing.ok) {
      const status = pricing.code === 'NOT_FOUND' ? 404 : 400;
      return res.status(status).json({ message: pricing.message, code: pricing.code });
    }
    return res.json({
      orderTotal: pricing.orderTotal,
      lines: pricing.orderLines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        originalUnitPrice: l.originalPrice,
        discountedUnitPrice: l.price,
        discountPercentage: l.discountPercentage,
        lineTotal: Math.round(l.price * l.quantity * 100) / 100,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/orders/by-session/:sessionId — patient must own order */
async function getOrderBySessionForPatient(req, res, next) {
  try {
    const { sessionId } = req.params;
    const order = await getOrderByStripeSessionId(sessionId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const patient = await getPatientByUserId(req.user.id);
    if (!patient || order.patient_id !== patient.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const items = await getOrderItems(order.id);
    return res.json({ order, items });
  } catch (err) {
    return next(err);
  }
}

async function getMyOrders(req, res, next) {
  try {
    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const orders = await getPatientOrders(patient.id);

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await getOrderItems(order.id);
        return { ...order, items };
      })
    );

    return res.json({ orders: ordersWithItems });
  } catch (err) {
    return next(err);
  }
}

async function getAllOrdersController(req, res, next) {
  try {
    const { status, paymentStatus, search, limit = 50, offset = 0 } = req.query;
    const orders = await getAllOrders({
      status,
      paymentStatus,
      search,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await getOrderItems(order.id);
        return { ...order, items };
      })
    );

    return res.json({ orders: ordersWithItems });
  } catch (err) {
    return next(err);
  }
}

async function restoreInventoryForOrder(connection, orderId) {
  const items = await getOrderItems(orderId, connection);
  for (const row of items) {
    await incrementStock(connection, row.product_id, row.quantity);
  }
}

async function updateOrderStatusController(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const id = parseInt(orderId, 10);

    if (!status || !ADMIN_ALLOWED_ORDER_STATUS.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${ADMIN_ALLOWED_ORDER_STATUS.join(', ')}`,
      });
    }

    const existing = await getOrderById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (existing.status === ORDER_STATUS.CANCELLED) {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    if (status === ORDER_STATUS.CANCELLED) {
      const pool = getDb();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const fresh = await getOrderById(id, conn);
        if (inventoryWasDeductedForOrder(fresh)) {
          await restoreInventoryForOrder(conn, id);
        }
        await updateOrderStatus(id, ORDER_STATUS.CANCELLED, conn);
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
      const order = await getOrderById(id);
      const items = await getOrderItems(order.id);
      return res.json({ order: { ...order, items } });
    }

    const order = await updateOrderStatus(id, status);
    const items = await getOrderItems(order.id);
    return res.json({ order: { ...order, items } });
  } catch (err) {
    return next(err);
  }
}

async function getAdminOrderByIdController(req, res, next) {
  try {
    const id = parseInt(req.params.orderId, 10);
    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const items = await getOrderItems(id);
    return res.json({ order, items });
  } catch (err) {
    return next(err);
  }
}

async function patchAdminOrderNotesController(req, res, next) {
  try {
    const id = parseInt(req.params.orderId, 10);
    const { adminNotes } = req.body;
    const existing = await getOrderById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = await updateOrderAdminNotes(id, adminNotes ?? null);
    const items = await getOrderItems(order.id);
    return res.json({ order: { ...order, items } });
  } catch (err) {
    return next(err);
  }
}

async function patchAdminOrderPaymentStatusController(req, res, next) {
  try {
    const id = parseInt(req.params.orderId, 10);
    const { paymentStatus } = req.body;
    const allowed = ['unpaid', 'paid', 'failed', 'refunded'];
    if (!paymentStatus || !allowed.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment_status' });
    }
    const existing = await getOrderById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = await updateOrderPaymentStatus(id, paymentStatus);
    const items = await getOrderItems(order.id);
    return res.json({ order: { ...order, items } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createCheckoutSession,
  previewCheckout,
  getOrderBySessionForPatient,
  getMyOrders,
  getAllOrdersController,
  getAdminOrderByIdController,
  patchAdminOrderNotesController,
  patchAdminOrderPaymentStatusController,
  updateOrderStatusController,
};
