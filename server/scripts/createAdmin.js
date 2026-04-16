const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'app.env') });
const bcrypt = require('bcryptjs');
const { getDb, initDb } = require('../config/db');

async function createAdmin() {
  try {
    await initDb();
    const db = getDb();

    const name = 'Admin';
    const email = 'aaww@pureskin.local';
    const password = 'aaww';
    const role = 'admin';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [existing] = await db.query('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing.length > 0) {
      await db.query(
        'UPDATE Users SET name = ?, password = ?, role = ?, email_verified = 1 WHERE email = ?',
        [name, passwordHash, role, email]
      );
      console.log('Updated existing admin (same email).');
    } else {
      await db.query(
        'INSERT INTO Users (name, email, password, role, email_verified) VALUES (?, ?, ?, ?, 1)',
        [name, email, passwordHash, role]
      );
      console.log('Admin user created successfully.');
    }

    console.log('------------------------------------------');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Name:', name);
    console.log('Role:', role);
    console.log('------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
