const { getDb } = require('../config/db');

async function getAllProducts({ category, search, limit = 50, offset = 0 } = {}) {
  const db = getDb();
  let query = 'SELECT * FROM Products WHERE 1=1';
  const params = [];

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
  const { name, description, category, price, stock, imageUrl, discountPercentage } = data;
  const [result] = await db.query(
    `INSERT INTO Products (name, description, category, price, discount_percentage, stock, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description, category, price, discountPercentage || 0, stock || 0, imageUrl || null]
  );
  return { id: result.insertId, ...data };
}

async function updateProduct(productId, data) {
  const db = getDb();
  const { name, description, category, price, stock, imageUrl, discountPercentage } = data;
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
  
  // Check if product has orders
  const hasOrders = await checkProductHasOrders(productId);
  if (hasOrders) {
    const error = new Error('Cannot delete product: it is associated with existing orders');
    error.code = 'PRODUCT_HAS_ORDERS';
    throw error;
  }
  
  await db.query('DELETE FROM Products WHERE id = ?', [productId]);
  return true;
}

async function updateProductStock(productId, quantity) {
  const db = getDb();
  await db.query('UPDATE Products SET stock = stock - ? WHERE id = ?', [
    quantity,
    productId,
  ]);
  return getProductById(productId);
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
};

