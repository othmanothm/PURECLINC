import { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import { FIXED_PRICE_BOUNDS, filterProductsByPrice } from '../utils/productPrice';

export function useProductCatalog() {
  const [allProducts, setAllProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await productService.getProducts({ category, search });
        if (cancelled) return;

        setAllProducts(data.products || []);
        setMinPrice('');
        setMaxPrice('');
      } catch (err) {
        console.error('Failed to load products:', err);
        if (!cancelled) {
          setAllProducts([]);
          setMinPrice('');
          setMaxPrice('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [category, search]);

  const products = useMemo(
    () => filterProductsByPrice(allProducts, minPrice, maxPrice),
    [allProducts, minPrice, maxPrice]
  );

  const { min: boundMin, max: boundMax } = FIXED_PRICE_BOUNDS;

  const setMinPriceClamped = (value) => {
    const nextMin = value === '' ? '' : clampInput(value, boundMin, boundMax);
    setMinPrice(nextMin);
    if (nextMin !== '' && maxPrice !== '') {
      const maxN = Number(maxPrice);
      if (Number.isFinite(maxN) && Number(nextMin) > maxN) {
        setMaxPrice(nextMin);
      }
    }
  };

  const setMaxPriceClamped = (value) => {
    const nextMax = value === '' ? '' : clampInput(value, boundMin, boundMax);
    setMaxPrice(nextMax);
    if (nextMax !== '' && minPrice !== '') {
      const minN = Number(minPrice);
      if (Number.isFinite(minN) && Number(nextMax) < minN) {
        setMinPrice(nextMax);
      }
    }
  };

  return {
    products,
    loading,
    category,
    setCategory,
    search,
    setSearch,
    minPrice,
    maxPrice,
    setMinPrice: setMinPriceClamped,
    setMaxPrice: setMaxPriceClamped,
  };
}

function clampInput(value, boundMin, boundMax) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return '';
  return String(Math.min(boundMax, Math.max(boundMin, n)));
}
