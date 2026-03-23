require('dotenv').config({ path: 'app.env' });
const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('../config/db');

async function createAdmin() {
  try {
    await initDb();
    const db = getDb();

    // Admin details
    const name = 'Admin User';
    const email = 'admin@test.com';
    const password = 'admin123';
    const role = 'admin';

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

    // Create admin user
    const [result] = await db.query(
      'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('🎭 Role:', role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();

