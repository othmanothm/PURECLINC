import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';

function StorePage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});
  const [quantities, setQuantities] = useState({});

  const getQuantity = (productId) => {
    return quantities[productId] || 1;
  };

  const setQuantity = (productId, quantity) => {
    const qty = Math.max(1, Math.min(quantity, products.find(p => p.id === productId)?.stock || 999));
    setQuantities({ ...quantities, [productId]: qty });
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

    if (quantity < 1) {
      toast.error(t('common.selectValidQuantity'));
      return;
    }

    setAddingToCart({ ...addingToCart, [product.id]: true });

    const cart = JSON.parse(localStorage.getItem('pureskin_cart') || '[]');
    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    // Calculate final price with discount
    const finalPrice = product.discount_percentage > 0
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
        quantity: quantity,
      });
    }

    localStorage.setItem('pureskin_cart', JSON.stringify(cart));
    // Trigger custom event to update cart count in header
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    
    // Reset quantity for this product
    setQuantity(product.id, 1);
    
    toast.success(t('store.addedToCart'));
    
    setTimeout(() => {
      setAddingToCart({ ...addingToCart, [product.id]: false });
    }, 500);
  };

  useEffect(() => {
    loadProducts();
  }, [category, search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts({ category, search });
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">{t('store.title')}</h1>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder={t('store.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
          >
            <option value="">{t('store.allCategories')}</option>
            <option value="Skin Care">Skin Care</option>
            <option value="Hair Care">Hair Care</option>
            <option value="Body Care">Body Care</option>
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('store.noProducts')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative rounded-lg bg-white dark:bg-slate-800 p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Stock Status Tags */}
                {product.stock === 0 && (
                  <div className="absolute top-2 right-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    {t('store.outOfStock')}
                  </div>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <div className="absolute top-2 right-2 z-10 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    {t('store.comingSoon')}
                  </div>
                )}
                <Link to={`/store/product/${product.id}`} className="block">
                  <div className={`mb-3 flex h-48 w-full items-center justify-center rounded-lg bg-slate-100 ${product.stock === 0 ? 'opacity-60' : ''}`}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full rounded-lg object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="flex h-full w-full items-center justify-center rounded-lg text-slate-400"
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
                  <h3 className={`font-semibold ${product.stock === 0 ? 'text-slate-400' : ''}`}>{product.name}</h3>
                  <p className={`mt-1 text-sm line-clamp-2 ${product.stock === 0 ? 'text-slate-400' : 'text-slate-600'}`}>{product.description}</p>
                  <div className="mt-3">
                    {product.discount_percentage > 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-red-600 line-through">
                            ${parseFloat(product.price).toFixed(2)}
                          </span>
                          <span className="text-xl font-bold text-sky-600">
                            ${(parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)).toFixed(2)}
                          </span>
                        </div>
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                          -{product.discount_percentage}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-sky-600">${parseFloat(product.price).toFixed(2)}</span>
                    )}
                  </div>
                </Link>
                
                {/* Quantity Selector */}
                {product.stock > 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-slate-50">
                      <button
                        onClick={(e) => decrementQuantity(product, e)}
                        disabled={getQuantity(product.id) <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-l-lg text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
                        className="w-12 border-0 bg-transparent text-center text-sm font-semibold text-slate-900 focus:outline-none"
                      />
                      <button
                        onClick={(e) => incrementQuantity(product, e)}
                        disabled={getQuantity(product.id) >= (product.stock || 999)}
                        className="flex h-8 w-8 items-center justify-center rounded-r-lg text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={(e) => addToCart(product, e)}
                      disabled={addingToCart[product.id] || product.stock < 1 || getQuantity(product.id) > (product.stock || 0)}
                      className="flex-1 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:opacity-60"
                    >
                      {addingToCart[product.id] ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </span>
                      ) : (
                        'Add to Cart'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      disabled
                      className="w-full rounded-lg bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 cursor-not-allowed"
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
  );
}

export default StorePage;

