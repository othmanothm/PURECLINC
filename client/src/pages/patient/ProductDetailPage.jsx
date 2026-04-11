import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';

function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
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

        <div className="grid gap-8 rounded-lg bg-white dark:bg-slate-800 p-6 shadow-sm md:grid-cols-2">
          <div className="relative flex h-96 w-full items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
            {/* Stock Status Tags */}
            {product.stock === 0 && (
              <div className="absolute top-4 right-4 z-10 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                {t('store.outOfStock')}
              </div>
            )}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="absolute top-4 right-4 z-10 rounded-full bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                {t('store.lowStock', { stock: product.stock })}
              </div>
            )}
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
                className="h-16 w-16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75A1.5 1.5 0 0021.75 5.25h-16.5A1.5 1.5 0 003.75 6.75v12.75a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
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

