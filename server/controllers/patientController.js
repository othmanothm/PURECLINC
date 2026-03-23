const { getPatientByUserId, updatePatientProfile } = require('../models/patientModel');
const {
  getMedicalRecordByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
} = require('../models/medicalRecordModel');

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

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateMyMedicalRecord,
};

