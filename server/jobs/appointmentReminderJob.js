const cron = require('node-cron');
const {
  listAppointmentIdsNeedingReminder,
  markAppointmentReminderSent,
  getAppointmentById,
} = require('../models/appointmentModel');
const { notifyAppointmentReminder } = require('../services/emailNotifications');

function startAppointmentReminderJob() {
  if (process.env.APPOINTMENT_REMINDER_ENABLED === 'false') {
    console.log('[reminder] appointment reminder emails disabled (APPOINTMENT_REMINDER_ENABLED=false)');
    return;
  }

  const cronExpr = process.env.APPOINTMENT_REMINDER_CRON || '*/15 * * * *';
  const hours = Number(process.env.APPOINTMENT_REMINDER_HOURS_BEFORE || 24);

  cron.schedule(cronExpr, async () => {
    try {
      const ids = await listAppointmentIdsNeedingReminder();
      for (const id of ids) {
        const apt = await getAppointmentById(id);
        if (!apt || !apt.patient_email) continue;

        const ok = await notifyAppointmentReminder({
          to: apt.patient_email,
          patientName: apt.patient_name || 'Patient',
          doctorName: apt.doctor_name || 'Doctor',
          specialization: apt.specialization,
          date: apt.appointment_date,
          time: apt.appointment_time,
          hoursBefore: hours,
        });

        if (ok) {
          await markAppointmentReminderSent(id);
        }
      }
    } catch (err) {
      console.error('[reminder]', err.message || err);
    }
  });

  console.log(
    `[reminder] scheduled (${cronExpr}); ~${hours}h before appointment (window ±${process.env.APPOINTMENT_REMINDER_WINDOW_MINUTES || '30'} min)`
  );
}

module.exports = { startAppointmentReminderJob };
