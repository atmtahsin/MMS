// Database access (Turso / libSQL), the schema, the audit log and SQL backups.
//
// The app talks to a libSQL database through @libsql/client:
//   - TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN)  -> a hosted Turso database (use this on Vercel)
//   - nothing set                              -> a local file, DATA_DIR/madrassa.db (local development, Docker)
//
// Every query is asynchronous. Use queryOne / queryAll / execute for single statements and
// runInTransaction to make several changes succeed or fail together.
import { createClient } from '@libsql/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from './passwords.mjs';

/* -------------------------------------------------------------------------- */
/*  Schema (tables for a brand-new database)                                  */
/* -------------------------------------------------------------------------- */

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'registrar', 'accounts', 'student')),
  family_id     TEXT NOT NULL DEFAULT ''  -- only for role 'student': which family this account may see
);

-- Only a hash of the session token is stored, so a leaked database cannot be used to sign in.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
  id                    INTEGER PRIMARY KEY,
  student_number        TEXT UNIQUE NOT NULL,     -- generated, e.g. MMS-2026-0001
  family_id             TEXT NOT NULL,            -- generated, e.g. FAM-0001 (siblings share it)
  name                  TEXT NOT NULL,
  guardian_name         TEXT NOT NULL,
  guardian_phone        TEXT NOT NULL,
  class_name            TEXT NOT NULL,
  photo_data_url        TEXT NOT NULL DEFAULT '',
  guardian_relationship TEXT NOT NULL DEFAULT '',
  date_of_birth         TEXT NOT NULL DEFAULT '',
  gender                TEXT NOT NULL DEFAULT '',
  address               TEXT NOT NULL DEFAULT '',
  father_name           TEXT NOT NULL DEFAULT '',
  mother_name           TEXT NOT NULL DEFAULT '',
  father_occupation     TEXT NOT NULL DEFAULT '',
  mother_occupation     TEXT NOT NULL DEFAULT '',
  mother_phone          TEXT NOT NULL DEFAULT '',
  guardian_email        TEXT NOT NULL DEFAULT '',
  blood_group           TEXT NOT NULL DEFAULT '',
  nationality           TEXT NOT NULL DEFAULT '',
  previous_school       TEXT NOT NULL DEFAULT '',
  admission_date        TEXT NOT NULL DEFAULT '',
  emergency_phone       TEXT NOT NULL DEFAULT '',
  status                TEXT NOT NULL DEFAULT 'active'
);

