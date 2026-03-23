const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../models/productModel');

async function getProducts(req, res, next) {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;
    const products = await getAllProducts({
      category,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    return res.json({ products });
  } catch (err) {
    return next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await getProductById(parseInt(id));

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

async function createProductController(req, res, next) {
  try {
    const { name, description, category, price, stock, imageUrl, discountPercentage } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: 'name, category, and price are required' });
    }

    // If file was uploaded, use the file path, otherwise use imageUrl from body
    let finalImageUrl = imageUrl;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      finalImageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const product = await createProduct({
      name,
      description,
      category,
      price: typeof price === 'number' ? price : parseFloat(price),
      discountPercentage: discountPercentage !== undefined && discountPercentage !== null && discountPercentage !== '' 
        ? (typeof discountPercentage === 'number' ? discountPercentage : parseFloat(discountPercentage)) 
        : 0,
      stock: stock !== undefined && stock !== null && stock !== '' ? (typeof stock === 'number' ? stock : parseInt(stock)) : 0,
      imageUrl: finalImageUrl,
    });

    return res.status(201).json({ product });
  } catch (err) {
    return next(err);
  }
}

async function updateProductController(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, category, price, stock, imageUrl, discountPercentage } = req.body;

    // If file was uploaded, use the file path, otherwise use imageUrl from body
    let finalImageUrl = imageUrl;
    if (req.file) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      finalImageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }

    const product = await updateProduct(parseInt(id), {
      name,
      description,
      category,
      price: price !== undefined && price !== null && price !== '' 
        ? (typeof price === 'number' ? price : parseFloat(price)) 
        : undefined,
      discountPercentage: discountPercentage !== undefined && discountPercentage !== null && discountPercentage !== '' 
        ? (typeof discountPercentage === 'number' ? discountPercentage : parseFloat(discountPercentage)) 
        : undefined,
      stock: stock !== undefined && stock !== null && stock !== '' 
        ? (typeof stock === 'number' ? stock : parseInt(stock)) 
        : undefined,
      imageUrl: finalImageUrl !== undefined ? finalImageUrl : undefined,
    });

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
    
    // Check if product exists
    const product = await getProductById(parseInt(id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await deleteProduct(parseInt(id));
    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    if (err.code === 'PRODUCT_HAS_ORDERS') {
      return res.status(400).json({ 
        message: 'Cannot delete product: it is associated with existing orders. Please archive or disable the product instead.' 
      });
    }
    return next(err);
  }
}

module.exports = {
  getProducts,
  getProduct,
  createProductController,
  updateProductController,
  deleteProductController,
};

