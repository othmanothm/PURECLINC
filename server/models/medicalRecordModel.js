const { getDb } = require('../config/db');

async function getMedicalRecordByPatientId(patientId) {
  const db = getDb();
  const [rows] = await db.query(
    'SELECT * FROM MedicalRecords WHERE patient_id = ?',
    [patientId]
  );
  return rows[0] || null;
}

async function createMedicalRecord(data) {
  const db = getDb();
  const {
    patientId,
    skinType,
    complaints,
    dermatologicalHistory,
    allergies,
    currentMedications,
    pregnancyStatus,
    notes,
  } = data;

  const [result] = await db.query(
    `INSERT INTO MedicalRecords 
    (patient_id, skin_type, complaints, dermatological_history, allergies, current_medications, pregnancy_status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      patientId,
      skinType || null,
      complaints || null,
      dermatologicalHistory || null,
      allergies || null,
      currentMedications || null,
      pregnancyStatus || null,
      notes || null,
    ]
  );

  return { id: result.insertId, patient_id: patientId };
}

async function updateMedicalRecord(patientId, data) {
  const db = getDb();
  const {
    skinType,
    complaints,
    dermatologicalHistory,
    allergies,
    currentMedications,
    pregnancyStatus,
    notes,
  } = data;

  await db.query(
    `UPDATE MedicalRecords SET
    skin_type = ?,
    complaints = ?,
    dermatological_history = ?,
    allergies = ?,
    current_medications = ?,
    pregnancy_status = ?,
    notes = ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE patient_id = ?`,
    [
      skinType || null,
      complaints || null,
      dermatologicalHistory || null,
      allergies || null,
      currentMedications || null,
      pregnancyStatus || null,
      notes || null,
      patientId,
    ]
  );

  return getMedicalRecordByPatientId(patientId);
}

module.exports = {
  getMedicalRecordByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
};

