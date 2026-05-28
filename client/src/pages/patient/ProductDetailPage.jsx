import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import ProductCardImage from '../../components/store/ProductCardImage';
import { useAuth } from '../../auth/AuthContext';

function ProductDetailPage() {
  const { t, i18n } = useTranslation();
  const rtl = i18n.language === 'ar';
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const catalogPath = pathname.startsWith('/products') ? '/products' : '/store';
  const { user, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await productService.getProduct(id);
      setProduct(data.product);
    } catch (err) {
      console.error('Failed to load product:', err);
    }
  };

  const addToCart = () => {
    if (!product || product.stock < quantity) {
      toast.error(t('store.insufficientStock', { stock: product?.stock || 0 }));
      return;
    }

    if (catalogPath === '/products' && (!isAuthenticated || user?.role !== 'patient')) {
      toast(t('store.loginToAddToCart'));
      navigate('/login', { state: { from: { pathname } } });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('pureskin_cart') || '[]');
    const existingIndex = cart.findIndex((item) => item.productId === product.id);

    const finalPrice =
      product.discount_percentage > 0
        ? parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)
        : parseFloat(product.price);

    if (existingIndex >= 0) {
      const maxStock = product.stock || 0;
      const nextQty = cart[existingIndex].quantity + parseInt(quantity, 10);
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
        quantity: parseInt(quantity, 10),
      });
    }

    localStorage.setItem('pureskin_cart', JSON.stringify(cart));
    // Trigger custom event to update cart count in header
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    toast.success(t('store.addedToCart'));
  };

  if (!product) {
    return <div className="p-8 text-center dark:bg-slate-900 dark:text-slate-100">{t('common.loading')}</div>;
  }

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link
          to={catalogPath}
          className="mb-6 inline-flex text-sm font-semibold text-[#6B705C] hover:text-[#565a49] dark:text-[#8f9a7e]"
        >
          {rtl ? '→' : '←'} {t('common.back')}
        </Link>

        <div className="grid gap-8 rounded-2xl border border-[#E5E2D8] bg-white p-6 shadow-sm dark:border-slate-600 dark:bg-slate-800 md:grid-cols-2">
          <div className="relative">
            {product.stock === 0 && (
              <div className="absolute end-4 top-4 z-10 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                {t('store.outOfStock')}
              </div>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="absolute end-4 top-4 z-10 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                {t('store.lowStock', { stock: product.stock })}
              </div>
            )}
            <ProductCardImage
              src={product.image_url}
              alt={product.name}
              variant={catalogPath === '/products' ? 'public' : 'patient'}
              size="detail"
            />
          </div>
          <div>
            <h1 className={`mb-2 text-2xl font-bold dark:text-slate-100 ${product.stock === 0 ? 'text-slate-400' : ''}`}>{product.name}</h1>
            <p className={`mb-4 text-sm dark:text-slate-300 ${product.stock === 0 ? 'text-slate-400' : 'text-slate-500'}`}>{product.category}</p>
            <div className="mb-4">
              {product.discount_percentage > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-red-600 line-through">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <span className="text-4xl font-bold text-sky-600">
                      ${(parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)).toFixed(2)}
                    </span>
                  </div>
                  <span className="rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-700">
                    -{product.discount_percentage}%
                  </span>
                </div>
              ) : (
                <p className="text-3xl font-bold text-sky-600">${parseFloat(product.price).toFixed(2)}</p>
              )}
            </div>
            <p className="mb-6 text-slate-700 dark:text-slate-300">{product.description}</p>

            {product.stock > 0 ? (
              <>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium dark:text-slate-300">{t('common.quantity')}</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-1"
                    >
                      -
                    </button>
                    <span className="w-12 text-center dark:text-slate-100">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                      className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-1"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={addToCart}
                  disabled={product.stock < quantity || loading}
                  className="w-full rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {t('store.addToCart')}
                </button>
              </> 
            ) : (
              <button
                disabled
                className="w-full rounded-lg bg-slate-300 dark:bg-slate-600 px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
              >
                {t('store.outOfStock')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;

