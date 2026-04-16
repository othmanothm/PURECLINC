import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { reviewService } from '../../services/reviewService';

const accentBtn =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6B705C] text-white shadow-sm transition-colors hover:bg-[#565a49] disabled:opacity-50 dark:bg-[#6b725c] dark:hover:bg-[#5a604f]';

function UsersPage() {
  const { t, i18n } = useTranslation();
  const rtl = i18n.language === 'ar';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [reviewsModalUser, setReviewsModalUser] = useState(null);
  const [reviewsModalLoading, setReviewsModalLoading] = useState(false);
  const [reviewsModalList, setReviewsModalList] = useState([]);
  const [reviewsStatusFilter, setReviewsStatusFilter] = useState('all');
  const [reviewActionBusyId, setReviewActionBusyId] = useState(null);
  const [nameSearchInput, setNameSearchInput] = useState('');
  const [nameSearchApplied, setNameSearchApplied] = useState('');
  const nameSearchDebounceIsFirst = useRef(true);

  useEffect(() => {
    const waitMs = nameSearchDebounceIsFirst.current ? 0 : 300;
    nameSearchDebounceIsFirst.current = false;
    const id = setTimeout(() => setNameSearchApplied(nameSearchInput.trim()), waitMs);
    return () => clearTimeout(id);
  }, [nameSearchInput]);

  const loadUsers = useCallback(async (searchOverride) => {
    const search = searchOverride !== undefined ? searchOverride : nameSearchApplied;
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        search: search || undefined,
      });
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [nameSearchApplied]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const initial = (name) => (name && name.trim() ? name.trim()[0].toUpperCase() : '?');

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="bg-transparent px-4 py-8 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-6xl font-tajawal">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-[#1A1A1A] dark:text-slate-100 md:text-4xl">{t('admin.usersManagement')}</h1>
          <p className="text-[#667085] dark:text-slate-300">{t('admin.manageAllUsers')}</p>
          <div className="relative mt-6 max-w-lg">
            <label htmlFor="admin-users-name-search" className="sr-only">
              {t('admin.searchUsersByName')}
            </label>
            <span className={`pointer-events-none absolute inset-y-0 flex items-center ${rtl ? 'right-3.5' : 'left-3.5'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-5 w-5 text-[#6B705C]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              id="admin-users-name-search"
              type="search"
              value={nameSearchInput}
              onChange={(e) => setNameSearchInput(e.target.value)}
              placeholder={t('admin.searchUsersByName')}
              autoComplete="off"
              className={`w-full rounded-2xl border border-[#E5E2D8] bg-white py-3.5 text-[#1A1A1A] shadow-sm placeholder:text-[#667085]/80 focus:border-[#6B705C] focus:outline-none focus:ring-2 focus:ring-[#6B705C]/25 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${rtl ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center text-[#667085] dark:text-slate-400">{t('common.loading')}</p>
        ) : users.length === 0 ? (
          <p className="rounded-2xl border border-[#E5E2D8] bg-white py-16 text-center text-[#667085] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {t('admin.noUsersFound')}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {users.map((user) => (
              <article
                key={user.id}
                className="flex flex-col overflow-hidden rounded-[32px] border border-stone-200/90 bg-[#F7F6F2] shadow-lg shadow-stone-300/25 dark:border-slate-600 dark:bg-slate-800 dark:shadow-none"
              >
                {editingId === user.id ? (
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-xl border border-[#E5E2D8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#6B705C] focus:outline-none focus:ring-1 focus:ring-[#6B705C] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full rounded-xl border border-[#E5E2D8] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#6B705C] focus:outline-none focus:ring-1 focus:ring-[#6B705C] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full rounded-xl border border-[#E5E2D8] bg-white px-3 py-2 text-sm focus:border-[#6B705C] focus:outline-none focus:ring-1 focus:ring-[#6B705C] dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="patient">{t('common.patients')}</option>
                      <option value="doctor">{t('common.doctors')}</option>
                      <option value="admin">{t('common.admin')}</option>
                    </select>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 rounded-xl bg-[#6B705C] py-2.5 text-sm font-bold text-white hover:bg-[#565a49]"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex-1 rounded-xl border border-[#E5E2D8] bg-white py-2.5 text-sm font-semibold text-[#1A1A1A] hover:bg-stone-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className={`flex items-center justify-between border-b border-stone-200/90 px-4 py-3 dark:border-slate-600 ${rtl ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6B705C]/25 to-[#6B705C]/40 text-xs font-bold text-[#2f362e] dark:from-slate-600 dark:to-slate-700 dark:text-slate-200">
                        {initial(user.name)}
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1A1A1A] shadow-sm dark:bg-slate-700 dark:text-slate-100">
                        ID · {user.id}
                      </span>
                    </div>
                    <div className={`flex flex-1 flex-col px-5 pb-5 pt-4 ${rtl ? 'text-right' : 'text-left'}`}>
                      <h2 className="text-lg font-bold text-[#1A1A1A] dark:text-slate-100">{user.name}</h2>
                      <p className="mt-1 truncate text-sm text-[#667085] dark:text-slate-400" title={user.email}>
                        {user.email}
                      </p>
                      <span
                        className={`mt-3 inline-flex w-fit rounded-full px-3 py-0.5 text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                            : user.role === 'doctor'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                              : 'bg-white/90 text-[#4a563e] shadow-sm dark:bg-slate-700 dark:text-sky-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 border-t border-stone-200/90 px-5 py-4 dark:border-slate-600 ${rtl ? 'flex-row-reverse justify-end' : 'justify-end'}`}>
                      {user.role === 'patient' && (
                        <button
                          type="button"
                          title={t('admin.viewReviews')}
                          onClick={() => openReviewsModal(user)}
                          className={accentBtn}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        type="button"
                        title={t('common.edit')}
                        onClick={() => handleEdit(user)}
                        className={accentBtn}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title={t('common.delete')}
                        onClick={() => handleDelete(user.id)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/50 dark:bg-slate-800 dark:hover:bg-red-950/40"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
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

