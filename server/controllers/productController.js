const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  recordStockAdjustment,
} = require('../models/productModel');
const { getDb } = require('../config/db');

function isAdminRequest(req) {
  return typeof req.baseUrl === 'string' && req.baseUrl.includes('/admin');
}

async function getProducts(req, res, next) {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;
    const includeInactive = isAdminRequest(req);
    const products = await getAllProducts({
      category,
      search,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      includeInactive,
    });
    return res.json({ products });
  } catch (err) {
    return next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await getProductById(parseInt(id, 10));

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const includeInactive = isAdminRequest(req);
    const active =
      product.is_active === undefined ||
      product.is_active === null ||
      Number(product.is_active) === 1;
    if (!includeInactive && !active) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

function parseOptionalInt(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

async function createProductController(req, res, next) {
  try {
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
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'name, category, and price are required' });
    }

    let finalImageUrl = imageUrl;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      finalImageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const product = await createProduct({
      name,
      description,
      shortDescription: shortDescription ?? req.body.short_description,
      category,
      price: typeof price === 'number' ? price : parseFloat(price),
      discountPercentage:
        discountPercentage !== undefined && discountPercentage !== null && discountPercentage !== ''
          ? typeof discountPercentage === 'number'
            ? discountPercentage
            : parseFloat(discountPercentage)
          : 0,
      stock:
        stock !== undefined && stock !== null && stock !== ''
          ? typeof stock === 'number'
            ? stock
            : parseInt(stock, 10)
          : 0,
      imageUrl: finalImageUrl,
      isActive:
        isActive === undefined || isActive === null || isActive === ''
          ? true
          : isActive === true || isActive === 'true' || isActive === 1 || isActive === '1',
      lowStockThreshold: parseOptionalInt(lowStockThreshold ?? req.body.low_stock_threshold),
    });

    return res.status(201).json({ product });
  } catch (err) {
    return next(err);
  }
}

async function updateProductController(req, res, next) {
  try {
    const { id } = req.params;
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
    } = req.body;

    let finalImageUrl = imageUrl;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      finalImageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const payload = {
      name,
      description,
      shortDescription:
        shortDescription !== undefined ? shortDescription : req.body.short_description,
      category,
      price:
        price !== undefined && price !== null && price !== ''
          ? typeof price === 'number'
            ? price
            : parseFloat(price)
          : undefined,
      discountPercentage:
        discountPercentage !== undefined && discountPercentage !== null && discountPercentage !== ''
          ? typeof discountPercentage === 'number'
            ? discountPercentage
            : parseFloat(discountPercentage)
          : undefined,
      stock:
        stock !== undefined && stock !== null && stock !== ''
          ? typeof stock === 'number'
            ? stock
            : parseInt(stock, 10)
          : undefined,
      imageUrl: finalImageUrl !== undefined ? finalImageUrl : undefined,
    };

    if (lowStockThreshold !== undefined || req.body.low_stock_threshold !== undefined) {
      payload.lowStockThreshold = parseOptionalInt(
        lowStockThreshold !== undefined ? lowStockThreshold : req.body.low_stock_threshold
      );
    }

    if (isActive !== undefined) {
      payload.isActive =
        isActive === true || isActive === 'true' || isActive === 1 || isActive === '1';
    }

    const product = await updateProduct(parseInt(id, 10), payload);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

async function deleteProductController(req, res, next) {
  try {
    const { id } = req.params;

    const product = await getProductById(parseInt(id, 10));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await deleteProduct(parseInt(id, 10));
    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (err.code === 'PRODUCT_HAS_ORDERS') {
      return res.status(400).json({
        message:
          'Cannot delete product: it is associated with existing orders. Please archive or disable the product instead.',
      });
    }
    return next(err);
  }
}

async function adjustProductStockController(req, res, next) {
  const productId = parseInt(req.params.id, 10);
  const { delta, reason } = req.body;
  const d = typeof delta === 'number' ? delta : parseInt(delta, 10);
  if (Number.isNaN(d) || d === 0) {
    return res.status(400).json({ message: 'delta must be a non-zero integer' });
  }

  const pool = getDb();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [updateResult] = await conn.query(
      'UPDATE Products SET stock = stock + ? WHERE id = ? AND stock + ? >= 0',
      [d, productId, d]
    );
    if (updateResult.affectedRows !== 1) {
      await conn.rollback();
      const exists = await getProductById(productId);
      if (!exists) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.status(400).json({ message: 'Adjustment would result in negative stock' });
    }
    await recordStockAdjustment(conn, {
      productId,
      delta: d,
      reason: typeof reason === 'string' ? reason : null,
      userId: req.user.id,
    });
    await conn.commit();
    const product = await getProductById(productId);
    return res.json({ product });
  } catch (err) {
    await conn.rollback();
    return next(err);
  } finally {
    conn.release();
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProductController,
  updateProductController,
  deleteProductController,
  adjustProductStockController,
};
