/**
 * Manual integration check for duplicate slot blocking.
 * Run from server/: node scripts/test-appointment-slot-blocking.js
 *
 * Requires MySQL + seeded patients/doctors.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', 'app.env') });

const { initDb, getDb } = require('../config/db');
const { findBlockingAppointment } = require('../lib/appointmentSlotService');
const { normalizeAppointmentTime } = require('../lib/appointmentTime');

async function main() {
  await initDb();
  const pool = getDb();

  const [rows] = await pool.query(
    `SELECT doctor_id, DATE(appointment_date) AS d,
            TIME_FORMAT(appointment_time, '%H:%i') AS t, status, COUNT(*) AS c
     FROM Appointments
     WHERE LOWER(TRIM(status)) IN ('pending', 'confirmed', 'completed')
     GROUP BY doctor_id, d, t, status
     ORDER BY c DESC
     LIMIT 5`
  );

  console.log('Sample active appointments:', rows);

  if (rows.length === 0) {
    console.log('No appointments to test against. Book one via UI first.');
    process.exit(0);
  }

  const sample = rows[0];
  const { blocking, dateStr, timeStr, doctorIdNum } = await findBlockingAppointment(pool, {
    doctorId: sample.doctor_id,
    appointmentDate: sample.d,
    appointmentTime: sample.t,
  });

  console.log('Lookup for', { doctorIdNum, dateStr, timeStr });
  console.log('blockingFound:', Boolean(blocking), blocking ? { id: blocking.id, status: blocking.status } : null);

  const altTime = `${sample.t}:00`;
  const { blocking: b2 } = await findBlockingAppointment(pool, {
    doctorId: sample.doctor_id,
    appointmentDate: String(sample.d).slice(0, 10),
    appointmentTime: altTime,
  });
  console.log('Same slot with time', altTime, 'blockingFound:', Boolean(b2));

  console.log('normalize 09:00:00 =>', normalizeAppointmentTime('09:00:00'));
  process.exit(blocking && b2 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
