import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { patientService } from '../../services/patientService';

function formatSessionDate(dateStr, timeStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const datePart = d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return timeStr ? `${datePart} · ${timeStr}` : datePart;
}

function formatOrderDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function paymentStatusLabel(t, paymentStatus) {
  switch (paymentStatus) {
    case 'paid':
      return t('orders.paid');
    case 'pending':
      return t('orders.pending');
    case 'failed':
      return t('billing.paymentFailed');
    case 'refunded':
      return t('billing.paymentRefunded');
    default:
      return paymentStatus ? paymentStatus.replace(/_/g, ' ') : '—';
  }
}

function orderFulfillmentLabel(t, status) {
  switch (status) {
    case 'awaiting_payment':
      return t('orders.awaiting_payment');
    case 'confirmed':
      return t('orders.confirmed');
    case 'cancelled':
      return t('orders.cancelled');
    case 'pending':
      return t('orders.pending');
    default:
      return status ? status.replace(/_/g, ' ') : '—';
  }
}

const defaultSummary = {
  totalTreatmentPaid: 0,
  totalStorePaid: 0,
  totalSpent: 0,
  totalRemaining: 0,
  totalSessions: 0,
  totalStoreOrders: 0,
};

function PatientBillingPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [storeOrders, setStoreOrders] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await patientService.getMyBillingSummary();
        if (!cancelled) {
          setSessions(data.sessions || []);
          setStoreOrders(data.storeOrders || []);
          setSummary({ ...defaultSummary, ...(data.summary || {}) });
        }
      } catch (e) {
        if (!cancelled) {
          setSessions([]);
          setStoreOrders([]);
          setSummary(defaultSummary);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const s = { ...defaultSummary, ...summary };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50/50 to-sky-100/70 px-4 py-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t('billing.pageTitle')}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{t('billing.subtitle')}</p>
          </div>
          <Link
            to="/patient/dashboard"
            className="text-sm font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            ← {t('common.back')}
          </Link>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-4 text-white shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-90">
              {t('billing.totalSpent')}
            </p>
            <p className="mt-1 text-2xl font-bold">${Number(s.totalSpent).toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('billing.totalRemaining')}
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
              ${Number(s.totalRemaining).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('billing.totalTreatmentPaid')}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              ${Number(s.totalTreatmentPaid).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('billing.totalStorePaid')}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              ${Number(s.totalStorePaid).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-md dark:bg-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t('billing.totalSessions')}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
              {s.totalSessions}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-md dark:bg-slate-800">
            {t('common.loading')}
          </p>
        ) : (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-slate-800">
              <h2 className="border-b border-slate-200 px-4 py-3 text-lg font-bold text-slate-900 dark:border-slate-600 dark:text-slate-100">
                {t('billing.treatmentSessionsSection')}
              </h2>
              {sessions.length === 0 ? (
                <p className="p-8 text-center text-slate-500 dark:text-slate-400">{t('billing.noSessions')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('admin.date')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('admin.doctor')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('billing.sessionPrice')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('billing.amountPaid')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('billing.remainingBalance')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-100 dark:border-slate-700/80"
                        >
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                            {formatSessionDate(row.appointment_date, row.appointment_time)}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                            {row.doctor_name}
                          </td>
                          <td className="px-4 py-3">${Number(row.session_price).toFixed(2)}</td>
                          <td className="px-4 py-3">${Number(row.amount_paid).toFixed(2)}</td>
                          <td className="px-4 py-3 font-medium text-amber-700 dark:text-amber-400">
                            ${Number(row.remaining_balance).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-slate-800">
              <h2 className="border-b border-slate-200 px-4 py-3 text-lg font-bold text-slate-900 dark:border-slate-600 dark:text-slate-100">
                {t('billing.storeOrdersSection')}
              </h2>
              {storeOrders.length === 0 ? (
                <p className="p-8 text-center text-slate-500 dark:text-slate-400">{t('billing.noStoreOrders')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('billing.orderId')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('admin.date')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('billing.orderTotal')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('admin.paymentStatus')}
                        </th>
                        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">
                          {t('admin.orderStatus')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {storeOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-slate-100 dark:border-slate-700/80"
                        >
                          <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                            #{order.id}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                            {formatOrderDate(order.created_at)}
                          </td>
                          <td className="px-4 py-3">${Number(order.total_price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                            {paymentStatusLabel(t, order.payment_status)}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                            {orderFulfillmentLabel(t, order.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientBillingPage;
