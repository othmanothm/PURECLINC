import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../services/adminService';

function DashboardStats() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await adminService.getStats();
        setStats(data.stats || data);
      } catch (err) {
        console.error('Failed to load stats:', err);
        setError(err.message || 'Failed to load statistics');
        // Set default stats to prevent infinite loading
        setStats({
          totalPatients: 0,
          totalAppointments: 0,
          totalSales: 0,
          recentOrders: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Move useMemo before early return to follow Rules of Hooks
  const statCards = useMemo(() => {
    // Return empty array if stats not loaded yet
    if (!stats) {
      return [];
    }
    // Fallback labels in case translation fails
    const totalPatientsLabel = t('admin.totalPatients') || 'TOTAL PATIENTS';
    const totalAppointmentsLabel = t('admin.totalAppointments') || 'TOTAL APPOINTMENTS';
    const totalSalesLabel = t('admin.totalSales') || 'TOTAL SALES';
    const recentOrdersLabel = t('admin.recentOrders') || 'RECENT ORDERS';

    return [
    {
      label: totalPatientsLabel,
      value: stats.totalPatients || 0,
      gradient: 'from-sky-500 to-indigo-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      ),
    },
    {
      label: totalAppointmentsLabel,
      value: stats.totalAppointments || 0,
      gradient: 'from-emerald-500 to-teal-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      ),
    },
    {
      label: totalSalesLabel,
      value: `$${(stats.totalSales || 0).toFixed(2)}`,
      hint: t('admin.totalSalesHint') || '',
      gradient: 'from-purple-500 to-pink-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5H3.75m0 0h-.75m15 0h-2.25m-2.5 0H6.75m-2.25 0v.75c0 .414-.336.75-.75.75h-.75M6 7.5v3m6-3v3m6-3v3m-9 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      ),
    },
    {
      label: recentOrdersLabel,
      value: stats.recentOrders || 0,
      gradient: 'from-amber-500 to-orange-600',
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.242 2.61.673m-5.8 0a2.25 2.25 0 00-2.25 2.25v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V14.25m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 000 2.25H4.5m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375M21 12v.75m0 0v.75m0-.75v-.75m0 0h-3.375m-3.375 0h3.375" />
      ),
    },
  ];
  }, [stats, t]);

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg animate-pulse">
            <div className="mb-2 h-4 w-24 rounded bg-slate-200 dark:bg-slate-700"></div>
            <div className="h-8 w-16 rounded bg-slate-200 dark:bg-slate-700"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, idx) => (
        <div
          key={idx}
          className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-6 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl`}
        >
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <svg className="h-6 w-6 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                {card.icon}
              </svg>
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-90">{card.label}</p>
            <p className="text-3xl font-bold">{card.value}</p>
            {card.hint ? (
              <p className="mt-2 max-w-[14rem] text-[10px] font-medium leading-snug opacity-80">{card.hint}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminDashboard() {
  const { t } = useTranslation();

  // Fallback values in case translation fails
  const dashboardTitle = t('admin.dashboardTitle') || 'Admin Dashboard';
  const dashboardSubtitle = t('admin.dashboardSubtitle') || 'Manage your clinic operations';
  const manageText = t('admin.manage') || 'Manage';

  const managementLinks = useMemo(() => [
    {
      path: '/admin/users',
      label: t('common.users'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      ),
      gradient: 'from-sky-500 to-indigo-500',
      textGradient: 'from-sky-600 to-indigo-600',
    },
    {
      path: '/admin/doctors',
      label: t('common.doctors'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      ),
      gradient: 'from-emerald-500 to-teal-500',
      textGradient: 'from-emerald-600 to-teal-600',
    },
    {
      path: '/admin/products',
      label: t('common.products'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      ),
      gradient: 'from-purple-500 to-pink-500',
      textGradient: 'from-purple-600 to-pink-600',
    },
    {
      path: '/admin/orders',
      label: t('common.orders'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.242 2.61.673m-5.8 0a2.25 2.25 0 00-2.25 2.25v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V14.25m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-.375M21 12v.75m0 0v.75m0-.75v-.75m0 0h-3.375m-3.375 0h3.375" />
      ),
      gradient: 'from-amber-500 to-orange-500',
      textGradient: 'from-amber-600 to-orange-600',
    },
    {
      path: '/admin/patient-history',
      label: t('common.patientHistory'),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      ),
      gradient: 'from-sky-600 to-indigo-700',
      textGradient: 'from-sky-600 to-indigo-700',
    },
  ], [t]);

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">
            {dashboardTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">{dashboardSubtitle}</p>
        </div>

        <DashboardStats />

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {managementLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} text-white shadow-lg transition-transform group-hover:rotate-6`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  {link.icon}
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{link.label}</p>
              <p className={`mt-2 text-2xl font-bold bg-gradient-to-r ${link.textGradient} bg-clip-text text-transparent`}>
                {manageText}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;