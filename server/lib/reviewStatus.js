/**
 * Review moderation statuses and allowed admin transitions (see UsersPage action matrix).
 */

const REVIEW_STATUSES = Object.freeze([
  'pending',
  'approved',
  'rejected',
  'hidden',
  'flagged',
]);

/** @type {Record<string, Set<string>>} */
const ALLOWED_TRANSITIONS = {
  pending: new Set(['approved', 'rejected', 'flagged']),
  approved: new Set(['hidden', 'flagged']),
  rejected: new Set(['approved']),
  hidden: new Set(['approved']),
  flagged: new Set(['approved', 'rejected']),
};

function isValidReviewStatus(status) {
  return typeof status === 'string' && REVIEW_STATUSES.includes(status);
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function canTransitionReviewStatus(from, to) {
  if (!isValidReviewStatus(to)) {
    return { ok: false, message: 'Invalid status value' };
  }
  if (from === to) {
    return { ok: false, message: 'Review is already in this status' };
  }
  if (!isValidReviewStatus(from)) {
    return { ok: false, message: 'Invalid current review status' };
  }
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed || !allowed.has(to)) {
    return {
      ok: false,
      message: `Cannot change status from "${from}" to "${to}"`,
    };
  }
  return { ok: true };
}

module.exports = {
  REVIEW_STATUSES,
  ALLOWED_TRANSITIONS,
  isValidReviewStatus,
  canTransitionReviewStatus,
};
