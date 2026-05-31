const http = require('http');
const app = require('./app');
const { initDb } = require('./config/db');
const { startAppointmentReminderJob } = require('./jobs/appointmentReminderJob');

const PORT = process.env.PORT || 5000;

async function start() {
  // حاول تهيئة قاعدة البيانات والمigrations
  // لو فشلت، نطبع تحذير ونكمل تشغيل السيرفر عشان الـ API الأساسية (مثل /api/health) تظل شغالة
  try {
    await initDb();
    console.log('Database and migrations initialised successfully');
    startAppointmentReminderJob();
  } catch (err) {
    console.error('Failed to initialise database:', err.message);
    console.warn(
      '⚠️ Warning: Server is running WITHOUT a database connection. Any endpoint يحتاج DB ممكن يعطي أخطاء.'
    );
  }

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();


