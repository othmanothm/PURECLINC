import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrders({ status: statusFilter || undefined });
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      toast.success(t('admin.orderStatusUpdated', { status: newStatus }));
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.failedToUpdateOrderStatus'));
    }
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('admin.ordersManagement')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('admin.viewManageOrders')}</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">{t('admin.allStatus')}</option>
            <option value="pending">{t('orders.pending')}</option>
            <option value="confirmed">{t('orders.confirmed')}</option>
            <option value="paid">{t('orders.paid')}</option>
            <option value="cancelled">{t('orders.cancelled')}</option>
          </select>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        ) : orders.length === 0 ? (
          <div className="rounded-lg bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">{t('orders.noOrders')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="group rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5H3.75m0 0h-.75m15 0h-2.25m-2.5 0H6.75m-2.25 0v.75c0 .414-.336.75-.75.75h-.75M6 7.5v3m6-3v3m6-3v3m-9 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('orders.order')} #{order.id}</p>
                      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{order.patient_name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{order.patient_email}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                      ${parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${
                          order.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'confirmed')}
                          className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:scale-105"
                        >
                          {t('admin.confirmOrder')}
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'paid')}
                          className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:scale-105"
                        >
                          {t('admin.markAsPaid')}
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-red-700"
                        >
                          {t('common.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-sky-50 dark:bg-slate-700 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orders.items')}:</p>
                  <ul className="space-y-2">
                    {order.items?.map((item, idx) => {
                      const originalPrice = parseFloat(item.original_price || item.price);
                      const finalPrice = parseFloat(item.price);
                      const discountPercentage = parseFloat(item.discount_percentage || 0);
                      const hasDiscount = discountPercentage > 0 && originalPrice > finalPrice;
                      
                      return (
                        <li key={idx} className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                          <div className="flex-1">
                            <span className="text-slate-700 dark:text-slate-300">
                              {item.product_name} × {item.quantity}
                            </span>
                            {hasDiscount && (
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-red-600 dark:text-red-400 line-through">
                                  ${(originalPrice * item.quantity).toFixed(2)}
                                </span>
                                <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
                                  -{discountPercentage}%
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              ${(finalPrice * item.quantity).toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                ${finalPrice.toFixed(2)} {t('cart.each')}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;

