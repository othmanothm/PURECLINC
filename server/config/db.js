const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'app.env' });

let pool;

async function ensureDatabaseExists(config) {
  const { host, user, password, database } = config;

  const connection = await mysql.createConnection({
    host,
    user,
    password,
    multipleStatements: true,
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );

  await connection.end();
}

async function runMigrations(poolInstance) {
  // Create migrations table if not exists
  await poolInstance.query(`
    CREATE TABLE IF NOT EXISTS Migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const [rows] = await poolInstance.query('SELECT name FROM Migrations');
  const applied = new Set(rows.map((r) => r.name));

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

  for (const file of files) {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const migration = require(path.join(migrationsDir, file));
    const name = migration.name || file;

    if (applied.has(name)) {
      continue;
    }

    console.log(`Running migration: ${name}`);
    // Each migration gets the pool instance and should perform its own queries.
    // If it throws, the startup will fail so we notice the problem.
    // eslint-disable-next-line no-await-in-loop
    await migration.up(poolInstance);
    // eslint-disable-next-line no-await-in-loop
    await poolInstance.query('INSERT INTO Migrations (name) VALUES (?)', [
      name,
    ]);
    console.log(`Migration completed: ${name}`);
  }
}

async function initDb() {
  if (pool) return pool;

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pureskin_clinic',
  };

  // Ensure DB exists (if not, create it)
  await ensureDatabaseExists(config);

  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
  });

  // Simple connectivity check
  await pool.query('SELECT 1');
  console.log('MySQL pool created and connection verified');

  // Run migrations to ensure tables exist / are up to date
  await runMigrations(pool);

  return pool;
}

function getDb() {
  if (!pool) {
    throw new Error('Database pool not initialised. Call initDb() first.');
  }
  return pool;
}

module.exports = {
  initDb,
  getDb,
};



