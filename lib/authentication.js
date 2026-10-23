// Sign-in, server-side sessions (kept in an httpOnly cookie) and protection against password guessing.
import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { execute, queryOne, recordAudit } from './database.mjs';
import { verifyPassword } from './passwords.mjs';
import { AppError } from './app-error.js';

const SESSION_COOKIE_NAME = 'madrassa_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
// Failed sign-ins are counted per "username|ip address" in the login_attempts table. They live in
// the database, not in memory, because on Vercel every request can reach a different server instance.

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

// Returns { id, username, role, family_id } for the signed-in user, or null when nobody is signed in.
export async function getSignedInUser() {
  const cookieJar = await cookies();
  const token = cookieJar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const user = await queryOne(
    `SELECT users.id, users.username, users.role, users.family_id
       FROM sessions
       JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    [hashToken(token), Date.now()],
  );
  return user || null;
}

// Failures older than the lockout period no longer count.
async function loadRecentFailureCount(throttleKey) {
  const failure = await queryOne(
    'SELECT failure_count, last_failure_at FROM login_attempts WHERE throttle_key = ?',
    [throttleKey],
  );
  const isRecent = failure && Date.now() - failure.last_failure_at < LOCKOUT_DURATION_MS;
  return isRecent ? failure.failure_count : 0;
}

async function recordFailedLogin(throttleKey) {
  await execute(
    `INSERT INTO login_attempts (throttle_key, failure_count, last_failure_at) VALUES (?, 1, ?)
     ON CONFLICT (throttle_key) DO UPDATE SET
       failure_count = CASE WHEN ? - last_failure_at < ? THEN failure_count + 1 ELSE 1 END,
       last_failure_at = excluded.last_failure_at`,
    [throttleKey, Date.now(), Date.now(), LOCKOUT_DURATION_MS],
  );
}

// Checks the username and password, starts a session and returns { username, role }.
export async function signIn(credentials, clientIpAddress) {
  const username = String(credentials.username ?? '');
  const password = String(credentials.password ?? '');

  const throttleKey = `${username.toLowerCase()}|${clientIpAddress}`;
  if ((await loadRecentFailureCount(throttleKey)) >= MAX_FAILED_LOGINS) {
    throw new AppError('Too many attempts. Try again later.', 429);
  }

  const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    await recordFailedLogin(throttleKey);
    throw new AppError('Invalid credentials', 401);
  }
  await execute('DELETE FROM login_attempts WHERE throttle_key = ?', [throttleKey]);

  const token = randomBytes(32).toString('hex'); // only its hash is stored in the database
  // Tidy up old rows.
  await execute('DELETE FROM sessions WHERE expires_at < ?', [Date.now()]);
  await execute('DELETE FROM login_attempts WHERE last_failure_at < ?', [
    Date.now() - LOCKOUT_DURATION_MS,
  ]);
  await execute('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [
    hashToken(token),
    user.id,
    Date.now() + SESSION_DURATION_MS,
  ]);

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false',
  });

  await recordAudit(user, 'login');
  return { username: user.username, role: user.role };
}

export async function signOut() {
  const cookieJar = await cookies();
  const token = cookieJar.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await execute('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
  }
  cookieJar.delete(SESSION_COOKIE_NAME);
}
