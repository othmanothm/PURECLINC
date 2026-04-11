const { appointmentHasTreatmentEvidenceForCompletion } = require('../models/treatmentModel');

/**
 * Gate for confirmed → completed: requires documented treatment activity on the appointment.
 */
async function assertDoctorMaySetAppointmentCompleted(appointmentId) {
  const hasEvidence = await appointmentHasTreatmentEvidenceForCompletion(appointmentId);
  if (!hasEvidence) {
    return {
      ok: false,
      status: 400,
      message:
        'Add a treatment session for this appointment before completing it (session price, amount paid, or clinical notes of at least 3 characters).',
    };
  }
  return { ok: true };
}

module.exports = { assertDoctorMaySetAppointmentCompleted };
