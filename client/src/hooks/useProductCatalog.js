import { useState, useEffect, useMemo } from 'react';
import { productService } from '../services/productService';
import {
  DEFAULT_PRICE_FILTER_MIN,
  DEFAULT_PRICE_FILTER_MAX,
  filterProductsByPrice,
  normalizePriceBounds,
} from '../utils/productPrice';

const INITIAL_BOUNDS = { min: DEFAULT_PRICE_FILTER_MIN, max: DEFAULT_PRICE_FILTER_MAX };

export function useProductCatalog() {
  const [allProducts, setAllProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [priceBounds, setPriceBounds] = useState(INITIAL_BOUNDS);
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

        const bounds = normalizePriceBounds(data.priceBounds);
        setAllProducts(data.products || []);
        setPriceBounds(bounds);
        setMinPrice('');
        setMaxPrice('');
      } catch (err) {
        console.error('Failed to load products:', err);
        if (!cancelled) {
          setAllProducts([]);
          setPriceBounds(INITIAL_BOUNDS);
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
    () => filterProductsByPrice(allProducts, priceBounds, minPrice, maxPrice),
    [allProducts, priceBounds, minPrice, maxPrice]
  );

  const setMinPriceClamped = (value) => {
    const nextMin = value === '' ? '' : clampInput(value, priceBounds.min, priceBounds.max);
    setMinPrice(nextMin);
    if (nextMin !== '' && maxPrice !== '') {
      const maxN = Number(maxPrice);
      if (Number.isFinite(maxN) && Number(nextMin) > maxN) {
        setMaxPrice(nextMin);
      }
    }
  };

  const setMaxPriceClamped = (value) => {
    const nextMax = value === '' ? '' : clampInput(value, priceBounds.min, priceBounds.max);
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
    priceBounds,
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
