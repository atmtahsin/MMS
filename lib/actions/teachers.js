// Teachers and faculty (non-teaching staff): name, job title, contact details, status.
// Salaries are handled separately in payroll.js so that the registrar never edits pay.
import { execute, recordAudit } from '../database.mjs';
import { requireText, optionalText, oneOf } from '../validation.js';
import { inTransaction, deleteRowById } from './shared.js';

const OPTIONAL_TEACHER_TEXT_FIELDS = {
  qualification: 200,
  phone: 30,
  email: 100,
  address: 300,
  joining_date: 10,
  subjects_taught: 200,
};

function validateTeacherInput(input) {
  const teacher = {
    kind: oneOf(input.kind, ['teacher', 'faculty'], 'teacher'),
    name: requireText(input.name),
    job_title: requireText(input.job_title),
  };
  for (const [fieldName, maxLength] of Object.entries(OPTIONAL_TEACHER_TEXT_FIELDS)) {
    teacher[fieldName] = optionalText(input[fieldName], maxLength);
  }
  teacher.gender = oneOf(input.gender, ['male', 'female'], '');
  teacher.status = oneOf(input.status, ['active', 'inactive'], 'active');
  return teacher;
}

export async function addTeacher(input, user) {
  const teacher = validateTeacherInput(input);
  const columns = Object.keys(teacher);
  await execute(
    `INSERT INTO teachers (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    columns.map((columnName) => teacher[columnName]),
  );
  await recordAudit(user, `${teacher.kind} added: ${teacher.name}`);
}

export async function updateTeacher(input, user) {
  const teacher = validateTeacherInput(input);
  const columns = Object.keys(teacher);
  await execute(`UPDATE teachers SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`, [
    ...columns.map((columnName) => teacher[columnName]),
    Number(input.id),
  ]);
  await recordAudit(user, `${teacher.kind} updated: ${teacher.name}`);
}

export const importTeachers = inTransaction(async (teacherInputs, user) => {
  for (const input of teacherInputs) await addTeacher(input, user);
});

export const deleteTeacher = (input, user) => deleteRowById('teachers', input.id, 'teacher', user);
