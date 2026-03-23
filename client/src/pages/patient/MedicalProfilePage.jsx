import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';
import { patientService } from '../../services/patientService';

function MedicalProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    skinType: '',
    complaints: '',
    dermatologicalHistory: '',
    allergies: '',
    currentMedications: '',
    pregnancyStatus: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMedicalRecord();
  }, []);

  const loadMedicalRecord = async () => {
    setLoadingData(true);
    try {
      const data = await patientService.getMyProfile();
      if (data.medicalRecord) {
        setForm({
          skinType: data.medicalRecord.skin_type || '',
          complaints: data.medicalRecord.complaints || '',
          dermatologicalHistory: data.medicalRecord.dermatological_history || '',
          allergies: data.medicalRecord.allergies || '',
          currentMedications: data.medicalRecord.current_medications || '',
          pregnancyStatus: data.medicalRecord.pregnancy_status || '',
          notes: data.medicalRecord.notes || '',
        });
      }
    } catch (err) {
      console.error('Failed to load medical record:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await patientService.updateMedicalRecord(form);
      setSuccess(t('medicalProfile.savedSuccessfully'));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-sky-50 dark:bg-slate-900 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('common.medicalProfile')}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t('medicalProfile.subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="skinType">
              {t('medicalProfile.skinType')}
            </label>
            <select
              id="skinType"
              name="skinType"
              value={form.skinType}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              value={form.complaints}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder={t('medicalProfile.currentComplaints')}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="dermatologicalHistory"
            >
              {t('medicalProfile.dermatologicalHistory')}
            </label>
            <textarea
              id="dermatologicalHistory"
              name="dermatologicalHistory"
              rows={3}
              value={form.dermatologicalHistory}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder={t('medicalProfile.dermatologicalHistory')}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="allergies">
              {t('medicalProfile.allergies')}
            </label>
            <input
              id="allergies"
              name="allergies"
              type="text"
              value={form.allergies}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder={t('medicalProfile.allergies')}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="currentMedications"
            >
              {t('medicalProfile.currentMedications')}
            </label>
            <input
              id="currentMedications"
              name="currentMedications"
              type="text"
              value={form.currentMedications}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder={t('medicalProfile.currentMedications')}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
              htmlFor="pregnancyStatus"
            >
              {t('medicalProfile.pregnancyStatus')}
            </label>
            <select
              id="pregnancyStatus"
              name="pregnancyStatus"
              value={form.pregnancyStatus}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">{t('medicalProfile.selectSkinType')}</option>
              <option value="not_applicable">{t('medicalProfile.notApplicable')}</option>
              <option value="not_pregnant">{t('medicalProfile.notPregnant')}</option>
              <option value="pregnant">{t('medicalProfile.pregnant')}</option>
              <option value="breastfeeding">{t('medicalProfile.breastfeeding')}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="notes">
              {t('medicalProfile.additionalNotes')}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={handleChange}
              className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder={t('medicalProfile.additionalNotes')}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-60"
            >
              {loading ? t('medicalProfile.saving') : t('medicalProfile.saveProfile')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/patient/dashboard')}
              className="rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-600 hover:border-slate-400"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicalProfilePage;

