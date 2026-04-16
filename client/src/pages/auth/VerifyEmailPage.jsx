import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { authService } from '../../services/authService';

function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    const q = searchParams.get('email');
    if (q) setEmail(q);
  }, [searchParams]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t('auth.verificationCodeInvalid'));
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authService.verifyEmail(email.trim(), code.trim());
      login(token, user);
      navigate('/patient/medical-profile', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('auth.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError(t('auth.emailRequiredForResend'));
      return;
    }
    setResendLoading(true);
    try {
      const data = await authService.resendVerification(email.trim());
      setInfo(data.message || t('auth.verificationCodeSent'));
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('auth.resendFailed'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-8 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="surface-glass-light w-full max-w-md rounded-2xl p-8 shadow-2xl shadow-sky-300/20 dark:shadow-none">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-sky-500/50 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
          >
            {t('common.back')}
          </Link>
        </div>

        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('auth.verifyEmailTitle')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('auth.verifyEmailSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
            {info}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="ve-email">
              {t('auth.email')}
            </label>
            <input
              id="ve-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="ve-code">
              {t('auth.verificationCode')}
            </label>
            <input
              id="ve-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-center text-lg tracking-[0.4em] font-mono shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60"
          >
            {loading ? t('common.loading') : t('auth.confirmEmail')}
          </button>
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading}
          className="mt-4 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60"
        >
          {resendLoading ? t('common.loading') : t('auth.resendVerificationCode')}
        </button>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
