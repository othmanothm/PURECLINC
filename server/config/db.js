const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'app.env') });

let pool;

/** @param {string} url e.g. mysql+pymysql://user:pass@host:3306/dbname */
function configFromDatabaseUrl(url) {
  const normalized = url.replace(/^mysql(\+[a-z0-9]+)?:\/\//i, 'mysql://');
  const parsed = new URL(normalized);
  const database = parsed.pathname.replace(/^\//, '').split('?')[0];
  return {
    host: parsed.hostname || 'localhost',
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username || 'root'),
    password: decodeURIComponent(parsed.password || ''),
    database: database || 'pureskin_clinic',
  };
}

async function ensureDatabaseExists(config) {
  const { host, port, user, password, database } = config;

  const connection = await mysql.createConnection({
    host,
    port,
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

  const fromUrl = process.env.DATABASE_URL
    ? configFromDatabaseUrl(process.env.DATABASE_URL)
    : null;

  const config = {
    host: (fromUrl?.host ?? process.env.DB_HOST) || 'localhost',
    port: fromUrl?.port ?? (process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306),
    user: (fromUrl?.user ?? process.env.DB_USER) || 'root',
    password: fromUrl ? fromUrl.password : process.env.DB_PASSWORD || '',
    database: (fromUrl?.database ?? process.env.DB_NAME) || 'pureskin_clinic',
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



