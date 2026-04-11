import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';

function statusBadgeClass(status) {
  switch (status) {
    case 'awaiting_payment':
      return 'bg-amber-100 text-amber-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function paymentBadgeClass(paymentStatus) {
  switch (paymentStatus) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function OrdersPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stripeSessionId = searchParams.get('session_id');

  // Stripe return: confirm payment via server (webhook), not URL alone
  useEffect(() => {
    if (!stripeSessionId) return undefined;

    let attempts = 0;
    const maxAttempts = 20;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await orderService.getOrderByCheckoutSession(stripeSessionId);
        const order = data.order;
        if (order.payment_status === 'paid') {
          toast.success(t('orders.paymentSuccessful'));
          localStorage.removeItem('pureskin_cart');
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete('session_id');
              return next;
            },
            { replace: true }
          );
          loadOrders();
          return;
        }
      } catch (e) {
        console.error(e);
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        toast.error(t('orders.paymentPending'));
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('session_id');
            return next;
          },
          { replace: true }
        );
      }
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [stripeSessionId, setSearchParams, t]);

  const codSuccess = searchParams.get('success');
  const codOrderId = searchParams.get('orderId');

  useEffect(() => {
    if (codSuccess !== 'cod' || !codOrderId) return undefined;
    toast.success(t('orders.orderPlacedCod'));
    localStorage.removeItem('pureskin_cart');
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('success');
        next.delete('orderId');
        return next;
      },
      { replace: true }
    );
    loadOrders();
    return undefined;
  }, [codSuccess, codOrderId, setSearchParams, t]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('orders.title')}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t('orders.subtitle')}</p>
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
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5H3.75m0 0h-.75m15 0h-2.25m-2.5 0H6.75m-2.25 0v.75c0 .414-.336.75-.75.75h-.75M6 7.5v3m6-3v3m6-3v3m-9 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('orders.order')} #{order.id}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                      ${parseFloat(order.total_price).toFixed(2)}
                    </p>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${paymentBadgeClass(order.payment_status)}`}>
                        {t('orders.payment')}: {order.payment_status}
                      </span>
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
                        <li key={idx} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                          <div className="flex-1">
                            <span className="text-slate-700">
                              {item.product_name} × {item.quantity}
                            </span>
                            {hasDiscount && (
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-red-600 line-through">
                                  ${(originalPrice * item.quantity).toFixed(2)}
                                </span>
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                  -{discountPercentage}%
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-900">
                              ${(finalPrice * item.quantity).toFixed(2)}
                            </span>
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
