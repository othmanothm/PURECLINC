import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { doctorService } from '../../services/doctorService';

function DoctorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({ appointments: 0, patients: 0 });
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(null); // Track which user ID has been loaded

  useEffect(() => {
    // Only load once per user ID
    if (!user?.id || hasLoadedRef.current === user.id) return;
    
    hasLoadedRef.current = user.id;

    const loadStats = async () => {
      setLoading(true);
      try {
        const [appointmentsData, patientsData] = await Promise.all([
          doctorService.getMyAppointments(),
          doctorService.getPatients(),
        ]);

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointmentsData.appointments?.filter(
          (apt) => apt.appointment_date === today && apt.status !== 'cancelled'
        ).length || 0;

        setStats({
          appointments: todayAppointments,
          patients: patientsData.patients?.length || 0,
        });
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.id]);

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">
            {t('doctor.welcome')}, <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Dr. {user?.name}</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300">{t('doctor.overviewToday')}</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 dark:from-sky-600 dark:to-indigo-700 p-6 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
            <div className="relative">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{t('doctor.todaysAppointments')}</p>
              </div>
              <p className="text-4xl font-bold">{loading ? '...' : stats.appointments}</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 p-6 text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-white/10"></div>
            <div className="relative">
              <div className="mb-2 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-90">{t('doctor.totalPatients')}</p>
              </div>
              <p className="text-4xl font-bold">{loading ? '...' : stats.patients}</p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Link
            to="/doctor/appointments"
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg transition-transform group-hover:rotate-6">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.appointments')}</p>
            <p className="mt-2 text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">{t('doctor.manage')}</p>
          </Link>
          <Link
            to="/doctor/patients"
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg transition-transform group-hover:rotate-6">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.patients')}</p>
            <p className="mt-2 text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{t('doctor.view')}</p>
          </Link>
          <Link
            to="/doctor/messages"
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg transition-transform group-hover:rotate-6">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125-7.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zM16.5 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zM16.5 12H15m-1.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m-1.5 0H8.25m0 0H6m.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H6m3 6.75h12m-12 0a2.25 2.25 0 01-2.25-2.25V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08m5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.242 2.61.673m-5.8 0a2.25 2.25 0 00-2.25 2.25v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V14.25m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-.375M21 12v.75m0 0v.75m0-.75v-.75m0 0h-3.375m-3.375 0h3.375" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.messages')}</p>
            <p className="mt-2 text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{t('dashboard.chat')}</p>
          </Link>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">{t('dashboard.quickLinks')}</h2>
          <div className="space-y-3">
            <Link to="/doctor/appointments" className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              {t('doctor.viewAppointments')}
            </Link>
            <Link to="/doctor/patients" className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              {t('doctor.managePatients')}
            </Link>
            <Link to="/doctor/messages" className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-sky-600 dark:hover:text-sky-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
              {t('doctor.patientMessages')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorDashboard;

