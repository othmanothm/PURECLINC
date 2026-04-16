import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/appointmentService';
import { reviewService } from '../../services/reviewService';

function AppointmentsPage() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [treatmentCategory, setTreatmentCategory] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasLoadedRef = useRef(false);
  const slotsLoadingRef = useRef(false);
  const [reviewedAppointmentIds, setReviewedAppointmentIds] = useState(() => new Set());

  const reviewedKey = 'pureskin_reviewed_appointments';

  const reviewedSet = useMemo(() => reviewedAppointmentIds, [reviewedAppointmentIds]);

  const markReviewed = useCallback((appointmentId) => {
    setReviewedAppointmentIds((prev) => {
      const next = new Set(prev);
      next.add(Number(appointmentId));
      try {
        window.localStorage.setItem(reviewedKey, JSON.stringify(Array.from(next)));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const appointmentsData = await appointmentService.getMyAppointments();
      setAppointments(appointmentsData.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  }, []);

  useEffect(() => {
    // Only load once on mount
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        // Load locally-known reviewed appointments to avoid duplicate attempts
        try {
          const stored = window.localStorage.getItem(reviewedKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setReviewedAppointmentIds(new Set(parsed.map((x) => Number(x))));
            }
          }
        } catch {
          // ignore parse errors
        }

        // Best-effort: also load approved reviews (public). If API includes appointment_id in future,
        // we can mark reviewed from it without backend changes.
        try {
          const r = await reviewService.getApprovedReviews({ limit: 200, offset: 0 });
          const apiReviews = Array.isArray(r?.reviews) ? r.reviews : [];
          const apiAppointmentIds = apiReviews
            .map((rev) => rev.appointment_id)
            .filter((id) => id !== undefined && id !== null)
            .map((id) => Number(id));
          if (apiAppointmentIds.length) {
            setReviewedAppointmentIds((prev) => new Set([...Array.from(prev), ...apiAppointmentIds]));
          }
        } catch {
          // ignore API errors; fallback to local marker + backend enforcement
        }

        // Load doctors
        const doctorsData = await appointmentService.getDoctors();
        setDoctors(doctorsData.doctors || []);
        
        await loadAppointments();
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; loadAppointments is stable
  }, []);

  const loadSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;
    
    // Prevent multiple simultaneous calls
    if (slotsLoadingRef.current) return;
    slotsLoadingRef.current = true;

    try {
      const data = await appointmentService.getAvailableSlots(selectedDoctor, selectedDate);
      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      slotsLoadingRef.current = false;
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, selectedDate, loadSlots]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!treatmentCategory || !selectedDoctor || !selectedDate || !selectedTime) {
      setError(t('appointments.selectDoctorDateTime'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await appointmentService.bookAppointment({
        doctorId: parseInt(selectedDoctor),
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        treatmentCategory,
      });
      setTreatmentCategory('');
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTime('');
      setAvailableSlots([]);
      await loadAppointments();
      toast.success(t('appointments.bookedSuccessfully'));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('appointments.failedToBook');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('appointments.title')}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t('appointments.subtitle')}</p>
        </div>

        {/* Booking Form */}
        <div className="mb-8 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('appointments.newAppointment')}</h2>
          </div>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</div>
          )}

          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('appointments.selectTreatmentCategory')}
              </label>
              <select
                value={treatmentCategory}
                onChange={(e) => setTreatmentCategory(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                required
              >
                <option value="">{t('appointments.selectTreatmentCategory')}</option>
                <option value="hair">{t('appointments.treatment_hair')}</option>
                <option value="skin">{t('appointments.treatment_skin')}</option>
                <option value="body">{t('appointments.treatment_body')}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('appointments.selectDoctor')}</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                required
              >
                <option value="">{t('appointments.selectDoctor')}</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} {doc.specialization ? `- ${doc.specialization}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('appointments.date')}</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                required
              />
            </div>

            {availableSlots.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('appointments.time')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        selectedTime === slot
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedTime}
              className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-60"
            >
              {loading ? t('appointments.booking') : t('appointments.bookAppointment')}
            </button>
          </form>
        </div>

        {/* Appointments List */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.242 2.61.673m-5.8 0a2.25 2.25 0 00-2.25 2.25v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V14.25m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-.375M21 12v.75m0 0v.75m0-.75v-.75m0 0h-3.375m-3.375 0h3.375" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('appointments.myAppointments')}</h2>
          </div>
          {appointments.length === 0 ? (
            <div className="rounded-xl bg-sky-50 dark:bg-slate-700 p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">{t('appointments.noAppointments')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div key={apt.id} className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 transition-all hover:border-sky-300 dark:hover:border-sky-600 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{apt.doctor_name}</p>
                        {apt.specialization && (
                          <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                            {apt.specialization}
                          </span>
                        )}
                        {apt.treatment_category && (
                          <span className="rounded-full bg-[#E5E2D8] dark:bg-slate-600 px-2 py-0.5 text-xs font-semibold text-[#1A1A1A] dark:text-slate-100">
                            {t(`appointments.treatment_${apt.treatment_category}`)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>{formatDate(apt.appointment_date)}</span>
                        <span className="text-slate-400 dark:text-slate-500">•</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{apt.appointment_time}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          apt.status === 'confirmed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : apt.status === 'cancelled'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}
                      >
                        {apt.status === 'confirmed' ? t('orders.confirmed') :
                         apt.status === 'completed' ? t('appointments.completed') :
                         apt.status === 'cancelled' ? t('orders.cancelled') :
                         t('orders.pending')}
                      </span>

                      {apt.status === 'completed' && (
                        reviewedSet.has(Number(apt.id)) ? (
                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-not-allowed">
                            Reviewed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate(`/reviews-test?appointmentId=${apt.id}`)}
                            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                          >
                            Add Review
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentsPage;

