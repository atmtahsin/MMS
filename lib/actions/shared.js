// Helpers used by several of the action files.
import { execute, queryOne, recordAudit, runInTransaction } from '../database.mjs';
import { AppError } from '../app-error.js';

// Wraps a function so that all its database changes succeed together or not at all.
export const inTransaction =
  (workFunction) =>
  (...args) =>
    runInTransaction(() => workFunction(...args));

// Builds the next human-friendly number for a table, e.g. ("invoices", "INV-", 5) -> "INV-00042".
export async function nextSequenceNumber(tableName, prefix, digits) {
  const { nextId } = await queryOne(`SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM ${tableName}`);
  return prefix + String(nextId).padStart(digits, '0');
}

// Rows in other tables that point at a row we are about to delete.
// The database enforces these as foreign keys too; they are checked here as well so the result is
// the same whichever database engine or setting is used.
const BLOCKING_REFERENCES = {
  students: [{ table: 'invoices', column: 'student_id' }],
  teachers: [{ table: 'payroll', column: 'teacher_id' }],
  invoices: [{ table: 'payments', column: 'invoice_id' }],
};
const DEPENDENT_ROWS_DELETED_WITH = {
  students: [
    { table: 'discipline', column: 'student_id' },
    { table: 'scholarships', column: 'student_id' },
  ],
};
const REFERENCES_CLEARED_WHEN_DELETED = {
  teachers: [{ table: 'schedule', column: 'teacher_id' }],
};

// Deletes one row. This fails (and says so) when other records, such as invoices, still point to it.
export async function deleteRowById(tableName, id, auditLabel, user) {
  const rowId = Number(id);
  const inUseError = new AppError('This record is in use and cannot be deleted');

  try {
    await runInTransaction(async () => {
      for (const { table, column } of BLOCKING_REFERENCES[tableName] || []) {
        if (await queryOne(`SELECT 1 FROM ${table} WHERE ${column} = ? LIMIT 1`, [rowId])) {
          throw inUseError;
        }
      }
      for (const { table, column } of DEPENDENT_ROWS_DELETED_WITH[tableName] || []) {
        await execute(`DELETE FROM ${table} WHERE ${column} = ?`, [rowId]);
      }
      for (const { table, column } of REFERENCES_CLEARED_WHEN_DELETED[tableName] || []) {
        await execute(`UPDATE ${table} SET ${column} = NULL WHERE ${column} = ?`, [rowId]);
      }
      await execute(`DELETE FROM ${tableName} WHERE id = ?`, [rowId]);
    });
  } catch (error) {
    // Only a refused delete means "in use"; anything else (e.g. a lost connection) is a real error.
    if (error instanceof AppError) throw error;
    if (/constraint|foreign key/i.test(String(error?.message))) throw inUseError;
    throw error;
  }
  await recordAudit(user, `${auditLabel} deleted (id ${id})`);
}