-- "teachers" holds both teaching staff (kind = 'teacher') and non-teaching staff (kind = 'faculty').
CREATE TABLE IF NOT EXISTS teachers (
  id               INTEGER PRIMARY KEY,
  kind             TEXT NOT NULL CHECK (kind IN ('teacher', 'faculty')),
  name             TEXT NOT NULL,
  job_title        TEXT NOT NULL,
  qualification    TEXT NOT NULL DEFAULT '',
  phone            TEXT NOT NULL DEFAULT '',
  email            TEXT NOT NULL DEFAULT '',
  address          TEXT NOT NULL DEFAULT '',
  joining_date     TEXT NOT NULL DEFAULT '',
  gender           TEXT NOT NULL DEFAULT '',
  subjects_taught  TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'active',
  basic_salary     REAL NOT NULL DEFAULT 0,
  allowance_amount REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS fee_types (
  id           INTEGER PRIMARY KEY,
  label        TEXT NOT NULL,
  fee_category TEXT NOT NULL CHECK (fee_category IN ('student', 'enrollment', 'exam', 'other')),
  amount       REAL NOT NULL CHECK (amount >= 0),
  class_name   TEXT NOT NULL DEFAULT ''           -- optional: only bill students of this class
);

-- total_amount is the amount to pay AFTER the scholarship discount.
CREATE TABLE IF NOT EXISTS invoices (
  id              INTEGER PRIMARY KEY,
  invoice_number  TEXT UNIQUE NOT NULL,
  fee_label       TEXT NOT NULL,
  total_amount    REAL NOT NULL,
  paid_amount     REAL NOT NULL DEFAULT 0,
  discount_amount REAL NOT NULL DEFAULT 0,
  issued_on       TEXT NOT NULL,
  student_id      INTEGER NOT NULL REFERENCES students (id),
  CHECK (paid_amount <= total_amount)
);

CREATE TABLE IF NOT EXISTS payments (
  id                   INTEGER PRIMARY KEY,
  invoice_id           INTEGER NOT NULL REFERENCES invoices (id),
  amount               REAL NOT NULL,
  paid_at              TEXT NOT NULL,
  received_by_username TEXT
);

CREATE TABLE IF NOT EXISTS classes  (name TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS subjects (name TEXT PRIMARY KEY);

CREATE TABLE IF NOT EXISTS audit_log (
  id         INTEGER PRIMARY KEY,
  created_at TEXT NOT NULL,
  username   TEXT,
  action     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id        INTEGER PRIMARY KEY,
  name      TEXT UNIQUE NOT NULL,
  capacity  INTEGER NOT NULL DEFAULT 0,
  room_type TEXT NOT NULL DEFAULT 'classroom',
  notes     TEXT NOT NULL DEFAULT ''
);

-- One row = one period of the weekly class timetable.
CREATE TABLE IF NOT EXISTS schedule (
  id           INTEGER PRIMARY KEY,
  class_name   TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  teacher_id   INTEGER REFERENCES teachers (id) ON DELETE SET NULL,
  room_name    TEXT NOT NULL DEFAULT '',
  weekday      TEXT NOT NULL,                     -- sat, sun, mon, ...
  start_time   TEXT NOT NULL,                     -- "08:30"
  end_time     TEXT NOT NULL
);

-- One row = one month's pay for one staff member.
CREATE TABLE IF NOT EXISTS payroll (
  id               INTEGER PRIMARY KEY,
  teacher_id       INTEGER NOT NULL REFERENCES teachers (id),
  payroll_month    TEXT NOT NULL,                 -- "2026-03"
  basic_salary     REAL NOT NULL,
  allowance_amount REAL NOT NULL DEFAULT 0,
  deduction_amount REAL NOT NULL DEFAULT 0,
  net_pay          REAL NOT NULL,
  paid_on          TEXT NOT NULL DEFAULT '',      -- empty until the salary is paid
  UNIQUE (teacher_id, payroll_month)
);

CREATE TABLE IF NOT EXISTS agenda (
  id         INTEGER PRIMARY KEY,
  title      TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT 'event',
  notes      TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS discipline (
  id            INTEGER PRIMARY KEY,
  student_id    INTEGER NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  incident_date TEXT NOT NULL,
  incident_type TEXT NOT NULL DEFAULT 'warning',
  description   TEXT NOT NULL,
  action_taken  TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS scholarships (
  id                  INTEGER PRIMARY KEY,
  student_id          INTEGER NOT NULL REFERENCES students (id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  discount_type       TEXT NOT NULL DEFAULT 'percent',  -- 'percent' or 'amount'
  discount_value      REAL NOT NULL DEFAULT 0,
  applies_to_fee_type TEXT NOT NULL DEFAULT 'all',
  valid_from          TEXT NOT NULL DEFAULT '',
  valid_to            TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS records (
  id               INTEGER PRIMARY KEY,
  reference_number TEXT NOT NULL DEFAULT '',
  title            TEXT NOT NULL,
  category         TEXT NOT NULL DEFAULT 'other',
  record_date      TEXT NOT NULL,
  notes            TEXT NOT NULL DEFAULT ''
);`;

export const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS students_family_id    ON students (family_id);
CREATE INDEX IF NOT EXISTS invoices_student_id   ON invoices (student_id);
CREATE INDEX IF NOT EXISTS schedule_teacher_id   ON schedule (teacher_id);`;

// Failed sign-ins per "username|ip address". Stored in the database (not in memory) because on
// Vercel every request may be handled by a different, short-lived server instance.
export const CREATE_LOGIN_ATTEMPTS_SQL = `
CREATE TABLE IF NOT EXISTS login_attempts (
  throttle_key    TEXT PRIMARY KEY,
  failure_count   INTEGER NOT NULL,
  last_failure_at INTEGER NOT NULL
);`;

// Parents before children, so a backup can be restored in this order without breaking foreign keys.
// (Sessions and login attempts are temporary and are not part of a backup.)
export const BACKUP_TABLE_ORDER = [
  'users',
  'students',
  'teachers',
  'fee_types',
  'invoices',
  'payments',
  'classes',
  'subjects',
  'audit_log',
  'rooms',
  'schedule',
  'payroll',
  'agenda',
  'discipline',
  'scholarships',
  'records',
];

/* -------------------------------------------------------------------------- */
/*  Connecting                                                                */
/* -------------------------------------------------------------------------- */

function createDatabaseClient() {
  const remoteUrl = process.env.TURSO_DATABASE_URL;
  if (remoteUrl) {
    return createClient({ url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  // No Turso settings: use a local SQLite file (development, or Docker with a volume on /data).
  const dataDirectory = process.env.DATA_DIR || './data';
  fs.mkdirSync(dataDirectory, { recursive: true });
  return createClient({ url: `file:${path.resolve(dataDirectory, 'madrassa.db')}` });
}

async function initialiseDatabase() {
  const client = createDatabaseClient();
  // Local files only; hosted databases manage these themselves. Harmless if they do nothing.
  await client.execute('PRAGMA foreign_keys = ON').catch(() => {});
  if (!process.env.TURSO_DATABASE_URL) await client.execute('PRAGMA journal_mode = WAL').catch(() => {});
  // Every statement is "IF NOT EXISTS", so this is safe to run on every cold start.
  await client.executeMultiple(
    `${CREATE_TABLES_SQL}\n${CREATE_INDEXES_SQL}\n${CREATE_LOGIN_ATTEMPTS_SQL}`,
  );
  await createFirstAdminUser(client);
  return client;
}

// The client is created (and the schema checked) once per server instance, on first use rather than
// at import time, so that `next build` never touches the database.
export function getClient() {
  globalThis.__madrassaClientPromise ??= initialiseDatabase().catch((error) => {
    globalThis.__madrassaClientPromise = undefined; // try again on the next request
    throw error;
  });
  return globalThis.__madrassaClientPromise;
}

// On the very first start, create an "admin" user so that someone can sign in.
// The password comes from ADMIN_PASSWORD, or is generated and printed once in the log.
async function createFirstAdminUser(client) {
  if (process.env.SKIP_FIRST_ADMIN) return;
  const anyUser = await client.execute('SELECT 1 FROM users LIMIT 1');
  if (anyUser.rows.length > 0) return;

  const password = process.env.ADMIN_PASSWORD || randomBytes(8).toString('hex');
  const insertion = await client.execute({
    sql: 'INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?, ?, ?)',
    args: ['admin', hashPassword(password), 'admin'],
  });
  if (insertion.rowsAffected === 0) return; // another server instance created it a moment ago

  const passwordNote = process.env.ADMIN_PASSWORD ? '' : `. Initial password: ${password}`;
  console.log(`[madrassa] Created user "admin"${passwordNote}`);
}

/* -------------------------------------------------------------------------- */
/*  Queries and transactions                                                  */
/* -------------------------------------------------------------------------- */

// While runInTransaction is running, its queries use the open transaction instead of the plain client.
const transactionStorage = new AsyncLocalStorage();

async function executeSql(sql, args) {
  const executor = transactionStorage.getStore() ?? (await getClient());
  const result = await executor.execute({ sql, args });
  const rows = result.rows.map((row) =>
    Object.fromEntries(result.columns.map((columnName, index) => [columnName, row[index]])),
  );
  return { rows, changes: result.rowsAffected };
}

// All matching rows, as plain objects.
export async function queryAll(sql, args = []) {
  return (await executeSql(sql, args)).rows;
}

// The first matching row, or undefined.
export async function queryOne(sql, args = []) {
  return (await executeSql(sql, args)).rows[0];
}

// Runs INSERT / UPDATE / DELETE. Returns { changes: number of rows affected }.
export async function execute(sql, args = []) {
  const { changes } = await executeSql(sql, args);
  return { changes };
}

// Runs `work` so that all its database changes succeed together or not at all.
// Calling it again from inside `work` simply joins the transaction that is already open.
export async function runInTransaction(work) {
  if (transactionStorage.getStore()) return work();

  const client = await getClient();
  const transaction = await client.transaction('write');
  try {
    const result = await transactionStorage.run(transaction, work);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback().catch(() => {});
    throw error;
  } finally {
    transaction.close();
  }
}

/* -------------------------------------------------------------------------- */
/*  Audit log                                                                 */
/* -------------------------------------------------------------------------- */

// Records who did what. `user` is the signed-in user (or null for system actions).
export async function recordAudit(user, action) {
  await execute('INSERT INTO audit_log (created_at, username, action) VALUES (?, ?, ?)', [
    new Date().toISOString(),
    user?.username || '',
    action,
  ]);
}

/* -------------------------------------------------------------------------- */
/*  Backups: the whole database as a restorable SQL script                    */
/* -------------------------------------------------------------------------- */

const BACKUP_PAGE_SIZE = 200;

function toSqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  if (typeof value === 'string') return `'${value.replaceAll("'", "''")}'`;
  return `X'${Buffer.from(value).toString('hex')}'`; // binary data (not used by this app)
}

// Yields the backup as pieces of SQL text. Reading happens inside one read transaction, so the
// backup is a consistent snapshot even while people are using the app.
// To restore:  `npm run restore -- <file>`  or  `turso db shell <database-name> < <file>`
export async function* generateSqlBackup() {
  const client = await getClient();
  const snapshot = await client.transaction('read');
  try {
    yield `-- Madrassa backup, ${new Date().toISOString()}\n`;
    yield `${CREATE_TABLES_SQL}\n${CREATE_INDEXES_SQL}\n\n`;

    for (const tableName of BACKUP_TABLE_ORDER) {
      let lastRowId = 0;
      for (;;) {
        const page = await snapshot.execute({
          sql: `SELECT rowid AS backup_row_id, * FROM ${tableName}
                 WHERE rowid > ? ORDER BY rowid LIMIT ${BACKUP_PAGE_SIZE}`,
          args: [lastRowId],
        });
        if (page.rows.length === 0) break;

        const columnNames = page.columns.slice(1); // the first column is backup_row_id
        let sql = '';
        for (const row of page.rows) {
          const values = columnNames.map((_, index) => toSqlLiteral(row[index + 1]));
          sql += `INSERT OR REPLACE INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        yield sql;
        lastRowId = Number(page.rows[page.rows.length - 1][0]);
        if (page.rows.length < BACKUP_PAGE_SIZE) break;
      }
    }
  } finally {
    snapshot.close();
  }
}
