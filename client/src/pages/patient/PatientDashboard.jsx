import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { orderService } from '../../services/orderService';

function PatientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [recentOrder, setRecentOrder] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalOrders: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(null); // Track which user ID has been loaded

  useEffect(() => {
    // Only load once per user ID
    if (!user?.id || hasLoadedRef.current === user.id) return;
    
    hasLoadedRef.current = user.id;
    
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Load appointments
        const appointmentsData = await appointmentService.getMyAppointments();
        const appointments = appointmentsData.appointments || [];
        const upcoming = appointments
          .filter((apt) => apt.status !== 'cancelled' && apt.status !== 'completed')
          .sort((a, b) => {
            const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
            const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
            return dateA - dateB;
          })[0];
        setUpcomingAppointment(upcoming || null);

        // Load orders
        const ordersData = await orderService.getMyOrders();
        const orders = ordersData.orders || [];
        setRecentOrder(orders[0] || null);

        // Calculate stats
        const totalSpent = orders.reduce((sum, order) => {
          return sum + parseFloat(order.total_price || 0);
        }, 0);

        setStats({
          totalAppointments: appointments.length,
          upcomingAppointments: appointments.filter(
            (apt) => apt.status !== 'cancelled' && apt.status !== 'completed'
          ).length,
          totalOrders: orders.length,
          totalSpent: totalSpent,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50/50 to-sky-100/70 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">
                {t('dashboard.welcomeBack')}, <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">{user?.name}</span>!
              </h1>
              <p className="text-slate-600 dark:text-slate-300">{t('dashboard.whatsHappening')}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link
                to="/patient/appointments"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t('dashboard.bookAppointment')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-6 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <svg className="h-8 w-8 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-90">{t('dashboard.totalAppointments')}</p>
              <p className="text-3xl font-bold">{stats.totalAppointments}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <svg className="h-8 w-8 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-90">{t('dashboard.upcomingAppointments')}</p>
              <p className="text-3xl font-bold">{stats.upcomingAppointments}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <svg className="h-8 w-8 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5H3.75m0 0h-.75m15 0h-2.25m-2.5 0H6.75m-2.25 0v.75c0 .414-.336.75-.75.75h-.75M6 7.5v3m6-3v3m6-3v3m-9 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-90">{t('dashboard.totalOrders')}</p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
            <div className="relative">
              <div className="mb-2 flex items-center justify-between">
                <svg className="h-8 w-8 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-90">{t('dashboard.totalSpent')}</p>
              <p className="text-3xl font-bold">${stats.totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointment & Recent Order */}
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          {upcomingAppointment ? (
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.nextAppointment')}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{upcomingAppointment.doctor_name}</p>
                  </div>
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    upcomingAppointment.status === 'confirmed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {upcomingAppointment.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span>{formatDate(upcomingAppointment.appointment_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{upcomingAppointment.appointment_time}</span>
                </div>
              </div>
              <Link
                to="/patient/appointments"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
              >
                {t('dashboard.viewDetails')}
              </Link>
            </div>
          ) : (
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.noUpcomingAppointments')}</p>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{t('dashboard.bookYourFirstAppointment')}</p>
                <Link
                  to="/patient/appointments"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                >
                  {t('dashboard.bookAppointment')}
                </Link>
              </div>
            </div>
          )}

          {recentOrder ? (
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5H3.75m0 0h-.75m15 0h-2.25m-2.5 0H6.75m-2.25 0v.75c0 .414-.336.75-.75.75h-.75M6 7.5v3m6-3v3m6-3v3m-9 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.recentOrder')}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.orderNumber')}{recentOrder.id}</p>
                  </div>
                </div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    recentOrder.status === 'paid'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : recentOrder.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {recentOrder.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{t('dashboard.total')}</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">${parseFloat(recentOrder.total_price).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span>{formatDate(recentOrder.created_at)}</span>
                </div>
              </div>
              <Link
                to="/orders"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
              >
                {t('dashboard.viewOrder')}
              </Link>
            </div>
          ) : (
            <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5H3.75m0 0h-.75m15 0h-2.25m-2.5 0H6.75m-2.25 0v.75c0 .414-.336.75-.75.75h-.75M6 7.5v3m6-3v3m6-3v3m-9 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.noOrders')}</p>
                <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{t('dashboard.startShopping')}</p>
                <Link
                  to="/store"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                >
                  {t('dashboard.browseStore')}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">{t('dashboard.quickActions')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/patient/appointments"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg transition-transform group-hover:rotate-6">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.appointments')}</p>
              <p className="mt-2 text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">{t('dashboard.bookNow')}</p>
            </Link>
            <Link
              to="/patient/medical-profile"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg transition-transform group-hover:rotate-6">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.242 2.61.673m-5.8 0a2.25 2.25 0 00-2.25 2.25v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V14.25m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 000 2.25H4.5m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375M21 12v.75m0 0v.75m0-.75v-.75m0 0h-3.375m-3.375 0h3.375" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.medicalProfile')}</p>
              <p className="mt-2 text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('dashboard.update')}</p>
            </Link>
            <Link
              to="/store"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg transition-transform group-hover:rotate-6">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.store')}</p>
              <p className="mt-2 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('dashboard.shop')}</p>
            </Link>
            <Link
              to="/patient/messages"
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg transition-transform group-hover:rotate-6">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.messages')}</p>
              <p className="mt-2 text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{t('dashboard.chat')}</p>
            </Link>
          </div>
        </div>

        {/* Additional Links */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.quickLinks')}</h2>
            <div className="space-y-2">
              <Link to="/patient/appointments" className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                {t('dashboard.bookAppointment')}
              </Link>
              <Link to="/patient/medical-profile" className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                {t('dashboard.updateMedicalProfile')}
              </Link>
              <Link to="/store" className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-purple-50 dark:hover:bg-slate-700 hover:text-purple-600 dark:hover:text-purple-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                {t('dashboard.browseStore')}
              </Link>
              <Link to="/orders" className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 dark:hover:text-amber-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                {t('dashboard.viewOrders')}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 p-6 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.welcomeMessage')}</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('dashboard.welcomeDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;


