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

/**
 * Patch-style update: only keys present on `partial` override existing values.
 * @param {number} patientId
 * @param {Partial<{ skinType: any, complaints: any, dermatologicalHistory: any, allergies: any, currentMedications: any, pregnancyStatus: any, notes: any }>} partial
 */
async function mergeAndUpdateMedicalRecord(patientId, partial) {
  const existing = await getMedicalRecordByPatientId(patientId);
  const merged = {
    skinType:
      partial.skinType !== undefined ? partial.skinType || null : existing?.skin_type ?? null,
    complaints:
      partial.complaints !== undefined ? partial.complaints || null : existing?.complaints ?? null,
    dermatologicalHistory:
      partial.dermatologicalHistory !== undefined
        ? partial.dermatologicalHistory || null
        : existing?.dermatological_history ?? null,
    allergies:
      partial.allergies !== undefined ? partial.allergies || null : existing?.allergies ?? null,
    currentMedications:
      partial.currentMedications !== undefined
        ? partial.currentMedications || null
        : existing?.current_medications ?? null,
    pregnancyStatus:
      partial.pregnancyStatus !== undefined
        ? partial.pregnancyStatus || null
        : existing?.pregnancy_status ?? null,
    notes: partial.notes !== undefined ? partial.notes || null : existing?.notes ?? null,
  };

  if (!existing) {
    await createMedicalRecord({ patientId, ...merged });
  } else {
    await updateMedicalRecord(patientId, merged);
  }
  return getMedicalRecordByPatientId(patientId);
}

module.exports = {
  getMedicalRecordByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
  mergeAndUpdateMedicalRecord,
};

