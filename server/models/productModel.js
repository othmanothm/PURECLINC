const { getDb } = require('../config/db');

async function getAllProducts({ category, search, limit = 50, offset = 0, includeInactive = false } = {}) {
  const db = getDb();
  let query = 'SELECT * FROM Products WHERE 1=1';
  const params = [];

  if (!includeInactive) {
    query += ' AND (is_active = 1 OR is_active IS NULL)';
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await db.query(query, params);
  return rows;
}

async function getProductById(productId) {
  const db = getDb();
  const [rows] = await db.query('SELECT * FROM Products WHERE id = ?', [
    productId,
  ]);
  return rows[0] || null;
}

async function createProduct(data) {
  const db = getDb();
  const {
    name,
    description,
    shortDescription,
    category,
    price,
    stock,
    imageUrl,
    discountPercentage,
    isActive,
    lowStockThreshold,
  } = data;
  const [result] = await db.query(
    `INSERT INTO Products (name, description, short_description, category, price, discount_percentage, stock, low_stock_threshold, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      description,
      shortDescription ?? null,
      category,
      price,
      discountPercentage || 0,
      stock || 0,
      lowStockThreshold === undefined || lowStockThreshold === '' || lowStockThreshold === null
        ? null
        : parseInt(lowStockThreshold, 10),
      imageUrl || null,
      isActive !== undefined && isActive !== null ? (isActive ? 1 : 0) : 1,
    ]
  );
  return { id: result.insertId, ...data };
}

async function updateProduct(productId, data) {
  const db = getDb();
  const {
    name,
    description,
    shortDescription,
    category,
    price,
    stock,
    imageUrl,
    discountPercentage,
    isActive,
    lowStockThreshold,
  } = data;
  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (shortDescription !== undefined) {
    updates.push('short_description = ?');
    params.push(shortDescription);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    params.push(category);
  }
  if (price !== undefined) {
    updates.push('price = ?');
    params.push(price);
  }
  if (discountPercentage !== undefined) {
    updates.push('discount_percentage = ?');
    params.push(discountPercentage);
  }
  if (stock !== undefined) {
    updates.push('stock = ?');
    params.push(stock);
  }
  if (imageUrl !== undefined) {
    updates.push('image_url = ?');
    params.push(imageUrl);
  }
  if (isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }
  if (lowStockThreshold !== undefined) {
    updates.push('low_stock_threshold = ?');
    params.push(
      lowStockThreshold === '' || lowStockThreshold === null ? null : parseInt(lowStockThreshold, 10)
    );
  }

  if (updates.length === 0) {
    return getProductById(productId);
  }

  params.push(productId);
  await db.query(`UPDATE Products SET ${updates.join(', ')} WHERE id = ?`, params);
  return getProductById(productId);
}

async function checkProductHasOrders(productId) {
  const db = getDb();
  const [rows] = await db.query(
    'SELECT COUNT(*) as count FROM OrderItems WHERE product_id = ?',
    [productId]
  );
  return rows[0].count > 0;
}

async function deleteProduct(productId) {
  const db = getDb();

  const hasOrders = await checkProductHasOrders(productId);
  if (hasOrders) {
    const error = new Error('Cannot delete product: it is associated with existing orders');
    error.code = 'PRODUCT_HAS_ORDERS';
    throw error;
  }

  await db.query('DELETE FROM Products WHERE id = ?', [productId]);
  return true;
}

/**
 * @deprecated Prefer decrementStockGuarded — blind decrement can go negative.
 */
async function updateProductStock(productId, quantity) {
  const db = getDb();
  await db.query('UPDATE Products SET stock = stock - ? WHERE id = ?', [
    quantity,
    productId,
  ]);
  return getProductById(productId);
}

/**
 * @param {import('mysql2/promise').PoolConnection} connection
 * @returns {Promise<number>} affected rows (1 if success, 0 if insufficient stock)
 */
async function decrementStockGuarded(connection, productId, quantity) {
  const [result] = await connection.query(
    'UPDATE Products SET stock = stock - ? WHERE id = ? AND stock >= ?',
    [quantity, productId, quantity]
  );
  return result.affectedRows;
}

/**
 * @param {import('mysql2/promise').PoolConnection} connection
 */
async function incrementStock(connection, productId, quantity) {
  await connection.query('UPDATE Products SET stock = stock + ? WHERE id = ?', [
    quantity,
    productId,
  ]);
}

async function recordStockAdjustment(connection, { productId, delta, reason, userId }) {
  await connection.query(
    `INSERT INTO ProductStockAdjustments (product_id, delta, reason, created_by_user_id) VALUES (?, ?, ?, ?)`,
    [productId, delta, reason || null, userId]
  );
}

/** Products at or below low-stock threshold (global default 5 when threshold NULL). */
async function getLowStockProducts(limit = 25) {
  const db = getDb();
  const [rows] = await db.query(
    `SELECT * FROM Products WHERE stock > 0 AND (
      (low_stock_threshold IS NOT NULL AND stock <= low_stock_threshold) OR
      (low_stock_threshold IS NULL AND stock <= 5)
    ) AND (is_active = 1 OR is_active IS NULL)
    ORDER BY stock ASC
    LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  decrementStockGuarded,
  incrementStock,
  recordStockAdjustment,
  getLowStockProducts,
};
