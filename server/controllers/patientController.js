const { getPatientByUserId, updatePatientProfile } = require('../models/patientModel');
const {
  getMedicalRecordByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
} = require('../models/medicalRecordModel');
const { getPatientTreatments } = require('../models/treatmentModel');
const { getPatientOrders } = require('../models/orderModel');

function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

async function getMyProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const medicalRecord = await getMedicalRecordByPatientId(patient.id);

    return res.json({
      patient: {
        id: patient.id,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        address: patient.address,
        general_health: patient.general_health,
      },
      medicalRecord: medicalRecord || null,
    });
  } catch (err) {
    return next(err);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { phone, dateOfBirth, address, generalHealth } = req.body;

    await updatePatientProfile(userId, {
      phone,
      dateOfBirth,
      address,
      generalHealth,
    });

    const updated = await getPatientByUserId(userId);
    return res.json({ patient: updated });
  } catch (err) {
    return next(err);
  }
}

async function updateMyMedicalRecord(req, res, next) {
  try {
    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);

    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const {
      skinType,
      complaints,
      dermatologicalHistory,
      allergies,
      currentMedications,
      pregnancyStatus,
      notes,
    } = req.body;

    let medicalRecord = await getMedicalRecordByPatientId(patient.id);

    if (!medicalRecord) {
      medicalRecord = await createMedicalRecord({
        patientId: patient.id,
        skinType,
        complaints,
        dermatologicalHistory,
        allergies,
        currentMedications,
        pregnancyStatus,
        notes,
      });
    } else {
      medicalRecord = await updateMedicalRecord(patient.id, {
        skinType,
        complaints,
        dermatologicalHistory,
        allergies,
        currentMedications,
        pregnancyStatus,
        notes,
      });
    }

    return res.json({ medicalRecord });
  } catch (err) {
    return next(err);
  }
}

async function getMyBillingSummary(req, res, next) {
  try {
    const patient = await getPatientByUserId(req.user.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }
    const rows = await getPatientTreatments(patient.id);
    const sessions = rows.map((r) => {
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
        remaining_balance: remaining,
      };
    });

    const orderRows = await getPatientOrders(patient.id);
    const storeOrders = orderRows.map((o) => ({
      id: o.id,
      created_at: o.created_at,
      total_price: roundMoney(parseFloat(o.total_price || 0)),
      payment_status: o.payment_status,
      status: o.status,
    }));

    const totalTreatmentPaid = roundMoney(
      sessions.reduce((s, x) => s + x.amount_paid, 0)
    );
    const totalStorePaid = roundMoney(
      orderRows
        .filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0)
    );
    const totalSpent = roundMoney(totalTreatmentPaid + totalStorePaid);
    const totalRemaining = roundMoney(
      sessions.reduce((s, x) => s + x.remaining_balance, 0)
    );

    return res.json({
      sessions,
      storeOrders,
      summary: {
        totalTreatmentPaid,
        totalStorePaid,
        totalSpent,
        totalRemaining,
        totalSessions: sessions.length,
        totalStoreOrders: storeOrders.length,
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateMyMedicalRecord,
  getMyBillingSummary,
};

