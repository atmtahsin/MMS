// Saves a dated copy of the database as a SQL script and keeps only the newest BACKUP_KEEP copies
// (default 14). Works on the database named by TURSO_DATABASE_URL / TURSO_AUTH_TOKEN, or the local file.
// Run it every day from cron:   0 2 * * * cd /path/to/madrassa-management-system && npm run backup
// Restore a copy with:          npm run restore -- backups/madrassa-2026-10-22.sql
import fs from 'node:fs';
import path from 'node:path';

process.env.SKIP_FIRST_ADMIN = '1'; // a backup must never create users
const { generateSqlBackup } = await import('../lib/database.mjs');

const backupDirectory = process.env.BACKUP_DIR || './backups';
const numberOfBackupsToKeep = Number(process.env.BACKUP_KEEP || 14);
fs.mkdirSync(backupDirectory, { recursive: true });

const todayAsIsoDate = new Date().toISOString().slice(0, 10);
const backupFile = path.join(backupDirectory, `madrassa-${todayAsIsoDate}.sql`);
const output = fs.createWriteStream(backupFile);
for await (const piece of generateSqlBackup()) {
  if (!output.write(piece)) await new Promise((resolve) => output.once('drain', resolve));
}
await new Promise((resolve, reject) => output.end((error) => (error ? reject(error) : resolve())));

// File names start with a date, so alphabetical order is oldest first.
const oldBackups = fs
  .readdirSync(backupDirectory)
  .filter((fileName) => /^madrassa-.*\.sql$/.test(fileName))
  .sort()
  .slice(0, -numberOfBackupsToKeep);
oldBackups.forEach((fileName) => fs.unlinkSync(path.join(backupDirectory, fileName)));

console.log('Backup saved:', backupFile);
process.exit(0); // the database connection would otherwise keep the process open
