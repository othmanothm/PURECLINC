import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';

function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = async () => {
    try {
      const oldRole = users.find(u => u.id === editingId)?.role;
      await adminService.updateUser(editingId, editForm);
      setEditingId(null);
      loadUsers();
      
      // If role changed to/from doctor, trigger event to refresh doctors page
      if (oldRole !== editForm.role && (oldRole === 'doctor' || editForm.role === 'doctor')) {
        window.dispatchEvent(new CustomEvent('doctorsListUpdated'));
      }
      
      toast.success(t('admin.userUpdated'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.failedToUpdateUser'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDeleteUser'))) return;
    try {
      await adminService.deleteUser(id);
      loadUsers();
      toast.success(t('admin.userDeleted'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const navigate = useNavigate();

  return (
    <div className="px-4 py-8 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">{t('admin.usersManagement')}</h1>
          <p className="text-slate-600 dark:text-slate-300">{t('admin.manageAllUsers')}</p>
        </div>

        {loading ? (
          <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-slate-800 shadow-lg">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300">{t('common.name')}</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300">{t('common.email')}</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300">{t('common.role')}</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-200 dark:border-slate-700 transition-colors hover:bg-sky-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{user.id}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === user.id ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      ) : (
                        <span className="text-slate-600 dark:text-slate-300">{user.email}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          <option value="patient">{t('common.patients')}</option>
                          <option value="doctor">{t('common.doctors')}</option>
                          <option value="admin">{t('common.admin')}</option>
                        </select>
                      ) : (
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                          user.role === 'doctor' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                          'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
                        }`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === user.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:scale-105"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-600"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-sky-700"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-red-700"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersPage;

