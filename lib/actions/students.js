// Students: registering, updating, deleting. Student numbers and Family IDs are generated here.
import { execute, queryOne, recordAudit } from '../database.mjs';
import { AppError } from '../app-error.js';
import { requireText, optionalText, oneOf } from '../validation.js';
import { inTransaction, nextSequenceNumber, deleteRowById } from './shared.js';

// Optional text fields of a student and the longest value each may have.
const OPTIONAL_STUDENT_TEXT_FIELDS = {
  guardian_relationship: 50,
  date_of_birth: 10,
  address: 300,
  father_name: 100,
  mother_name: 100,
  father_occupation: 100,
  mother_occupation: 100,
  mother_phone: 30,
  guardian_email: 100,
  blood_group: 5,
  nationality: 50,
  previous_school: 150,
  admission_date: 10,
  emergency_phone: 30,
};

const MAX_PHOTO_LENGTH = 600000; // characters of the base64 "data:image/..." text

// Only small embedded images are accepted as a photo.
function validPhotoOrEmpty(value) {
  const isSmallImage =
    typeof value === 'string' && value.startsWith('data:image/') && value.length < MAX_PHOTO_LENGTH;
  return isSmallImage ? value : '';
}

// Checks the fields of the student form (or of one CSV row) and returns a clean student object.
function validateStudentInput(input) {
  const student = {
    name: requireText(input.name),
    guardian_name: requireText(input.guardian_name),
    guardian_phone: requireText(input.guardian_phone, 30),
    class_name: requireText(input.class_name, 50),
  };
  for (const [fieldName, maxLength] of Object.entries(OPTIONAL_STUDENT_TEXT_FIELDS)) {
    student[fieldName] = optionalText(input[fieldName], maxLength);
  }
  student.gender = oneOf(input.gender, ['male', 'female'], '');
  student.status = oneOf(input.status, ['active', 'inactive', 'graduated'], 'active');
  student.photo_data_url = validPhotoOrEmpty(input.photo_data_url);
  return student;
}

// The photo is saved separately from the other columns, so list the rest here.
const columnsExceptPhoto = (student) =>
  Object.keys(student).filter((columnName) => columnName !== 'photo_data_url');

// Students with the same guardian name and phone number are siblings: they share a Family ID.
async function findOrCreateFamilyId(guardianName, guardianPhone) {
  const sibling = await queryOne(
    'SELECT family_id FROM students WHERE guardian_name = ? AND guardian_phone = ? LIMIT 1',
    [guardianName, guardianPhone],
  );
  if (sibling) return sibling.family_id;

  // "FAM-0007" -> the number starts at character 5.
  const { nextFamilyNumber } = await queryOne(
    'SELECT COALESCE(MAX(CAST(SUBSTR(family_id, 5) AS INTEGER)), 0) + 1 AS nextFamilyNumber FROM students',
  );
  return `FAM-${String(nextFamilyNumber).padStart(4, '0')}`;
}

// Registers one or more students (the form sends one, a CSV import sends many).
export const addStudents = inTransaction(async (studentInputs, user) => {
  for (const input of studentInputs) {
    const student = validateStudentInput(input);
    const studentNumber = await nextSequenceNumber('students', `MMS-${new Date().getFullYear()}-`, 4);
    const otherColumns = columnsExceptPhoto(student);

    await execute(
      `INSERT INTO students (student_number, family_id, photo_data_url, ${otherColumns.join(', ')})
       VALUES (?, ?, ?, ${otherColumns.map(() => '?').join(', ')})`,
      [
        studentNumber,
        await findOrCreateFamilyId(student.guardian_name, student.guardian_phone),
        student.photo_data_url,
        ...otherColumns.map((columnName) => student[columnName]),
      ],
    );
    await recordAudit(user, `student registered ${studentNumber}`);
  }
});

export async function updateStudent(input, user) {
  const student = validateStudentInput(input);
  const existingStudent = await queryOne('SELECT * FROM students WHERE id = ?', [Number(input.id)]);
  if (!existingStudent) throw new AppError('Student not found', 404);

  const otherColumns = columnsExceptPhoto(student);
  await execute(
    `UPDATE students
        SET family_id = ?, photo_data_url = ?, ${otherColumns.map((c) => `${c} = ?`).join(', ')}
      WHERE id = ?`,
    [
      await findOrCreateFamilyId(student.guardian_name, student.guardian_phone),
      student.photo_data_url || existingStudent.photo_data_url, // keep the old photo if none was sent
      ...otherColumns.map((columnName) => student[columnName]),
      existingStudent.id,
    ],
  );
  await recordAudit(user, `student updated ${existingStudent.student_number}`);
}

export const deleteStudent = (input, user) => deleteRowById('students', input.id, 'student', user);
