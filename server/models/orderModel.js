const { getDb } = require('../config/db');

async function createOrder({ patientId, totalPrice, status = 'pending', paymentMethod, phone, address }) {
  const db = getDb();
  const [result] = await db.query(
    `INSERT INTO Orders (patient_id, total_price, status, payment_method, phone, address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [patientId, totalPrice, status, paymentMethod || 'cash_on_delivery', phone || null, address || null]
  );
  return { id: result.insertId, patient_id: patientId, total_price: totalPrice, status, payment_method: paymentMethod, phone, address };
}

async function createOrderItems(orderId, items) {
  const db = getDb();
  const values = items.map((item) => [
    orderId,
    item.productId,
    item.quantity,
    item.price, // Final price after discount
    item.originalPrice || item.price, // Original price before discount
    item.discountPercentage || 0, // Discount percentage
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

async function getOrderById(orderId) {
  const db = getDb();
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

async function getOrderItems(orderId) {
  const db = getDb();
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

async function getAllOrders({ status, limit = 50, offset = 0 } = {}) {
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

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(query, params);
  return rows;
}

async function updateOrderStatus(orderId, status) {
  const db = getDb();
  await db.query('UPDATE Orders SET status = ? WHERE id = ?', [
    status,
    orderId,
  ]);
  return getOrderById(orderId);
}

module.exports = {
  createOrder,
  createOrderItems,
  getOrderById,
  getOrderItems,
  getPatientOrders,
  getAllOrders,
  updateOrderStatus,
};

