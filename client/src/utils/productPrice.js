/** Default catalog price filter bounds when the API has no products yet. */
export const DEFAULT_PRICE_FILTER_MIN = 0;
export const DEFAULT_PRICE_FILTER_MAX = 750;

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

export function normalizePriceBounds(bounds) {
  const min =
    bounds?.min != null && Number.isFinite(Number(bounds.min))
      ? Math.floor(Number(bounds.min))
      : DEFAULT_PRICE_FILTER_MIN;
  const max =
    bounds?.max != null && Number.isFinite(Number(bounds.max))
      ? Math.ceil(Number(bounds.max))
      : DEFAULT_PRICE_FILTER_MAX;
  if (min >= max) {
    return { min: DEFAULT_PRICE_FILTER_MIN, max: DEFAULT_PRICE_FILTER_MAX };
  }
  return { min, max };
}

/**
 * Resolve filter range: empty min/max uses catalog bounds; min cannot exceed max.
 */
export function resolvePriceRange(priceBounds, minPrice, maxPrice) {
  const boundMin = priceBounds.min;
  const boundMax = priceBounds.max;

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
export function filterProductsByPrice(products, priceBounds, minPrice, maxPrice) {
  const { min, max } = resolvePriceRange(priceBounds, minPrice, maxPrice);
  return products.filter((product) => {
    const price = toProductListPrice(product);
    if (!Number.isFinite(price)) return false;
    return price >= min && price <= max;
  });
}
