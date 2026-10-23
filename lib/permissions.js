// Who may see and change what.
// This one table is used by the server (to refuse forbidden requests) and by the browser (to hide menus).

const ADMIN = 'admin';
const REGISTRAR = 'registrar';
const ACCOUNTS = 'accounts';

// A student / guardian account. It is linked to one Family ID and can only read that family's own
// profile, fees and timetable (the student portal). It has NO entry in PERMISSIONS below, so every
// staff screen and every write route refuses it by default.
export const STUDENT_ROLE = 'student';

// Roles for school staff. These are the only roles that appear in PERMISSIONS.
export const STAFF_ROLES = [ADMIN, REGISTRAR, ACCOUNTS];

// Every role an account can have.
export const ALL_ROLES = [...STAFF_ROLES, STUDENT_ROLE];

// For every area of the system: which roles may `view` it and which may `edit` it.
export const PERMISSIONS = {
  students: { view: STAFF_ROLES, edit: [ADMIN, REGISTRAR] },
  teachers: { view: [ADMIN, REGISTRAR], edit: [ADMIN, REGISTRAR] },
  classes: { view: STAFF_ROLES, edit: [ADMIN, REGISTRAR] },
  subjects: { view: STAFF_ROLES, edit: [ADMIN, REGISTRAR] },
  schedule: { view: STAFF_ROLES, edit: [ADMIN, REGISTRAR] },
  rooms: { view: STAFF_ROLES, edit: [ADMIN, REGISTRAR] },
  accounting: { view: [ADMIN, ACCOUNTS], edit: [ADMIN, ACCOUNTS] }, // fee types, invoices, payments
  payroll: { view: [ADMIN, ACCOUNTS], edit: [ADMIN, ACCOUNTS] },
  agenda: { view: STAFF_ROLES, edit: [ADMIN, REGISTRAR] },
  discipline: { view: [ADMIN, REGISTRAR], edit: [ADMIN, REGISTRAR] },
  scholarships: { view: [ADMIN, ACCOUNTS], edit: [ADMIN, ACCOUNTS] },
  records: { view: [ADMIN, REGISTRAR], edit: [ADMIN, REGISTRAR] },
  settings: { view: [ADMIN], edit: [ADMIN] },
};

// hasPermission('registrar', 'students', 'edit') -> true
export function hasPermission(role, area, access = 'view') {
  return Boolean(PERMISSIONS[area]?.[access]?.includes(role));
}
