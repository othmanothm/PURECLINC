import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { reviewService } from '../../services/reviewService';

function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [reviewsModalUser, setReviewsModalUser] = useState(null);
  const [reviewsModalLoading, setReviewsModalLoading] = useState(false);
  const [reviewsModalList, setReviewsModalList] = useState([]);
  const [reviewsStatusFilter, setReviewsStatusFilter] = useState('all');
  const [reviewActionBusyId, setReviewActionBusyId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!reviewsModalUser) return undefined;
    let cancelled = false;
    (async () => {
      setReviewsModalLoading(true);
      try {
        const data = await adminService.getPatientReviews(reviewsModalUser.id, {
          status: reviewsStatusFilter,
        });
        if (!cancelled) setReviewsModalList(data.reviews || []);
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || t('admin.failedToLoadReviews'));
          setReviewsModalList([]);
        }
      } finally {
        if (!cancelled) setReviewsModalLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reviewsModalUser, reviewsStatusFilter, t]);

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

  const openReviewsModal = (user) => {
    setReviewsStatusFilter('all');
    setReviewsModalUser(user);
  };

  const closeReviewsModal = () => {
    setReviewsModalUser(null);
    setReviewsModalList([]);
    setReviewsStatusFilter('all');
    setReviewsModalLoading(false);
  };

  const reloadModalReviews = async () => {
    if (!reviewsModalUser) return;
    const data = await adminService.getPatientReviews(reviewsModalUser.id, {
      status: reviewsStatusFilter,
    });
    setReviewsModalList(data.reviews || []);
  };

  const handleReviewStatus = async (reviewId, nextStatus) => {
    setReviewActionBusyId(reviewId);
    try {
      await reviewService.updateReviewStatus(reviewId, nextStatus);
      toast.success(t('admin.reviewStatusUpdated'));
      await reloadModalReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.failedToUpdateReviewStatus'));
    } finally {
      setReviewActionBusyId(null);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(t('admin.confirmDeleteReview'))) return;
    setReviewActionBusyId(reviewId);
    try {
      await adminService.deleteReview(reviewId);
      toast.success(t('admin.reviewDeleted'));
      await reloadModalReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.failedToDeleteReview'));
    } finally {
      setReviewActionBusyId(null);
    }
  };

  const reviewStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'hidden':
        return 'bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-200';
      case 'flagged':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const moderationBtnClass =
    'rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-sky-50 dark:hover:bg-slate-600 disabled:opacity-50';

  const renderModerationActions = (r) => {
    const busy = reviewActionBusyId === r.id;
    const s = r.status;
    const go = (next) => () => handleReviewStatus(r.id, next);
    const actions = [];

    if (s === 'pending') {
      actions.push(
        <button key="ap" type="button" disabled={busy} className={moderationBtnClass} onClick={go('approved')}>
          {t('admin.reviewApprove')}
        </button>,
        <button key="rj" type="button" disabled={busy} className={moderationBtnClass} onClick={go('rejected')}>
          {t('admin.reviewReject')}
        </button>,
        <button key="fg" type="button" disabled={busy} className={moderationBtnClass} onClick={go('flagged')}>
          {t('admin.reviewFlag')}
        </button>
      );
    } else if (s === 'approved') {
      actions.push(
        <button key="hi" type="button" disabled={busy} className={moderationBtnClass} onClick={go('hidden')}>
          {t('admin.reviewHide')}
        </button>,
        <button key="fg" type="button" disabled={busy} className={moderationBtnClass} onClick={go('flagged')}>
          {t('admin.reviewFlag')}
        </button>
      );
    } else if (s === 'rejected' || s === 'hidden') {
      actions.push(
        <button key="ap" type="button" disabled={busy} className={moderationBtnClass} onClick={go('approved')}>
          {t('admin.reviewApprove')}
        </button>
      );
    } else if (s === 'flagged') {
      actions.push(
        <button key="ap" type="button" disabled={busy} className={moderationBtnClass} onClick={go('approved')}>
          {t('admin.reviewApprove')}
        </button>,
        <button key="rj" type="button" disabled={busy} className={moderationBtnClass} onClick={go('rejected')}>
          {t('admin.reviewReject')}
        </button>
      );
    }

    actions.push(
      <button
        key="del"
        type="button"
        disabled={busy}
        onClick={() => handleDeleteReview(r.id)}
        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50"
      >
        {t('admin.deleteReview')}
      </button>
    );

    return <div className="flex flex-wrap gap-1.5">{actions}</div>;
  };

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
                        <div className="flex flex-wrap gap-2">
                          {user.role === 'patient' && (
                            <button
                              type="button"
                              onClick={() => openReviewsModal(user)}
                              className="rounded-lg border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-600"
                            >
                              {t('admin.viewReviews')}
                            </button>
                          )}
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

        {reviewsModalUser && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reviews-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeReviewsModal();
            }}
          >
            <div
              className="mt-8 w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-700 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h2 id="admin-reviews-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t('admin.patientReviewsTitle', { name: reviewsModalUser.name })}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{reviewsModalUser.email}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label htmlFor="admin-reviews-status-filter" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {t('admin.filterByStatus')}
                    </label>
                    <select
                      id="admin-reviews-status-filter"
                      value={reviewsStatusFilter}
                      onChange={(e) => setReviewsStatusFilter(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 px-2 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="all">{t('admin.reviewStatusAll')}</option>
                      <option value="pending">{t('admin.reviewStatusPending')}</option>
                      <option value="approved">{t('admin.reviewStatusApproved')}</option>
                      <option value="rejected">{t('admin.reviewStatusRejected')}</option>
                      <option value="hidden">{t('admin.reviewStatusHidden')}</option>
                      <option value="flagged">{t('admin.reviewStatusFlagged')}</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeReviewsModal}
                  className="self-end rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 sm:self-start"
                  aria-label={t('common.close')}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto p-6">
                {reviewsModalLoading ? (
                  <p className="text-center text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
                ) : reviewsModalList.length === 0 ? (
                  <p className="text-center text-slate-600 dark:text-slate-300">{t('admin.noReviewsForPatient')}</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-600">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">{t('admin.reviewId')}</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">{t('admin.appointmentId')}</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">{t('admin.rating')}</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">{t('admin.comment')}</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">{t('common.status')}</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">{t('admin.createdAt')}</th>
                          <th className="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewsModalList.map((r) => (
                          <tr
                            key={r.id}
                            className={`border-t border-slate-200 dark:border-slate-600 ${
                              r.status === 'flagged'
                                ? 'bg-purple-50/80 ring-1 ring-inset ring-purple-300/60 dark:bg-purple-950/25 dark:ring-purple-500/40'
                                : ''
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{r.id}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.appointment_id}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.rating}</td>
                            <td className="px-4 py-3 max-w-xs text-slate-700 dark:text-slate-300">
                              <span className="line-clamp-3" title={r.comment}>
                                {r.comment}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${reviewStatusBadgeClass(r.status)}`}
                              >
                                {t(`admin.reviewStatusLabel_${r.status}`, { defaultValue: r.status })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                              {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 align-top min-w-[200px]">{renderModerationActions(r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersPage;

