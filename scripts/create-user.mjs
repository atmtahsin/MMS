// Usage:
//   npm run create-user -- <username> <password> <admin|registrar|accounts>
//   npm run create-user -- <username> <password> student <FAMILY-ID>
//
// Works on the database named by TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (or the local file when unset).
// Creates the user, or resets the password / role / family if the username already exists.
// A "student" account is for a student or guardian: it is linked to one Family ID (for example
// FAM-0001) and can only see that family's profile, fees and timetable in the student portal.
process.env.SKIP_FIRST_ADMIN = '1';
const { execute, queryOne } = await import('../lib/database.mjs');
const { hashPassword } = await import('../lib/passwords.mjs');
const { ALL_ROLES, STUDENT_ROLE } = await import('../lib/permissions.js');

const MIN_PASSWORD_LENGTH = 10;

const [username, password, role, familyIdArgument = ''] = process.argv.slice(2);

const argumentsAreValid =
  username &&
  password &&
  password.length >= MIN_PASSWORD_LENGTH &&
  ALL_ROLES.includes(role) &&
  (role !== STUDENT_ROLE || familyIdArgument);
if (!argumentsAreValid) {
  console.error(
    `Usage: npm run create-user -- <username> <password (${MIN_PASSWORD_LENGTH}+ chars)> <${ALL_ROLES.join('|')}> [FAMILY-ID, required for ${STUDENT_ROLE}]`,
  );
  process.exit(1);
}

const familyId = role === STUDENT_ROLE ? familyIdArgument : '';
if (familyId && !(await queryOne('SELECT 1 FROM students WHERE family_id = ?', [familyId]))) {
  console.error(`No student has the Family ID "${familyId}".`);
  process.exit(1);
}

await execute(
  `INSERT INTO users (username, password_hash, role, family_id) VALUES (?, ?, ?, ?)
   ON CONFLICT (username) DO UPDATE SET
     password_hash = excluded.password_hash, role = excluded.role, family_id = excluded.family_id`,
  [username, hashPassword(password), role, familyId],
);

console.log('Saved user', username);
