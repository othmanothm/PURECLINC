require('dotenv').config({ path: 'app.env' });
const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('../config/db');

async function createUser() {
  try {
    await initDb();
    const db = getDb();

    // User details
    const name = 'Test Patient';
    const email = 'patient@test.com';
    const password = 'password123';
    const role = 'patient';

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if user exists
    const [existing] = await db.query('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('❌ User already exists with email:', email);
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      process.exit(0);
    }

    // Create user
    const [result] = await db.query(
      'INSERT INTO Users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, 1)',
      [name, email, passwordHash, role]
    );

    const userId = result.insertId;

    // Create patient profile
    await db.query(
      'INSERT INTO Patients (user_id, phone, date_of_birth, address, general_health) VALUES (?, NULL, NULL, NULL, NULL)',
      [userId]
    );

    console.log('✅ User created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('🎭 Role:', role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createUser();

