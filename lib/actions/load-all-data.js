// Everything the screens need, in one call. Each list is only sent to the roles allowed to see it.
// The queries run in parallel: with a hosted database every query is a network round trip.
import { queryAll } from '../database.mjs';
import { STUDENT_ROLE, hasPermission } from '../permissions.js';

const placeholders = (values) => values.map(() => '?').join(',');

// What a student / guardian account may see: only the students of its own Family ID, their
// invoices, and the timetable of their classes. Everything else is sent as an empty list.
// Because this is decided here on the server, a portal user cannot read anyone else's data
// even by calling the API directly.
async function loadStudentPortalData(user) {
  const students = await queryAll(
    "SELECT * FROM students WHERE family_id = ? AND family_id != '' ORDER BY id",
    [user.family_id],
  );
  const studentIds = students.map((student) => student.id);
  const classNamesOfFamily = [...new Set(students.map((student) => student.class_name))];

  const [staffNames, invoices, schedule] = await Promise.all([
    // Just names, so the timetable can show who teaches each period.
    queryAll('SELECT id, name, kind FROM teachers ORDER BY name'),
    studentIds.length
      ? queryAll(
          `SELECT * FROM invoices WHERE student_id IN (${placeholders(studentIds)}) ORDER BY id`,
          studentIds,
        )
      : [],
    classNamesOfFamily.length
      ? queryAll(
          `SELECT * FROM schedule WHERE class_name IN (${placeholders(classNamesOfFamily)}) ORDER BY id`,
          classNamesOfFamily,
        )
      : [],
  ]);

  return {
    students,
    teachers: [],
    staffNames,
    feeTypes: [],
    invoices,
    payrollLines: [],
    classNames: [],
    subjectNames: [],
    rooms: [],
    schedule,
    agenda: [],
    discipline: [],
    scholarships: [],
    records: [],
    users: [],
    auditLog: [],
  };
}

export async function loadAllData(user) {
  if (user.role === STUDENT_ROLE) return loadStudentPortalData(user);

  const canView = (area) => hasPermission(user.role, area);
  // The rows of a list, or an empty list when this user may not see that area.
  const rowsIfAllowed = (area, sql) => (canView(area) ? queryAll(sql) : []);
  const isAdmin = user.role === 'admin';

  // Salaries are hidden from users who may see staff but not payroll.
  const canViewPayroll = canView('payroll');
  const loadTeachers = async () =>
    canView('teachers') || canViewPayroll
      ? (await queryAll('SELECT * FROM teachers ORDER BY id')).map((teacher) =>
          canViewPayroll ? teacher : { ...teacher, basic_salary: 0, allowance_amount: 0 },
        )
      : [];

  const [
    students,
    teachers,
    staffNames,
    feeTypes,
    invoices,
    payrollLines,
    classRows,
    subjectRows,
    rooms,
    schedule,
    agenda,
    discipline,
    scholarships,
    records,
    users,
    auditLog,
  ] = await Promise.all([
    queryAll('SELECT * FROM students ORDER BY id'),
    loadTeachers(),
    // Just names, for dropdown lists (e.g. choosing a teacher for a class period).
    queryAll('SELECT id, name, kind FROM teachers ORDER BY name'),
    rowsIfAllowed('accounting', 'SELECT * FROM fee_types ORDER BY id'),
    rowsIfAllowed('accounting', 'SELECT * FROM invoices ORDER BY id'),
    rowsIfAllowed('payroll', 'SELECT * FROM payroll ORDER BY payroll_month DESC, id'),
    queryAll('SELECT name FROM classes ORDER BY name'),
    queryAll('SELECT name FROM subjects ORDER BY name'),
    rowsIfAllowed('rooms', 'SELECT * FROM rooms ORDER BY id'),
    rowsIfAllowed('schedule', 'SELECT * FROM schedule ORDER BY id'),
    rowsIfAllowed('agenda', 'SELECT * FROM agenda ORDER BY id'),
    rowsIfAllowed('discipline', 'SELECT * FROM discipline ORDER BY id'),
    rowsIfAllowed('scholarships', 'SELECT * FROM scholarships ORDER BY id'),
    rowsIfAllowed('records', 'SELECT * FROM records ORDER BY id'),
    isAdmin ? queryAll('SELECT username, role, family_id FROM users ORDER BY username') : [],
    isAdmin
      ? queryAll('SELECT created_at, username, action FROM audit_log ORDER BY id DESC LIMIT 100')
      : [],
  ]);

  return {
    students,
    teachers,
    staffNames,
    feeTypes,
    invoices,
    payrollLines,
    classNames: classRows.map((row) => row.name),
    subjectNames: subjectRows.map((row) => row.name),
    rooms,
    schedule,
    agenda,
    discipline,
    scholarships,
    records,
    users,
    auditLog,
  };
}
