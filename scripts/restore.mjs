// Usage:  npm run restore -- <backup .sql file>
//
// Loads a backup made by `npm run backup` (or the Settings -> backup download) into the database
// named by TURSO_DATABASE_URL / TURSO_AUTH_TOKEN, or into the local file when those are unset.
// Rows in the backup replace rows with the same id; other rows already in the database stay.
// (Alternative for Turso:  turso db shell <database-name> < backup.sql)
import fs from 'node:fs';

process.env.SKIP_FIRST_ADMIN = '1'; // the backup brings its own users
const { getClient } = await import('../lib/database.mjs');

const backupFile = process.argv[2];
if (!backupFile || !fs.existsSync(backupFile)) {
  console.error('Usage: npm run restore -- <backup .sql file>');
  process.exit(1);
}

const client = await getClient();
await client.executeMultiple(fs.readFileSync(backupFile, 'utf8'));
console.log('Restored from', backupFile);
process.exit(0);
