/**
 * Single source of truth for checkout money: DB product rows + discount_percentage.
 * Client must never supply prices for persistence.
 */

const roundMoney = (n) => Math.round(n * 100) / 100;

/**
 * @param {Array<{ productId: number, quantity: number }>} requestedItems
 * @param {function(number): Promise<object|null>} getProductById
 * @param {{ requireSellable?: boolean }} [options] requireSellable: enforce is_active and stock (default true)
 */
async function buildCheckoutPricing(requestedItems, getProductById, options = {}) {
  const { requireSellable = true } = options;

  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    return { ok: false, code: 'EMPTY_ITEMS', message: 'items array is required' };
  }

  const normalized = [];
  for (const raw of requestedItems) {
    const productId = parseInt(raw.productId, 10);
    const quantity = parseInt(raw.quantity, 10);
    if (Number.isNaN(productId) || productId < 1) {
      return { ok: false, code: 'INVALID_PRODUCT', message: 'Invalid productId' };
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      return { ok: false, code: 'INVALID_QUANTITY', message: 'Invalid quantity' };
    }
    normalized.push({ productId, quantity });
  }

  normalized.sort((a, b) => a.productId - b.productId);

  const orderLines = [];
  let orderTotal = 0;
  const stripeLineItems = [];

  for (const { productId, quantity } of normalized) {
    const product = await getProductById(productId);
    if (!product) {
      return { ok: false, code: 'NOT_FOUND', message: `Product ${productId} not found` };
    }

    const isActive = product.is_active === undefined || product.is_active === null
      ? true
      : Boolean(Number(product.is_active));

    if (requireSellable) {
      if (!isActive) {
        return { ok: false, code: 'NOT_SELLABLE', message: `Product "${product.name}" is not available` };
      }
      const stock = parseInt(product.stock, 10);
      if (Number.isNaN(stock) || stock < quantity) {
        return {
          ok: false,
          code: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for ${product.name}`,
        };
      }
    }

    const originalUnit = roundMoney(parseFloat(product.price));
    const discountPct = roundMoney(parseFloat(product.discount_percentage) || 0);
    const clampedDiscount = Math.min(100, Math.max(0, discountPct));
    const unitFinal = clampedDiscount > 0
      ? roundMoney(originalUnit * (1 - clampedDiscount / 100))
      : originalUnit;
    const lineTotal = roundMoney(unitFinal * quantity);
    orderTotal = roundMoney(orderTotal + lineTotal);

    orderLines.push({
      productId,
      quantity,
      price: unitFinal,
      originalPrice: originalUnit,
      discountPercentage: clampedDiscount,
      product,
    });

    const unitCents = Math.round(unitFinal * 100);
    stripeLineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
          description: (product.description || '').slice(0, 500),
          images: product.image_url ? [product.image_url] : [],
        },
        unit_amount: unitCents,
      },
      quantity,
    });
  }

  return {
    ok: true,
    orderLines,
    orderTotal,
    stripeLineItems,
  };
}

module.exports = {
  buildCheckoutPricing,
  roundMoney,
};
