import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [noteDrafts, setNoteDrafts] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getOrders({
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        search: debouncedSearch || undefined,
      });
      setOrders(data.orders || []);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        (data.orders || []).forEach((o) => {
          if (next[o.id] === undefined) {
            next[o.id] = o.admin_notes ?? '';
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to load orders:', err);
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentStatusFilter, debouncedSearch]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

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

  const handleSaveNotes = async (orderId, adminNotes) => {
    try {
      await adminService.updateOrderNotes(orderId, adminNotes);
      toast.success(t('admin.orderNotesSaved') || 'Notes saved');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save notes');
    }
  };

  const handlePaymentStatusChange = async (orderId, paymentStatus) => {
    try {
      await adminService.updateOrderPaymentStatus(orderId, paymentStatus);
      toast.success(t('admin.paymentStatusUpdated') || 'Payment status updated');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update payment status');
    }
  };

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('admin.ordersManagement')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('admin.viewManageOrders')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder={t('admin.searchOrders') || 'Order #, name, or email'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-w-[200px] rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">{t('admin.allStatus')}</option>
              <option value="awaiting_payment">{t('orders.awaiting_payment')}</option>
              <option value="pending">{t('orders.pending')}</option>
              <option value="confirmed">{t('orders.confirmed')}</option>
              <option value="cancelled">{t('orders.cancelled')}</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">{t('admin.allPaymentStatus') || 'All payments'}</option>
              <option value="unpaid">unpaid</option>
              <option value="paid">paid</option>
              <option value="failed">failed</option>
              <option value="refunded">refunded</option>
            </select>
          </div>
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
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
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
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{formatDate(order.created_at)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">{order.status}</span>
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                          {t('orders.payment')}: {order.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                      ${parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <div className="mt-2 flex flex-col items-end gap-2">
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'confirmed')}
                          className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:scale-105"
                        >
                          {t('admin.confirmOrder')}
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'confirmed' || order.status === 'awaiting_payment') && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-red-700"
                        >
                          {order.status === 'awaiting_payment'
                            ? t('admin.cancelAbandonedCheckout')
                            : t('common.cancel')}
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
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-600 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('orders.payment')}
                    </label>
                    <select
                      value={order.payment_status}
                      onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="unpaid">unpaid</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('admin.internalNotes') || 'Internal notes'}
                    </label>
                    <textarea
                      rows={2}
                      value={noteDrafts[order.id] !== undefined ? noteDrafts[order.id] : (order.admin_notes || '')}
                      onChange={(e) =>
                        setNoteDrafts((d) => ({ ...d, [order.id]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                      placeholder={t('admin.internalNotesPlaceholder') || 'Staff-only notes'}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveNotes(
                          order.id,
                          noteDrafts[order.id] !== undefined ? noteDrafts[order.id] : order.admin_notes
                        )
                      }
                      className="mt-2 rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-600"
                    >
                      {t('admin.saveNotes') || 'Save notes'}
                    </button>
                  </div>
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
