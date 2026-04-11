import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reviewService } from '../services/reviewService';
import { useAuth } from '../auth/AuthContext';

function ReviewsTestPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const canSubmit = useMemo(() => isAuthenticated && user?.role === 'patient', [isAuthenticated, user?.role]);
  const [searchParams] = useSearchParams();

  const [approvedReviews, setApprovedReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [appointmentId, setAppointmentId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [appointmentLocked, setAppointmentLocked] = useState(false);

  const reviewedKey = 'pureskin_reviewed_appointments';

  async function loadApproved() {
    setLoading(true);
    setError('');
    try {
      const data = await reviewService.getApprovedReviews({ limit: 50, offset: 0 });
      setApprovedReviews(data.reviews || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApproved();
  }, []);

  useEffect(() => {
    const qp = searchParams.get('appointmentId');
    if (qp) {
      setAppointmentId(qp);
      setAppointmentLocked(true);
    } else {
      setAppointmentLocked(false);
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        appointmentId: Number(appointmentId),
        rating: Number(rating),
        comment,
      };
      await reviewService.createReview(payload);
      try {
        const stored = window.localStorage.getItem(reviewedKey);
        const parsed = stored ? JSON.parse(stored) : [];
        const next = new Set(Array.isArray(parsed) ? parsed.map((x) => Number(x)) : []);
        next.add(Number(payload.appointmentId));
        window.localStorage.setItem(reviewedKey, JSON.stringify(Array.from(next)));
      } catch {
        // ignore storage errors
      }
      if (!appointmentLocked) setAppointmentId('');
      setRating(5);
      setComment('');
      navigate('/patient/dashboard', { replace: true });
    } catch (e2) {
      const message = e2?.response?.data?.message || e2?.message || 'Failed to create review';
      // If backend says it's a duplicate, mark as reviewed locally to avoid repeated attempts.
      if (e2?.response?.status === 409) {
        try {
          const stored = window.localStorage.getItem(reviewedKey);
          const parsed = stored ? JSON.parse(stored) : [];
          const next = new Set(Array.isArray(parsed) ? parsed.map((x) => Number(x)) : []);
          next.add(Number(appointmentId));
          window.localStorage.setItem(reviewedKey, JSON.stringify(Array.from(next)));
        } catch {
          // ignore storage errors
        }
      }
      setError(message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">Reviews Test Page</h1>
        {user?.role === 'patient' && (
          <button
            type="button"
            onClick={() => navigate('/patient/dashboard')}
            className="shrink-0 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Back to Dashboard
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-md border border-sky-100/60 dark:border-slate-700">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">Create review (patient only)</h2>
          {!canSubmit ? (
            <div className="rounded-xl bg-sky-50 dark:bg-slate-700 p-4 text-slate-700 dark:text-slate-200">
              <p className="font-semibold">Not available</p>
              <p className="text-sm mt-1">
                Log in as a <span className="font-semibold">patient</span> to submit a review.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Appointment ID
                </label>
                <input
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  required
                  inputMode="numeric"
                  disabled={appointmentLocked}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="e.g. 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                  placeholder="Share your experience..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-white font-semibold shadow-md hover:opacity-95"
              >
                Submit review
              </button>
            </form>
          )}
        </section>

        <section className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-md border border-sky-100/60 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Approved reviews (public)</h2>
            <button
              onClick={loadApproved}
              className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
          ) : approvedReviews.length === 0 ? (
            <p className="mt-4 text-slate-600 dark:text-slate-300">No approved reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {approvedReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/40 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {r.patient_name || 'Patient'}
                    </p>
                    <p className="text-sm text-yellow-500 font-bold">{'★'.repeat(Number(r.rating || 0))}</p>
                  </div>
                  <p className="mt-2 text-slate-700 dark:text-slate-200">{r.comment}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {error && (
        <div className="mt-6">
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-200">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewsTestPage;

