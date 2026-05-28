/** Fixed catalog price filter range (USD). Not derived from product prices. */
export const DEFAULT_PRICE_FILTER_MIN = 0;
export const DEFAULT_PRICE_FILTER_MAX = 750;

export const FIXED_PRICE_BOUNDS = {
  min: DEFAULT_PRICE_FILTER_MIN,
  max: DEFAULT_PRICE_FILTER_MAX,
};

export function toProductListPrice(product) {
  return Number(product?.price);
}

export function formatUsdPrice(amount, { decimals = 0 } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/**
 * Resolve filter range against fixed $0–$750 bounds.
 * Empty min/max uses 0 / 750.
 */
export function resolvePriceRange(minPrice, maxPrice) {
  const boundMin = FIXED_PRICE_BOUNDS.min;
  const boundMax = FIXED_PRICE_BOUNDS.max;

  let min =
    minPrice === '' || minPrice === null || minPrice === undefined
      ? boundMin
      : Number(minPrice);
  let max =
    maxPrice === '' || maxPrice === null || maxPrice === undefined
      ? boundMax
      : Number(maxPrice);

  if (!Number.isFinite(min)) min = boundMin;
  if (!Number.isFinite(max)) max = boundMax;

  min = Math.round(Math.max(boundMin, Math.min(boundMax, min)));
  max = Math.round(Math.max(boundMin, Math.min(boundMax, max)));

  if (min > max) {
    return { min: max, max: min };
  }
  return { min, max };
}

export function clampPrice(value, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Filter by list price (product.price), inclusive. */
export function filterProductsByPrice(products, minPrice, maxPrice) {
  const { min, max } = resolvePriceRange(minPrice, maxPrice);
  return products.filter((product) => {
    const price = toProductListPrice(product);
    if (!Number.isFinite(price)) return false;
    return price >= min && price <= max;
  });
}
