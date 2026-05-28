import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PublicPureHeader from '../components/PublicPureHeader';
import ProductCatalogFilters from '../components/store/ProductCatalogFilters';
import ProductCardImage from '../components/store/ProductCardImage';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { useAuth } from '../auth/AuthContext';

/**
 * Public storefront: same catalog as /store (patient), no login required to browse.
 */
export default function PublicProductsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const rtl = i18n.language === 'ar';
  const {
    products,
    loading,
    category,
    setCategory,
    search,
    setSearch,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
  } = useProductCatalog();
  const [addingToCart, setAddingToCart] = useState({});
  const [quantities, setQuantities] = useState({});

  const getQuantity = (productId) => quantities[productId] || 1;

  const setQuantity = (productId, quantity) => {
    const max = products.find((p) => p.id === productId)?.stock || 999;
    const qty = Math.max(1, Math.min(quantity, max));
    setQuantities((q) => ({ ...q, [productId]: qty }));
  };

  const incrementQuantity = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQty = getQuantity(product.id);
    const maxStock = product.stock || 999;
    setQuantity(product.id, Math.min(currentQty + 1, maxStock));
  };

  const decrementQuantity = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentQty = getQuantity(product.id);
    setQuantity(product.id, Math.max(1, currentQty - 1));
  };

  const addToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    const quantity = getQuantity(product.id);

    if (product.stock < quantity) {
      toast.error(t('store.insufficientStock', { stock: product.stock }));
      return;
    }

    if (!isAuthenticated || user?.role !== 'patient') {
      toast(t('store.loginToAddToCart'));
      navigate('/login', {
        state: { from: { pathname: `${location.pathname}${location.search || ''}` } },
      });
      return;
    }

    setAddingToCart((a) => ({ ...a, [product.id]: true }));

    const cart = JSON.parse(localStorage.getItem('pureskin_cart') || '[]');
    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    const finalPrice =
      product.discount_percentage > 0
        ? parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)
        : parseFloat(product.price);

    if (existingIndex >= 0) {
      const maxStock = product.stock || 0;
      const nextQty = cart[existingIndex].quantity + quantity;
      cart[existingIndex].quantity = Math.min(nextQty, maxStock);
      if (nextQty > maxStock) {
        toast.error(t('store.insufficientStock', { stock: maxStock }));
      }
    } else {
      cart.push({
        productId: parseInt(product.id, 10),
        name: product.name,
        price: finalPrice,
        originalPrice: parseFloat(product.price),
        discountPercentage: parseFloat(product.discount_percentage || 0),
        image: product.image_url,
        quantity,
      });
    }

    localStorage.setItem('pureskin_cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    setQuantity(product.id, 1);
    toast.success(t('store.addedToCart'));

    setTimeout(() => {
      setAddingToCart((a) => ({ ...a, [product.id]: false }));
    }, 500);
  };

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F2F0E8] font-tajawal dark:bg-slate-900"
    >
      <PublicPureHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <h1 className="mb-2 text-3xl font-extrabold text-[#1A1A1A] dark:text-slate-100 md:text-4xl">
          {t('publicSite.navProducts')}
        </h1>
        <p className="mb-8 max-w-2xl text-[#667085] dark:text-slate-400">{t('publicSite.productsIntro')}</p>

        <div className={`flex flex-col gap-6 lg:flex-row lg:items-start ${rtl ? 'lg:flex-row-reverse' : ''}`}>
          <ProductCatalogFilters
            variant="public"
            search={search}
            category={category}
            onSearchChange={setSearch}
            onCategoryChange={setCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinPriceChange={setMinPrice}
            onMaxPriceChange={setMaxPrice}
          />

          <div className="min-w-0 flex-1">
        {loading ? (
          <p className="text-center text-[#667085] dark:text-slate-400">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-[#667085] dark:text-slate-400">{t('store.noProducts')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-2xl border border-[#E5E2D8] bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-600 dark:bg-slate-800"
              >
                {product.stock === 0 && (
                  <div className="absolute end-2 top-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    {t('store.outOfStock')}
                  </div>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <div className="absolute end-2 top-2 z-10 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    {t('store.lowStock', { stock: product.stock })}
                  </div>
                )}
                <Link to={`/products/${product.id}`} className="block">
                  <ProductCardImage
                    src={product.image_url}
                    alt={product.name}
                    variant="public"
                    dimmed={product.stock === 0}
                  />
                  <h3
                    className={`font-bold text-[#1A1A1A] dark:text-slate-100 ${
                      product.stock === 0 ? 'text-slate-400' : ''
                    }`}
                  >
                    {product.name}
                  </h3>
                  <p
                    className={`mt-1 line-clamp-2 text-sm ${
                      product.stock === 0 ? 'text-slate-400' : 'text-[#667085] dark:text-slate-400'
                    }`}
                  >
                    {product.description}
                  </p>
                  <div className="mt-3">
                    {product.discount_percentage > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#667085] line-through dark:text-slate-500">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                        <span className="text-lg font-bold text-[#6B705C] dark:text-[#8f9a7e]">
                          $
                          {(
                            parseFloat(product.price) *
                            (1 - parseFloat(product.discount_percentage) / 100)
                          ).toFixed(2)}
                        </span>
                        <span className="rounded-full bg-[#E5E2D8] px-2 py-0.5 text-xs font-bold text-[#1A1A1A] dark:bg-slate-600 dark:text-slate-200">
                          -{product.discount_percentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-[#6B705C] dark:text-[#8f9a7e]">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>

                {product.stock > 0 ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#E5E2D8] bg-[#F2F0E8]/80 dark:border-slate-600 dark:bg-slate-700/50">
                      <button
                        type="button"
                        onClick={(e) => decrementQuantity(product, e)}
                        disabled={getQuantity(product.id) <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-s-xl text-[#1A1A1A] transition-colors hover:bg-[#E5E2D8] disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={product.stock || 999}
                        value={getQuantity(product.id)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 1;
                          setQuantity(product.id, val);
                        }}
                        className="w-12 border-0 bg-transparent text-center text-sm font-semibold text-[#1A1A1A] focus:outline-none dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={(e) => incrementQuantity(product, e)}
                        disabled={getQuantity(product.id) >= (product.stock || 999)}
                        className="flex h-9 w-9 items-center justify-center rounded-e-xl text-[#1A1A1A] transition-colors hover:bg-[#E5E2D8] disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => addToCart(product, e)}
                      disabled={
                        addingToCart[product.id] ||
                        product.stock < 1 ||
                        getQuantity(product.id) > (product.stock || 0)
                      }
                      className="rounded-xl bg-[#6B705C] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#565a49] disabled:opacity-60 dark:hover:bg-[#5a604f]"
                    >
                      {addingToCart[product.id] ? t('common.loading') : t('store.addToCart')}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded-xl bg-[#E5E2D8] px-4 py-2.5 text-sm font-semibold text-[#667085] dark:bg-slate-600 dark:text-slate-400"
                    >
                      {t('store.outOfStock')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
