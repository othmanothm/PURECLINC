const { findUserById } = require('../models/userModel');
const { getPatientByUserId } = require('../models/patientModel');
const { getPatientTreatments } = require('../models/treatmentModel');
const { getPatientOrders } = require('../models/orderModel');

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * GET /api/admin/patients/:userId/financial-history
 * userId = Users.id where role is patient
 */
async function getPatientFinancialHistory(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await findUserById(userId);
    if (!user || user.role !== 'patient') {
      return res.status(404).json({ message: 'Patient user not found' });
    }
    const patient = await getPatientByUserId(userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const treatmentRows = await getPatientTreatments(patient.id);
    const treatmentSessions = treatmentRows.map((r) => {
      const price = parseFloat(r.session_price || 0);
      const paid = parseFloat(r.amount_paid || 0);
      const remaining = Math.max(0, roundMoney(price - paid));
      return {
        id: r.id,
        appointment_date: r.appointment_date,
        appointment_time: r.appointment_time,
        doctor_name: r.doctor_name || '—',
        session_price: roundMoney(price),
        amount_paid: roundMoney(paid),
        remaining,
      };
    });

    const totalTreatmentPaid = roundMoney(
      treatmentSessions.reduce((s, x) => s + x.amount_paid, 0)
    );
    const totalTreatmentRemaining = roundMoney(
      treatmentSessions.reduce((s, x) => s + x.remaining, 0)
    );

    const orders = await getPatientOrders(patient.id);
    const storeOrders = orders.map((o) => ({
      id: o.id,
      created_at: o.created_at,
      total_price: roundMoney(parseFloat(o.total_price || 0)),
      payment_status: o.payment_status,
      status: o.status,
    }));

    const totalStoreSales = roundMoney(
      orders
        .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
        .reduce((s, o) => s + parseFloat(o.total_price || 0), 0)
    );

    const totalRevenue = roundMoney(totalTreatmentPaid + totalStoreSales);

    return res.json({
      patient: {
        id: patient.id,
        userId: user.id,
        name: user.name,
        email: user.email,
      },
      treatmentSessions,
      treatmentSummary: {
        totalTreatmentPaid,
        totalTreatmentRemaining,
        sessionCount: treatmentSessions.length,
      },
      storeOrders,
      storeSummary: {
        totalStoreSales,
      },
      overall: {
        totalTreatmentPayments: totalTreatmentPaid,
        totalStoreSales,
        totalRevenue,
        // Sum of per-session max(0, session_price - amount_paid); store orders excluded
        remainingTreatmentBalance: totalTreatmentRemaining,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getPatientFinancialHistory,
};
