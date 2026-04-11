const { ORDER_STATUS, PAYMENT_STATUS } = require('../constants/orderConstants');

/**
 * Whether this order had inventory removed from Products (for cancel restore).
 * - awaiting_payment: not yet decremented (Stripe pre-webhook)
 * - COD pending/confirmed: decremented at order creation
 * - Stripe after webhook: pending + paid, decremented in webhook
 */
function inventoryWasDeductedForOrder(order) {
  if (!order) return false;
  if (order.status === ORDER_STATUS.AWAITING_PAYMENT) return false;
  if (order.payment_status === PAYMENT_STATUS.REFUNDED) return false;
  if (order.payment_method === 'cash_on_delivery') return true;
  if (order.payment_status === PAYMENT_STATUS.PAID) return true;
  return false;
}

module.exports = {
  inventoryWasDeductedForOrder,
};
