const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'app.env' });
const { initDb } = require('../config/db');
const { findUserByEmail, createUser } = require('../models/userModel');
const { createDoctor } = require('../models/doctorModel');

async function main() {
  try {
    await initDb();
    console.log('Database connected');

    // Get doctor details from command line or use defaults
    const name = process.argv[2] || 'Dr. Test Doctor';
    const email = process.argv[3] || 'doctor@test.com';
    const password = process.argv[4] || 'doctor123';
    const specialization = process.argv[5] || 'Dermatology';

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      console.log('❌ User already exists with email:', email);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      process.exit(1);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await createUser({
      name,
      email,
      passwordHash,
      role: 'doctor',
    });

    // Create doctor profile
    await createDoctor({
      userId: user.id,
      specialization,
    });

    console.log('✅ Doctor user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('🎭 Role: doctor');
    console.log('🏥 Specialization:', specialization);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();

