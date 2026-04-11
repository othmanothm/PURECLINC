const { getDb } = require('../config/db');

async function createOrder(
  {
    patientId,
    totalPrice,
    status,
    paymentStatus,
    paymentMethod,
    phone,
    address,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
  },
  connection = null
) {
  const db = connection || getDb();
  const [result] = await db.query(
    `INSERT INTO Orders (patient_id, total_price, status, payment_status, payment_method, phone, address, stripe_checkout_session_id, stripe_payment_intent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patientId,
      totalPrice,
      status,
      paymentStatus,
      paymentMethod || 'cash_on_delivery',
      phone || null,
      address || null,
      stripeCheckoutSessionId || null,
      stripePaymentIntentId || null,
    ]
  );
  return {
    id: result.insertId,
    patient_id: patientId,
    total_price: totalPrice,
    status,
    payment_status: paymentStatus,
    payment_method: paymentMethod,
    phone,
    address,
  };
}

async function createOrderItems(orderId, items, connection = null) {
  const db = connection || getDb();
  const values = items.map((item) => [
    orderId,
    item.productId,
    item.quantity,
    item.price,
    item.originalPrice ?? item.price,
    item.discountPercentage ?? 0,
  ]);

  if (values.length === 0) return [];

  const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
  const flatValues = values.flat();

  await db.query(
    `INSERT INTO OrderItems (order_id, product_id, quantity, price, original_price, discount_percentage)
     VALUES ${placeholders}`,
    flatValues
  );

  return items;
}

async function getOrderById(orderId, connection = null) {
  const db = connection || getDb();
  const [rows] = await db.query(
    `SELECT o.*, u.name as patient_name, u.email as patient_email
     FROM Orders o
     JOIN Patients p ON o.patient_id = p.id
     JOIN Users u ON p.user_id = u.id
     WHERE o.id = ?`,
    [orderId]
  );
  return rows[0] || null;
}

async function getOrderByStripeSessionId(sessionId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT o.*, u.name as patient_name, u.email as patient_email
     FROM Orders o
     JOIN Patients p ON o.patient_id = p.id
     JOIN Users u ON p.user_id = u.id
     WHERE o.stripe_checkout_session_id = ?`,
    [sessionId]
  );
  return rows[0] || null;
}

async function getOrderItems(orderId, connection = null) {
  const db = connection || getDb();
  const [rows] = await db.query(
    `SELECT oi.*, p.name as product_name, p.image_url as product_image,
            COALESCE(oi.original_price, oi.price) as original_price,
            COALESCE(oi.discount_percentage, 0) as discount_percentage
     FROM OrderItems oi
     JOIN Products p ON oi.product_id = p.id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [orderId]
  );
  return rows;
}

async function getPatientOrders(patientId) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT o.*
     FROM Orders o
     WHERE o.patient_id = ?
     ORDER BY o.created_at DESC`,
    [patientId]
  );
  return rows;
}

async function getAllOrders({ status, paymentStatus, search, limit = 50, offset = 0 } = {}) {
  const db = getDb();
  let query = `SELECT o.*, u.name as patient_name, u.email as patient_email
               FROM Orders o
               JOIN Patients p ON o.patient_id = p.id
               JOIN Users u ON p.user_id = u.id
               WHERE 1=1`;
  const params = [];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  if (paymentStatus) {
    query += ' AND o.payment_status = ?';
    params.push(paymentStatus);
  }

  if (search && String(search).trim()) {
    const s = String(search).trim();
    const idNum = parseInt(s, 10);
    if (!Number.isNaN(idNum) && String(idNum) === s) {
      query += ' AND o.id = ?';
      params.push(idNum);
    } else {
      const term = `%${s}%`;
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(term, term);
    }
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(query, params);
  return rows;
}

async function updateOrderAdminNotes(orderId, adminNotes, connection = null) {
  const db = connection || getDb();
  await db.query(`UPDATE Orders SET admin_notes = ? WHERE id = ?`, [adminNotes, orderId]);
  return getOrderById(orderId, connection);
}

async function updateOrderStripeSession(orderId, stripeCheckoutSessionId, connection = null) {
  const db = connection || getDb();
  await db.query(
    `UPDATE Orders SET stripe_checkout_session_id = ? WHERE id = ?`,
    [stripeCheckoutSessionId, orderId]
  );
  return getOrderById(orderId, connection);
}

async function updateOrderStatus(orderId, status, connection = null) {
  const db = connection || getDb();
  await db.query('UPDATE Orders SET status = ? WHERE id = ?', [status, orderId]);
  return getOrderById(orderId, connection);
}

async function updateOrderPaymentStatus(orderId, paymentStatus, connection = null) {
  const db = connection || getDb();
  await db.query('UPDATE Orders SET payment_status = ? WHERE id = ?', [paymentStatus, orderId]);
  return getOrderById(orderId, connection);
}

async function deleteOrderById(orderId, connection = null) {
  const db = connection || getDb();
  await db.query('DELETE FROM Orders WHERE id = ?', [orderId]);
}

module.exports = {
  createOrder,
  createOrderItems,
  getOrderById,
  getOrderByStripeSessionId,
  getOrderItems,
  getPatientOrders,
  getAllOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  updateOrderStripeSession,
  updateOrderAdminNotes,
  deleteOrderById,
};
