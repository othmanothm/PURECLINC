import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

function ProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: 'Skin Care',
    price: '',
    stock: '',
    imageUrl: '',
    discountPercentage: '',
    lowStockThreshold: '',
    isActive: true,
  });
  const [stockAdjustId, setStockAdjustId] = useState(null);
  const [adjDelta, setAdjDelta] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await adminService.getProducts();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      shortDescription: '',
      category: 'Skin Care',
      price: '',
      stock: '',
      imageUrl: '',
      discountPercentage: '',
      lowStockThreshold: '',
      isActive: true,
    });
    setSelectedImage(null);
    setImagePreview(null);
    setEditingProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      shortDescription: product.short_description || '',
      category: product.category || 'Skin Care',
      price: product.price || '',
      stock: product.stock || '',
      imageUrl: product.image_url || '',
      discountPercentage: product.discount_percentage || '',
      lowStockThreshold:
        product.low_stock_threshold != null && product.low_stock_threshold !== ''
          ? String(product.low_stock_threshold)
          : '',
      isActive: product.is_active === undefined || Number(product.is_active) === 1,
    });
    setImagePreview(product.image_url || null);
    setShowCreateForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      if (form.shortDescription) {
        formData.append('shortDescription', form.shortDescription);
      }
      formData.append('category', form.category);
      formData.append('price', parseFloat(form.price));
      formData.append('stock', parseInt(form.stock) || 0);
      formData.append('discountPercentage', parseFloat(form.discountPercentage) || 0);
      formData.append('isActive', form.isActive ? 'true' : 'false');
      if (form.lowStockThreshold !== '' && form.lowStockThreshold != null) {
        formData.append('lowStockThreshold', parseInt(form.lowStockThreshold, 10));
      }

      // If image file is selected, append it; otherwise append imageUrl
      if (selectedImage) {
        formData.append('image', selectedImage);
      } else if (form.imageUrl) {
        formData.append('imageUrl', form.imageUrl);
      }

      // Use api instance for FormData
      const api = (await import('../../services/api')).default;
      
      if (editingProduct) {
        // Update existing product
        await api.put(`/admin/products/${editingProduct.id}`, formData);
        toast.success(t('admin.productUpdated'));
      } else {
        // Create new product
        await api.post('/admin/products', formData);
        toast.success(t('admin.productCreated'));
      }

      setShowCreateForm(false);
      resetForm();
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || (editingProduct ? t('admin.failedToUpdateProduct') : t('admin.failedToCreateProduct')));
    }
  };

  const submitStockAdjust = async (productId) => {
    const d = parseInt(adjDelta, 10);
    if (adjDelta === '' || Number.isNaN(d) || d === 0) {
      toast.error(t('admin.stockDeltaInvalid') || 'Enter a non-zero whole number for adjustment');
      return;
    }
    try {
      await adminService.adjustProductStock(productId, {
        delta: d,
        reason: adjReason.trim() || undefined,
      });
      toast.success(t('admin.stockAdjusted') || 'Stock updated');
      setStockAdjustId(null);
      setAdjDelta('');
      setAdjReason('');
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.stockAdjustFailed') || 'Stock adjustment failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteProduct'))) return;
    try {
      await adminService.deleteProduct(id);
      loadProducts();
      toast.success(t('admin.productDeleted'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('admin.productsManagement')}</h1>
          <button
            onClick={() => {
              if (showCreateForm) {
                resetForm();
              }
              setShowCreateForm(!showCreateForm);
            }}
            className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            {showCreateForm ? t('common.cancel') : `+ ${t('admin.addProduct')}`}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mb-6 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">
              {editingProduct ? t('admin.editProduct') : t('admin.createProduct')}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder={t('common.name')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                required
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              >
                <option value="Skin Care">{t('store.skinCare')}</option>
                <option value="Hair Care">{t('store.hairCare')}</option>
                <option value="Body Care">{t('store.bodyCare')}</option>
              </select>
              <input
                type="number"
                step="0.01"
                placeholder={t('common.price')}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder={t('store.discount') + ' % (0-100)'}
                value={form.discountPercentage}
                onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder={t('common.stock')}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min="0"
                placeholder={t('admin.lowStockThreshold') || 'Low-stock alert threshold (optional)'}
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              />
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('common.image')}
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 dark:file:bg-sky-900/30 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 dark:file:text-sky-300 hover:file:bg-sky-100 dark:hover:file:bg-sky-800"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">{t('admin.preview')}:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-800 px-2 text-slate-500 dark:text-slate-400">{t('common.or')}</span>
                    </div>
                  </div>
                  <input
                    type="url"
                    placeholder={t('admin.imageUrl')}
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder={t('admin.shortDescription') || 'Short description (storefront teaser)'}
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm md:col-span-2"
              />
              <textarea
                placeholder={t('common.description')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm md:col-span-2"
              />
              <label className="flex cursor-pointer items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{t('admin.activeInStore')}</span>
              </label>
            </div>
            <button
              type="submit"
              className="mt-6 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              {editingProduct ? t('admin.updateProduct') : t('admin.createProduct')}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('store.noProducts')}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {products.map((product) => {
              const lowThr =
                product.low_stock_threshold != null && product.low_stock_threshold !== ''
                  ? Number(product.low_stock_threshold)
                  : 5;
              return (
              <div key={product.id} className="rounded-lg bg-white dark:bg-slate-800 p-4 shadow-sm">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="mb-3 h-48 w-full rounded-lg object-cover"
                  />
                )}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold dark:text-slate-100">{product.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {product.is_active === 0 || product.is_active === false ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                        {t('admin.hiddenFromStore')}
                      </span>
                    ) : null}
                    {product.stock > 0 && product.stock <= lowThr ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        {t('admin.lowStock')}
                      </span>
                    ) : null}
                    {product.stock === 0 ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                        {t('store.outOfStock')}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{product.category}</p>
                <div className="mt-2">
                  {product.discount_percentage > 0 ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-red-600 dark:text-red-400 line-through">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                        <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                          ${(parseFloat(product.price) * (1 - parseFloat(product.discount_percentage) / 100)).toFixed(2)}
                        </span>
                      </div>
                      <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300">
                        -{product.discount_percentage}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-sky-600 dark:text-sky-400">${parseFloat(product.price).toFixed(2)}</p>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('common.stock')}: {product.stock}
                  {product.low_stock_threshold != null && product.low_stock_threshold !== '' ? (
                    <span className="ml-2 text-slate-400">({t('admin.threshold') || 'threshold'} {product.low_stock_threshold})</span>
                  ) : null}
                </p>
                {stockAdjustId === product.id && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-900/40">
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t('admin.adjustStock') || 'Adjust stock'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        placeholder="+10 / -2"
                        value={adjDelta}
                        onChange={(e) => setAdjDelta(e.target.value)}
                        className="w-28 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700"
                      />
                      <input
                        type="text"
                        placeholder={t('admin.adjustReason') || 'Reason (optional)'}
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        className="min-w-[140px] flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => submitStockAdjust(product.id)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        {t('common.apply') || 'Apply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStockAdjustId(null);
                          setAdjDelta('');
                          setAdjReason('');
                        }}
                        className="rounded bg-slate-400 px-3 py-1 text-xs text-white hover:bg-slate-500"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 rounded bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 transition-colors"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      stockAdjustId === product.id
                        ? (setStockAdjustId(null), setAdjDelta(''), setAdjReason(''))
                        : (setStockAdjustId(product.id), setAdjDelta(''), setAdjReason(''))
                    }
                    className="flex-1 rounded bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 transition-colors"
                  >
                    {t('admin.adjustStock') || 'Adjust'}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;

