import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { doctorService } from '../../services/doctorService';

function PatientRecordPage() {
  const { t } = useTranslation();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightAppointmentId = searchParams.get('highlightAppointment');
  const highlightHandledRef = useRef(false);
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalSessionsPrice, setTotalSessionsPrice] = useState(0);
  const [medicalForm, setMedicalForm] = useState({
    skinType: '',
    complaints: '',
    dermatologicalHistory: '',
    allergies: '',
    currentMedications: '',
    pregnancyStatus: '',
    notes: '',
    generalHealth: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [treatmentForm, setTreatmentForm] = useState({ sessionPrice: '', amountPaid: '', notes: '' });
  const [completeAfterSave, setCompleteAfterSave] = useState(false);

  useEffect(() => {
    loadPatientRecord();
  }, [patientId]);

  useEffect(() => {
    highlightHandledRef.current = false;
  }, [patientId, highlightAppointmentId]);

  useEffect(() => {
    if (!highlightAppointmentId || highlightHandledRef.current) return;
    if (appointments.length === 0) return;
    const el = document.getElementById(`appointment-card-${highlightAppointmentId}`);
    highlightHandledRef.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('highlightAppointment');
        return next;
      },
      { replace: true }
    );
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-amber-400', 'rounded-lg');
      const timer = setTimeout(() => {
        el.classList.remove('ring-2', 'ring-amber-400', 'rounded-lg');
      }, 4500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [highlightAppointmentId, appointments, setSearchParams]);

  const loadPatientRecord = async () => {
    setLoading(true);
    try {
      const data = await doctorService.getPatientRecord(patientId);
      setPatient(data.patient);
      setAppointments(data.appointments || []);
      setTotalPaid(data.totalPaid || 0);
      setTotalSessionsPrice(data.totalSessionsPrice || 0);
      const mr = data.medicalRecord;
      const p = data.patient;
      setMedicalForm({
        skinType: mr?.skin_type || '',
        complaints: mr?.complaints || '',
        dermatologicalHistory: mr?.dermatological_history || '',
        allergies: mr?.allergies || '',
        currentMedications: mr?.current_medications || '',
        pregnancyStatus: mr?.pregnancy_status || '',
        notes: mr?.notes || '',
        generalHealth: p?.general_health || '',
      });
    } catch (err) {
      console.error('Failed to load patient record:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTreatment = (appointment) => {
    setEditingTreatment(appointment.id);
    setCompleteAfterSave(false);
    if (appointment.treatment) {
      setTreatmentForm({
        sessionPrice: appointment.treatment.session_price || '',
        amountPaid: appointment.treatment.amount_paid || '',
        notes: appointment.treatment.notes || '',
      });
    } else {
      setTreatmentForm({ sessionPrice: '', amountPaid: '', notes: '' });
    }
  };

  const handleSaveTreatment = async (apt) => {
    setSaving(true);
    try {
      const data = await doctorService.createOrUpdateTreatment(apt.id, {
        sessionPrice: parseFloat(treatmentForm.sessionPrice) || 0,
        amountPaid: parseFloat(treatmentForm.amountPaid) || 0,
        notes: treatmentForm.notes || '',
        completeAppointment: Boolean(completeAfterSave && apt.status === 'confirmed'),
      });
      setEditingTreatment(null);
      setTreatmentForm({ sessionPrice: '', amountPaid: '', notes: '' });
      setCompleteAfterSave(false);
      loadPatientRecord();
      toast.success(t('doctor.treatmentSessionSaved'));
      if (data.appointment) {
        toast.success(t('doctor.appointmentStatusUpdated'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('doctor.failedToSaveTreatment'));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // HH:MM format
  };

  const handleMedicalChange = (e) => {
    const { name, value } = e.target;
    setMedicalForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveClinicalRecord = async (e) => {
    e.preventDefault();
    setSavingRecord(true);
    try {
      const res = await doctorService.updatePatientMedicalRecord(patientId, medicalForm);
      if (res.patient) setPatient(res.patient);
      toast.success(t('doctor.clinicalRecordSaved'));
      loadPatientRecord();
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSavingRecord(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center dark:bg-slate-900 dark:text-slate-100">{t('common.loading')}</div>;
  }

  if (!patient) {
    return <div className="p-8 text-center dark:bg-slate-900 dark:text-slate-100">{t('doctor.patientNotFound')}</div>;
  }

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{patient.name}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t('doctor.patientMedicalRecord')}</p>
        </div>

        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('doctor.patientInformation')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-sky-50 dark:bg-slate-700 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.email')}</p>
              <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{patient.email}</p>
            </div>
            {patient.phone && (
              <div className="rounded-lg bg-sky-50 dark:bg-slate-700 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.phone')}</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{patient.phone}</p>
              </div>
            )}
            {patient.date_of_birth && (
              <div className="rounded-lg bg-sky-50 dark:bg-slate-700 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('doctor.dateOfBirth')}</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{patient.date_of_birth}</p>
              </div>
            )}
            {patient.address && (
              <div className="rounded-lg bg-sky-50 dark:bg-slate-700 p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('common.address')}</p>
                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{patient.address}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.242 2.61.673m-5.8 0a2.25 2.25 0 00-2.25 2.25v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V14.25m0 0h.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-.375M21 12v.75m0 0v.75m0-.75v-.75m0 0h-3.375m-3.375 0h3.375" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('doctor.editClinicalRecord')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctor.patientRecord')}</p>
            </div>
          </div>

          <form onSubmit={handleSaveClinicalRecord} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="skinType">
                {t('medicalProfile.skinType')}
              </label>
              <select
                id="skinType"
                name="skinType"
                value={medicalForm.skinType}
                onChange={handleMedicalChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              >
                <option value="">{t('medicalProfile.selectSkinType')}</option>
                <option value="normal">Normal</option>
                <option value="dry">Dry</option>
                <option value="oily">Oily</option>
                <option value="combination">Combination</option>
                <option value="sensitive">Sensitive</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="complaints">
                {t('medicalProfile.currentComplaints')}
              </label>
              <textarea
                id="complaints"
                name="complaints"
                rows={3}
                value={medicalForm.complaints}
                onChange={handleMedicalChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="dermatologicalHistory">
                {t('medicalProfile.dermatologicalHistory')}
              </label>
              <textarea
                id="dermatologicalHistory"
                name="dermatologicalHistory"
                rows={3}
                value={medicalForm.dermatologicalHistory}
                onChange={handleMedicalChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="allergies">
                  {t('medicalProfile.allergies')}
                </label>
                <input
                  id="allergies"
                  name="allergies"
                  type="text"
                  value={medicalForm.allergies}
                  onChange={handleMedicalChange}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="currentMedications">
                  {t('medicalProfile.currentMedications')}
                </label>
                <input
                  id="currentMedications"
                  name="currentMedications"
                  type="text"
                  value={medicalForm.currentMedications}
                  onChange={handleMedicalChange}
                  className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="pregnancyStatus">
                {t('medicalProfile.pregnancyStatus')}
              </label>
              <select
                id="pregnancyStatus"
                name="pregnancyStatus"
                value={medicalForm.pregnancyStatus}
                onChange={handleMedicalChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              >
                <option value="">{t('medicalProfile.selectSkinType')}</option>
                <option value="not_applicable">{t('medicalProfile.notApplicable')}</option>
                <option value="not_pregnant">{t('medicalProfile.notPregnant')}</option>
                <option value="pregnant">{t('medicalProfile.pregnant')}</option>
                <option value="breastfeeding">{t('medicalProfile.breastfeeding')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="generalHealth">
                {t('medicalProfile.generalHealth')}
              </label>
              <textarea
                id="generalHealth"
                name="generalHealth"
                rows={3}
                value={medicalForm.generalHealth}
                onChange={handleMedicalChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                placeholder={t('medicalProfile.generalHealth')}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="notes">
                {t('medicalProfile.additionalNotes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={medicalForm.notes}
                onChange={handleMedicalChange}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                placeholder={t('doctor.addNotesAboutPatient')}
              />
            </div>
            <button
              type="submit"
              disabled={savingRecord}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 md:w-auto"
            >
              {savingRecord ? t('doctor.saving') : t('doctor.saveClinicalRecord')}
            </button>
          </form>
        </div>

        {/* History Section */}
        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('doctor.patientHistory')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('doctor.completeHistory', { name: patient.name })}</p>
            </div>
          </div>

          {/* Total Paid */}
          <div className="mb-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5H3.75m0 0h-.75m15 0h-2.25m-2.5 0H6.75m-2.25 0v.75c0 .414-.336.75-.75.75h-.75M6 7.5v3m6-3v3m6-3v3m-9 7.5h10.5a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('doctor.totalPaid')}</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">${totalPaid.toFixed(2)}</p>
                  {totalSessionsPrice > 0 && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {t('doctor.totalSessions')}: ${totalSessionsPrice.toFixed(2)} | 
                      {t('doctor.remaining')}: ${(totalSessionsPrice - totalPaid).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Appointments History with Treatment Sessions */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              <svg className="h-5 w-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {t('doctor.treatmentSessionsWith', { name: patient.name })}
            </h3>
            {appointments.length === 0 ? (
              <p className="rounded-lg bg-sky-50 dark:bg-slate-700 p-4 text-center text-sm text-slate-500 dark:text-slate-400">{t('doctor.noAppointmentsYet')}</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => {
                  const treatment = apt.treatment;
                  const isFullyPaid = treatment && parseFloat(treatment.amount_paid) >= parseFloat(treatment.session_price);
                  const remaining = treatment ? parseFloat(treatment.session_price) - parseFloat(treatment.amount_paid) : 0;

                  return (
                    <div
                      key={apt.id}
                      id={`appointment-card-${apt.id}`}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-600 dark:bg-slate-800"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100">
                            <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              {formatDate(apt.appointment_date)} {t('dashboard.at')} {formatTime(apt.appointment_time)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('common.status')}: {apt.status}</p>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            apt.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : apt.status === 'confirmed'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : apt.status === 'cancelled'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      {editingTreatment === apt.id ? (
                        <div className="rounded-lg border border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/30 p-4">
                          <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">{t('doctor.treatmentSessionDetails')}</h4>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('doctor.sessionPrice')} ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={treatmentForm.sessionPrice}
                                onChange={(e) => setTreatmentForm({ ...treatmentForm, sessionPrice: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('doctor.amountPaid')} ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={treatmentForm.amountPaid}
                                onChange={(e) => setTreatmentForm({ ...treatmentForm, amountPaid: e.target.value })}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder="0.00"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">{t('doctor.sessionNotes')}</label>
                              <textarea
                                value={treatmentForm.notes}
                                onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                                rows={2}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                placeholder={t('doctor.addSessionNotes')}
                              />
                            </div>
                          </div>
                          {apt.status === 'confirmed' && (
                            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                checked={completeAfterSave}
                                onChange={(e) => setCompleteAfterSave(e.target.checked)}
                              />
                              <span>{t('doctor.markCompleteAfterTreatment')}</span>
                            </label>
                          )}
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => handleSaveTreatment(apt)}
                              disabled={saving}
                              className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:scale-105 disabled:opacity-60"
                            >
                              {saving ? t('doctor.saving') : t('common.save')}
                            </button>
                            <button
                              onClick={() => {
                                setEditingTreatment(null);
                                setTreatmentForm({ sessionPrice: '', amountPaid: '', notes: '' });
                              }}
                              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-600"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {treatment ? (
                            <div className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 p-4">
                              <div className="mb-3 grid gap-3 md:grid-cols-3">
                                <div className="rounded-lg bg-white dark:bg-slate-800 p-3">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('doctor.sessionPrice')}</p>
                                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">${parseFloat(treatment.session_price).toFixed(2)}</p>
                                </div>
                                <div className="rounded-lg bg-white dark:bg-slate-800 p-3">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('doctor.amountPaid')}</p>
                                  <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">${parseFloat(treatment.amount_paid).toFixed(2)}</p>
                                </div>
                                <div className="rounded-lg bg-white dark:bg-slate-800 p-3">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('doctor.remaining')}</p>
                                  <p className={`mt-1 text-lg font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    ${remaining.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              {treatment.notes && (
                                <div className="mt-3 rounded-lg bg-white dark:bg-slate-800 p-3">
                                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('doctor.sessionNotes')}</p>
                                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{treatment.notes}</p>
                                </div>
                              )}
                              <button
                                onClick={() => handleEditTreatment(apt)}
                                className="mt-3 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-sky-700"
                              >
                                {t('doctor.editTreatment')}
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-sky-50 dark:bg-slate-700 p-4">
                              <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{t('doctor.noTreatmentSession')}</p>
                              <button
                                onClick={() => handleEditTreatment(apt)}
                                className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:scale-105"
                              >
                                {t('doctor.addTreatmentSession')}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default PatientRecordPage;

