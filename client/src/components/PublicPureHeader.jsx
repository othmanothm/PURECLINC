import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

function navClass(isActive) {
  const base =
    'rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap';
  if (isActive) {
    return `${base} bg-[#E5E2D8] text-[#1A1A1A] dark:bg-slate-600 dark:text-slate-100`;
  }
  return `${base} text-[#475467] hover:bg-[#E5E2D8]/70 dark:text-slate-200 dark:hover:bg-slate-700`;
}

export default function PublicPureHeader() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { language, theme, toggleLanguage, toggleTheme } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const rtl = i18n.language === 'ar';

  const isHome = pathname === '/';
  const isServices = pathname === '/services';
  const isProducts = pathname.startsWith('/store') || pathname.startsWith('/products');

  const dashboardPath =
    user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'doctor'
        ? '/doctor/dashboard'
        : user?.role === 'patient'
          ? '/patient/dashboard'
          : '/patient/dashboard';

  const bookHref = isAuthenticated && user?.role === 'patient' ? '/patient/appointments' : '/register';
  const cartHref = isAuthenticated && user?.role === 'patient' ? '/cart' : '/login';
  const productsHref = '/products';

  return (
    <header
      dir={rtl ? 'rtl' : 'ltr'}
      className="sticky top-0 z-50 border-b border-[#E5E2D8] bg-[#F2F0E8]/95 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 font-tajawal">
        <Link
          to="/"
          className="shrink-0 text-2xl font-extrabold tracking-tight text-[#1A1A1A] dark:text-slate-100"
        >
          {t('publicSite.brand')}
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          <Link to="/" className={navClass(isHome)}>
            {t('publicSite.navHome')}
          </Link>
          <Link to="/services" className={navClass(isServices)}>
            {t('publicSite.navServices')}
          </Link>
          <Link to={productsHref} className={navClass(isProducts)} state={{ from: pathname }}>
            {t('publicSite.navProducts')}
          </Link>
          <Link
            to={bookHref}
            className={navClass(pathname === '/register' || pathname.startsWith('/patient/appointments'))}
          >
            {t('publicSite.navBook')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLanguage}
            className="hidden rounded-lg border border-[#E5E2D8] bg-white/90 px-2.5 py-2 text-xs font-bold text-[#1A1A1A] shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:inline-flex"
            title={t('common.language')}
          >
            {language === 'ar' ? 'ع' : 'EN'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden rounded-lg border border-[#E5E2D8] bg-white/90 p-2 text-[#1A1A1A] shadow-sm hover:bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:inline-flex"
            title={t('common.theme')}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12H18.75m-3.75 3.75H16.5m-3.75-3.75H12m-3.75-3.75H7.5m-3.75 3.75H3m1.591-6.364l-1.591-1.591M12 18.75V21m-6.364-1.591l-1.591 1.591M18.75 12H21m-3.75 3.75H16.5m-3.75-3.75H12m-3.75-3.75H7.5m-3.75 3.75H3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          <Link
            to={cartHref}
            className="rounded-lg p-2 text-[#1A1A1A] transition-colors hover:bg-[#E5E2D8]/80 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={t('common.cart')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218a1.5 1.5 0 001.464-1.175l3.5-14.25a1.5 1.5 0 00-1.464-1.075H7.5m0 0L6.25 3.75H2.25M7.5 14.25v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V14.25m-4.5 0h4.5" />
            </svg>
          </Link>

          {isAuthenticated ? (
            <Link
              to={dashboardPath}
              className="rounded-xl bg-[#6B705C] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5a5f4f] dark:bg-[#7d826f] dark:hover:bg-[#6B705C]"
            >
              {t('common.dashboard')}
            </Link>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-[#6B705C] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#5a5f4f] dark:bg-[#7d826f] dark:hover:bg-[#6B705C]"
            >
              {t('common.login')}
            </Link>
          )}

          <button
            type="button"
            className="rounded-lg border border-[#E5E2D8] bg-white/90 p-2 md:hidden dark:border-slate-600 dark:bg-slate-800"
            aria-expanded={mobileOpen}
            aria-label={t('common.menu')}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-[#E5E2D8] bg-[#F2F0E8] px-4 py-4 dark:border-slate-700 dark:bg-slate-900 md:hidden">
          <div className="flex flex-col gap-2 font-tajawal" dir={rtl ? 'rtl' : 'ltr'}>
            <Link to="/" className={navClass(isHome)} onClick={() => setMobileOpen(false)}>
              {t('publicSite.navHome')}
            </Link>
            <Link to="/services" className={navClass(isServices)} onClick={() => setMobileOpen(false)}>
              {t('publicSite.navServices')}
            </Link>
            <Link to={productsHref} className={navClass(isProducts)} onClick={() => setMobileOpen(false)}>
              {t('publicSite.navProducts')}
            </Link>
            <Link to={bookHref} className={navClass(false)} onClick={() => setMobileOpen(false)}>
              {t('publicSite.navBook')}
            </Link>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                }}
                className="flex-1 rounded-lg border border-[#E5E2D8] bg-white py-2 text-sm font-bold text-[#1A1A1A] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {language === 'ar' ? 'English' : 'العربية'}
              </button>
              <button
                type="button"
                onClick={() => toggleTheme()}
                className="flex-1 rounded-lg border border-[#E5E2D8] bg-white py-2 text-sm font-bold text-[#1A1A1A] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {theme === 'dark' ? t('common.light') : t('common.dark')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
