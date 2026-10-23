// Login accounts for staff who use the system.
import { execute, queryOne, recordAudit } from '../database.mjs';
import { hashPassword } from '../passwords.mjs';
import { AppError } from '../app-error.js';
import { ALL_ROLES, STUDENT_ROLE } from '../permissions.js';
import { requireText } from '../validation.js';

const MIN_PASSWORD_LENGTH = 10;

// Creates a user, or resets the password, role and family when the username already exists.
// A student / guardian account must name an existing Family ID; staff accounts have none.
export async function saveUser(input, adminUser) {
  const username = requireText(input.username, 50);
  const password = requireText(input.password, 200);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!ALL_ROLES.includes(input.role)) throw new AppError('Invalid role');

  let familyId = '';
  if (input.role === STUDENT_ROLE) {
    familyId = requireText(input.family_id, 50);
    if (!(await queryOne('SELECT 1 FROM students WHERE family_id = ?', [familyId]))) {
      throw new AppError('Unknown Family ID');
    }
  }

  await execute(
    `INSERT INTO users (username, password_hash, role, family_id) VALUES (?, ?, ?, ?)
     ON CONFLICT (username) DO UPDATE SET
       password_hash = excluded.password_hash, role = excluded.role, family_id = excluded.family_id`,
    [username, hashPassword(password), input.role, familyId],
  );
  const familyNote = familyId ? `, ${familyId}` : '';
  await recordAudit(adminUser, `user saved: ${username} (${input.role}${familyNote})`);
}

export async function deleteUser(input, adminUser) {
  const username = requireText(input.username, 50);
  if (username === adminUser.username) throw new AppError('You cannot delete your own account');
  // Sign the user out everywhere first (the database also does this through a foreign key).
  await execute('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE username = ?)', [
    username,
  ]);
  await execute('DELETE FROM users WHERE username = ?', [username]);
  await recordAudit(adminUser, `user deleted: ${username}`);
}
