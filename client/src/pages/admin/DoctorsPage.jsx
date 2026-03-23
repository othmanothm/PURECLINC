import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

function DoctorsPage() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', specialization: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadDoctors();
    
    // Listen for doctors list updates (when role changes in Users page)
    const handleDoctorsUpdate = () => {
      loadDoctors();
    };
    
    window.addEventListener('doctorsListUpdated', handleDoctorsUpdate);
    
    return () => {
      window.removeEventListener('doctorsListUpdated', handleDoctorsUpdate);
    };
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDoctors();
      setDoctors(data.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createDoctor(form);
      setShowCreateForm(false);
      setForm({ name: '', email: '', specialization: '', password: '' });
      setShowPassword(false);
      loadDoctors();
      toast.success(t('admin.doctorCreated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.failedToCreateDoctor'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteDoctor'))) return;
    try {
      await adminService.deleteDoctor(id);
      loadDoctors();
      toast.success(t('admin.doctorDeleted'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete doctor');
    }
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('admin.doctorsManagement')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('admin.manageDoctors')}</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            {showCreateForm ? t('common.cancel') : `+ ${t('admin.addDoctor')}`}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreate} className="mb-8 rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-100">{t('admin.createDoctor')}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder={t('common.name')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                required
              />
              <input
                type="email"
                placeholder={t('common.email')}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
                required
              />
              <input
                type="text"
                placeholder={t('doctor.specialization')}
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.password')}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 pr-10 text-sm"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.774 3.162 10.066 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="mt-6 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              {t('admin.createDoctor')}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <div key={doctor.id} className="group rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{doctor.name}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{doctor.email}</p>
                {doctor.specialization && (
                  <span className="mt-2 inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {doctor.specialization}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(doctor.id)}
                  className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-red-700"
                >
                  {t('common.delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DoctorsPage;

