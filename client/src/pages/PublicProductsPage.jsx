import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import PublicPureHeader from '../components/PublicPureHeader';
import { productService } from '../services/productService';
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
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await productService.getProducts({ category, search });
        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        console.error('Failed to load products:', err);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [category, search]);

  const inputCls =
    'rounded-xl border border-[#E5E2D8] bg-white px-3 py-2.5 text-sm text-[#1A1A1A] shadow-sm placeholder:text-[#667085]/80 focus:border-[#6B705C] focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

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

        <div className={`mb-8 flex flex-col gap-3 sm:flex-row ${rtl ? 'sm:flex-row-reverse' : ''}`}>
          <input
            type="text"
            placeholder={t('store.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 ${inputCls}`}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`sm:w-48 ${inputCls}`}
          >
            <option value="">{t('store.allCategories')}</option>
            <option value="Skin Care">Skin Care</option>
            <option value="Hair Care">Hair Care</option>
            <option value="Body Care">Body Care</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-[#667085] dark:text-slate-400">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-[#667085] dark:text-slate-400">{t('store.noProducts')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                  <div
                    className={`mb-3 flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-[#F2F0E8] dark:bg-slate-700 ${
                      product.stock === 0 ? 'opacity-60' : ''
                    }`}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="flex h-full w-full items-center justify-center text-[#667085]"
                      style={{ display: product.image_url ? 'none' : 'flex' }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-12 w-12"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75A1.5 1.5 0 0021.75 5.25h-16.5A1.5 1.5 0 003.75 6.75v12.75a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                        />
                      </svg>
                    </div>
                  </div>
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
      </main>
    </div>
  );
}
