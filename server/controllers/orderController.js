const { getStripe } = require('../config/stripe');
const { getPatientByUserId } = require('../models/patientModel');
const {
  createOrder,
  createOrderItems,
  getOrderById,
  getOrderItems,
  getPatientOrders,
  getAllOrders,
  updateOrderStatus,
} = require('../models/orderModel');
const { getProductById, updateProductStock } = require('../models/productModel');

async function createCheckoutSession(req, res, next) {
  try {
    const { items, paymentMethod, phone, address } = req.body; // [{ productId, quantity }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }

    // Validate items and calculate total
    let totalPrice = 0;
    const lineItems = [];

    for (const item of items) {
      // Ensure productId is an integer
      const productId = parseInt(item.productId, 10);
      const quantity = parseInt(item.quantity, 10);

      if (isNaN(productId) || isNaN(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Invalid productId or quantity' });
      }

      const product = await getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${productId} not found` });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = parseFloat(product.price) * quantity;
      totalPrice += itemTotal;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || '',
            images: product.image_url ? [product.image_url] : [],
          },
          unit_amount: Math.round(parseFloat(product.price) * 100), // Convert to cents
        },
        quantity: quantity,
      });
    }

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('your_key_here') || stripeKey.includes('sk_test_********')) {
      // Stripe not configured - create order directly (for testing)
      const userId = req.user.id;
      const patient = await getPatientByUserId(userId);

      if (!patient) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }

      // Validate and update stock
      for (const item of items) {
        const productId = parseInt(item.productId, 10);
        const quantity = parseInt(item.quantity, 10);
        const product = await getProductById(productId);
        if (!product) {
          return res.status(404).json({ message: `Product ${productId} not found` });
        }
        if (product.stock < quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }
        await updateProductStock(productId, quantity);
      }

      const { paymentMethod, phone, address } = req.body;

      // Create order directly - always start as pending
      const order = await createOrder({
        patientId: patient.id,
        totalPrice: parseFloat(totalPrice),
        status: 'pending',
        paymentMethod: paymentMethod || 'cash_on_delivery',
        phone: phone || null,
        address: address || null,
      });

      // Create order items - get prices from products
      const orderItems = [];
      for (const item of items) {
        const productId = parseInt(item.productId, 10);
        const product = await getProductById(productId);
        
        // Calculate final price with discount
        const originalPrice = parseFloat(product.price);
        const discountPercentage = parseFloat(product.discount_percentage) || 0;
        const finalPrice = discountPercentage > 0 
          ? originalPrice * (1 - discountPercentage / 100)
          : originalPrice;
        
        orderItems.push({
          productId: productId,
          quantity: parseInt(item.quantity, 10),
          price: finalPrice, // Final price after discount
          originalPrice: originalPrice, // Original price before discount
          discountPercentage: discountPercentage, // Discount percentage
        });
      }

      await createOrderItems(order.id, orderItems);

      // Return success URL for redirect
      return res.json({ 
        url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/orders?success=true&orderId=${order.id}`,
        orderId: order.id,
        directOrder: true
      });
    }

    // Stripe is configured - use Stripe Checkout
    try {
      const stripe = getStripe();
      
      // Determine payment method types based on selection
      let paymentMethodTypes = ['card'];
      if (paymentMethod === 'apple_pay') {
        paymentMethodTypes = ['card', 'apple_pay'];
      }
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/orders?success=true`,
        cancel_url: `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/cart?canceled=true`,
        metadata: {
          items: JSON.stringify(items),
          totalPrice: totalPrice.toString(),
          paymentMethod: paymentMethod || 'cash_on_delivery',
          phone: phone || '',
          address: address || '',
        },
      });

      return res.json({ sessionId: session.id, url: session.url });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      if (stripeError.type === 'StripeAuthenticationError') {
        return res.status(500).json({ 
          message: 'Payment system configuration error. Please contact administrator.' 
        });
      }
      throw stripeError;
    }
  } catch (err) {
    console.error('Checkout session error:', err);
    return next(err);
  }
}

async function createOrderAfterPayment(req, res, next) {
  try {
    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { items, totalPrice, paymentMethod, phone, address } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }

    // Validate and update stock
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      await updateProductStock(item.productId, item.quantity);
    }

    // Create order - always start as pending
    const order = await createOrder({
      patientId: patient.id,
      totalPrice: parseFloat(totalPrice),
      status: 'pending',
      paymentMethod: paymentMethod || 'card',
      phone: phone || null,
      address: address || null,
    });

    // Create order items - need to get product info for discount
    const orderItems = [];
    for (const item of items) {
      const product = await getProductById(item.productId);
      if (!product) {
        continue;
      }
      
      // Calculate final price with discount
      const originalPrice = parseFloat(product.price);
      const discountPercentage = parseFloat(product.discount_percentage) || 0;
      const finalPrice = discountPercentage > 0 
        ? originalPrice * (1 - discountPercentage / 100)
        : originalPrice;
      
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: finalPrice, // Final price after discount
        originalPrice: originalPrice, // Original price before discount
        discountPercentage: discountPercentage, // Discount percentage
      });
    }

    await createOrderItems(order.id, orderItems);

    const fullOrder = await getOrderById(order.id);
    const itemsData = await getOrderItems(order.id);

    return res.status(201).json({ order: fullOrder, items: itemsData });
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
    
    // Get items for each order
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
    const { status, limit = 50, offset = 0 } = req.query;
    const orders = await getAllOrders({
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Get items for each order
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

async function updateOrderStatusController(req, res, next) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'confirmed', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: pending, confirmed, paid, or cancelled' });
    }

    const order = await updateOrderStatus(parseInt(orderId, 10), status);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const items = await getOrderItems(order.id);
    return res.json({ order: { ...order, items } });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createCheckoutSession,
  createOrderAfterPayment,
  getMyOrders,
  getAllOrdersController,
  updateOrderStatusController,
};

