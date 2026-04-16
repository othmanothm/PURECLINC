import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { doctorService } from '../../services/doctorService';

function DoctorAppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getMyAppointments();
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const { appointmentService } = await import('../../services/appointmentService');
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      loadAppointments();
      toast.success(t('doctor.appointmentStatusUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update appointment status');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('doctor.myAppointments')}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t('doctor.manageAppointments')}</p>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        ) : appointments.length === 0 ? (
          <div className="rounded-lg bg-white dark:bg-slate-800 p-8 text-center shadow-sm">
            <p className="text-slate-500 dark:text-slate-400">{t('doctor.noAppointmentsScheduled')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div key={apt.id} className="group rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500">
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{apt.patient_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>{formatDate(apt.appointment_date)}</span>
                        <span className="text-slate-400">•</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{apt.appointment_time}</span>
                        {apt.treatment_category && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700 dark:bg-slate-600 dark:text-slate-200">
                              {t(`appointments.treatment_${apt.treatment_category}`)}
                            </span>
                          </>
                        )}
                      </div>
                      {apt.patient_phone && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          <span>{apt.patient_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        apt.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : apt.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : apt.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {apt.status}
                    </span>
                    {apt.status === 'pending' && (
                      <select
                        defaultValue="pending"
                        onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                        className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition-all focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="pending">{t('orders.pending')}</option>
                        <option value="confirmed">{t('doctor.confirm')}</option>
                        <option value="cancelled">{t('doctor.cancel')}</option>
                      </select>
                    )}
                    {apt.status === 'confirmed' &&
                      (apt.hasTreatmentEvidenceForCompletion ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'completed')}
                          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
                        >
                          {t('doctor.markCompleted')}
                        </button>
                      ) : (
                        <div className="flex max-w-md flex-col items-end gap-2 sm:flex-row sm:items-center">
                          <p className="text-right text-xs text-amber-800 dark:text-amber-200">
                            {t('doctor.completeRequiresTreatment')}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/doctor/patients/${apt.patient_id}?highlightAppointment=${apt.id}`)
                            }
                            className="shrink-0 rounded-lg border border-amber-500/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-400 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
                          >
                            {t('doctor.recordTreatmentFirst')}
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorAppointmentsPage;

