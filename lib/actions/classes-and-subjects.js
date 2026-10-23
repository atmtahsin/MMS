// The two simple name lists of the Academic module: classes and subjects.
import { execute, recordAudit } from '../database.mjs';
import { requireText } from '../validation.js';

const MAX_NAME_LENGTH = 50;

async function addName(tableName, label, input, user) {
  const name = requireText(input.name, MAX_NAME_LENGTH);
  await execute(`INSERT OR IGNORE INTO ${tableName} (name) VALUES (?)`, [name]);
  await recordAudit(user, `${label} added: ${name}`);
}

async function removeName(tableName, label, input, user) {
  const name = requireText(input.name, MAX_NAME_LENGTH);
  await execute(`DELETE FROM ${tableName} WHERE name = ?`, [name]);
  await recordAudit(user, `${label} removed: ${name}`);
}

export const addClass = (input, user) => addName('classes', 'class', input, user);
export const removeClass = (input, user) => removeName('classes', 'class', input, user);
export const addSubject = (input, user) => addName('subjects', 'subject', input, user);
export const removeSubject = (input, user) => removeName('subjects', 'subject', input, user);
