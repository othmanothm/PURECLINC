/**
 * Operational workflow (not money — use payment_status for payment state).
 */
const ORDER_STATUS = {
  AWAITING_PAYMENT: 'awaiting_payment',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_METHOD = {
  CASH_ON_DELIVERY: 'cash_on_delivery',
  CARD: 'card',
  APPLE_PAY: 'apple_pay',
};

const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);
const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS);

/** Admin may set operational status to these values (validated in controller). */
const ADMIN_ALLOWED_ORDER_STATUS = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.CANCELLED,
];

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ADMIN_ALLOWED_ORDER_STATUS,
};
