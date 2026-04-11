import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

function formatDateTime(createdAt) {
  if (!createdAt) return '—';
  return new Date(createdAt).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

function AdminPatientHistoryPage() {
  const { t } = useTranslation();
  const [patientUsers, setPatientUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [patientsError, setPatientsError] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingUsers(true);
      setPatientsError(null);
      try {
        const res = await adminService.getPatientUserOptions();
        if (!cancelled) {
          setPatientUsers(Array.isArray(res.users) ? res.users : []);
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            e.response?.data?.message ||
            e.response?.statusText ||
            t('admin.patientListLoadFailed');
          setPatientsError(msg);
          setPatientUsers([]);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoadingUsers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const loadHistory = useCallback(
    async (userId) => {
      if (!userId) {
        setData(null);
        setHistoryError(null);
        return;
      }
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        const res = await adminService.getPatientFinancialHistory(userId);
        setData(res);
      } catch (e) {
        const msg = e.response?.data?.message || t('common.error');
        setHistoryError(msg);
        setData(null);
        toast.error(msg);
      } finally {
        setLoadingHistory(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (selectedUserId) loadHistory(selectedUserId);
    else {
      setData(null);
      setHistoryError(null);
    }
  }, [selectedUserId, loadHistory]);

  const selectedLabel = patientUsers.find((u) => String(u.id) === selectedUserId);

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t('admin.patientHistoryTitle')}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {t('admin.patientHistorySubtitle')}
            </p>
          </div>
          <Link
            to="/admin/dashboard"
            className="text-sm font-semibold text-sky-600 hover:underline dark:text-sky-400"
          >
            ← {t('common.back')}
          </Link>
        </div>

        <div className="mb-8">
          <label
            htmlFor="admin-patient-history-select"
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {t('admin.selectPatient')}
          </label>
          <select
            id="admin-patient-history-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={loadingUsers || Boolean(patientsError)}
            className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">
              {loadingUsers ? t('common.loading') : t('admin.choosePatientPrompt')}
            </option>
            {patientUsers.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {patientsError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {patientsError}
            </p>
          )}
          {!loadingUsers && !patientsError && patientUsers.length === 0 && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              {t('admin.patientListEmpty')}
            </p>
          )}
        </div>

        {!selectedUserId && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center dark:border-slate-600 dark:bg-slate-800/50">
            <p className="text-slate-600 dark:text-slate-300">{t('admin.patientHistoryEmptyState')}</p>
          </div>
        )}

        {selectedUserId && historyError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {historyError}
          </div>
        )}

        {selectedUserId && loadingHistory && !data && (
          <div className="space-y-6">
            <p className="text-slate-600 dark:text-slate-400">{t('common.loading')}</p>
            <div className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          </div>
        )}

        {data && !loadingHistory && (
          <>
            <p className="mb-6 text-lg font-semibold text-slate-800 dark:text-slate-200">
              {data.patient?.name ?? selectedLabel?.name}{' '}
              <span className="text-sm font-normal text-slate-500">
                ({data.patient?.email ?? selectedLabel?.email})
              </span>
            </p>

            <section className="mb-10">
              <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('admin.treatmentSessionsSection')}
              </h2>
              <div className="mb-4 flex flex-wrap gap-4 rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {t('admin.totalTreatmentPaid')}
                  </span>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    ${Number(data.treatmentSummary?.totalTreatmentPaid ?? 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {t('admin.totalTreatmentRemaining')}
                  </span>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                    ${Number(data.treatmentSummary?.totalTreatmentRemaining ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                {!data.treatmentSessions || data.treatmentSessions.length === 0 ? (
                  <p className="p-6 text-slate-500 dark:text-slate-400">{t('billing.noSessions')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold">{t('admin.date')}</th>
                          <th className="px-4 py-3 font-semibold">{t('admin.doctor')}</th>
                          <th className="px-4 py-3 font-semibold">{t('admin.sessionPrice')}</th>
                          <th className="px-4 py-3 font-semibold">{t('billing.amountPaid')}</th>
                          <th className="px-4 py-3 font-semibold">{t('admin.remainingBalance')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.treatmentSessions.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-slate-100 dark:border-slate-700/80"
                          >
                            <td className="px-4 py-3">
                              {formatSessionDate(row.appointment_date, row.appointment_time)}
                            </td>
                            <td className="px-4 py-3">{row.doctor_name}</td>
                            <td className="px-4 py-3">${Number(row.session_price).toFixed(2)}</td>
                            <td className="px-4 py-3">${Number(row.amount_paid).toFixed(2)}</td>
                            <td className="px-4 py-3 text-amber-700 dark:text-amber-400">
                              ${Number(row.remaining).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('admin.storePurchasesSection')}
              </h2>
              <div className="mb-4 rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {t('admin.totalStoreSalesLabel')}
                </span>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  ${Number(data.storeSummary?.totalStoreSales ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                {!data.storeOrders || data.storeOrders.length === 0 ? (
                  <p className="p-6 text-slate-500 dark:text-slate-400">{t('orders.noOrders')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold">{t('admin.orderId')}</th>
                          <th className="px-4 py-3 font-semibold">{t('admin.date')}</th>
                          <th className="px-4 py-3 font-semibold">{t('admin.orderTotal')}</th>
                          <th className="px-4 py-3 font-semibold">{t('admin.paymentStatus')}</th>
                          <th className="px-4 py-3 font-semibold">{t('admin.orderStatus')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.storeOrders.map((o) => (
                          <tr
                            key={o.id}
                            className="border-b border-slate-100 dark:border-slate-700/80"
                          >
                            <td className="px-4 py-3 font-medium">#{o.id}</td>
                            <td className="px-4 py-3">{formatDateTime(o.created_at)}</td>
                            <td className="px-4 py-3">${Number(o.total_price).toFixed(2)}</td>
                            <td className="px-4 py-3">{o.payment_status}</td>
                            <td className="px-4 py-3">{o.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('admin.overallSummary')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-4 shadow dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {t('admin.totalTreatmentPayments')}
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    ${Number(data.overall?.totalTreatmentPayments ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {t('admin.overallRemainingBalance')}
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    ${Number(data.overall?.remainingTreatmentBalance ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 shadow dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    {t('admin.totalStoreSalesLabel')}
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    ${Number(data.overall?.totalStoreSales ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 p-4 text-white shadow">
                  <p className="text-xs font-semibold uppercase opacity-90">
                    {t('admin.totalRevenue')}
                  </p>
                  <p className="mt-1 text-xl font-bold">
                    ${Number(data.overall?.totalRevenue ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPatientHistoryPage;
