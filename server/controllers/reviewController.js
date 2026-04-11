const { getAppointmentById } = require('../models/appointmentModel');
const { getPatientByUserId } = require('../models/patientModel');
const { assertPatientCanReviewAppointment } = require('../lib/appointmentReviewEligibility');
const {
  createReview,
  getApprovedReviews,
  getReviewByAppointmentId,
  getReviewById,
  updateReviewStatus,
} = require('../models/reviewModel');
const { canTransitionReviewStatus } = require('../lib/reviewStatus');

async function createReviewController(req, res, next) {
  try {
    const userId = req.user.id;
    const patient = await getPatientByUserId(userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient profile not found' });
    }

    const { appointmentId, rating, comment } = req.body;

    const appointment = await getAppointmentById(appointmentId);
    const eligibility = assertPatientCanReviewAppointment(appointment, patient.id);
    if (!eligibility.ok) {
      return res.status(eligibility.status).json({ message: eligibility.message });
    }

    const existing = await getReviewByAppointmentId(appointmentId);
    if (existing) {
      return res.status(409).json({ message: 'A review for this appointment already exists' });
    }

    try {
      const review = await createReview({
        patientId: patient.id,
        appointmentId,
        rating,
        comment,
      });
      return res.status(201).json({ review });
    } catch (err) {
      // MySQL duplicate key error (unique appointment_id)
      if (err && (err.code === 'ER_DUP_ENTRY' || err.errno === 1062)) {
        return res.status(409).json({ message: 'A review for this appointment already exists' });
      }
      throw err;
    }
  } catch (err) {
    return next(err);
  }
}

async function listApprovedReviewsController(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
    const reviews = await getApprovedReviews({ limit, offset });
    return res.json({ reviews });
  } catch (err) {
    return next(err);
  }
}

async function updateReviewStatusController(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const existing = await getReviewById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const transition = canTransitionReviewStatus(existing.status, status);
    if (!transition.ok) {
      return res.status(400).json({ message: transition.message });
    }

    const updated = await updateReviewStatus(id, status);
    return res.json({ review: updated });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createReviewController,
  listApprovedReviewsController,
  updateReviewStatusController,
};

