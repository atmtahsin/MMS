// Fills the database with realistic demo data: students, teachers, fees, payroll, timetable, ...
//
// Usage:  npm run seed-demo            (refuses to run if students already exist)
//         npm run seed-demo -- --reset (wipes all school data first, keeps user accounts)
//
// Demo logins (password: Demo-Pass-2026):  registrar / accounts / guardian (student portal, family FAM-0001)
//
// The data is generated from a fixed random seed, so every run produces the same school.
//
// It works on the database named by TURSO_DATABASE_URL / TURSO_AUTH_TOKEN (or the local file when
// unset). The demo school is first built in a temporary local SQLite file (which is fast and lets the
// generator below stay simple), then copied to the real database in batches.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.SKIP_FIRST_ADMIN = '1'; // do not create the first admin as a side effect
const { default: Database } = await import('libsql');
const { getClient, queryOne, CREATE_TABLES_SQL, CREATE_INDEXES_SQL, BACKUP_TABLE_ORDER } =
  await import('../lib/database.mjs');
const { hashPassword } = await import('../lib/passwords.mjs');

const targetClient = await getClient();
const shouldResetFirst = process.argv.includes('--reset');

if ((await queryOne('SELECT 1 FROM students')) && !shouldResetFirst) {
  console.error('Database already has students. Re-run with --reset to wipe school data first.');
  process.exit(1);
}

const temporaryFile = path.join(os.tmpdir(), `madrassa-seed-${process.pid}.db`);
const database = new Database(temporaryFile);
database.exec(CREATE_TABLES_SQL);
database.exec(CREATE_INDEXES_SQL);

/* ------------------------------------------------------------------------------------------
 * Small deterministic random helpers (same data on every run)
 * ---------------------------------------------------------------------------------------- */

let randomSeedState = 20261019;

/** A repeatable pseudo-random number between 0 (inclusive) and 1 (exclusive). */
function random() {
  randomSeedState = (randomSeedState * 1664525 + 1013904223) % 4294967296;
  return randomSeedState / 4294967296;
}

/** A random item of a list. */
const pickOne = (list) => list[Math.floor(random() * list.length)];

/** A random whole number from `min` to `max`, both included. */
const randomInteger = (min, max) => min + Math.floor(random() * (max - min + 1));

const now = new Date();
const currentYear = now.getFullYear();
const MILLISECONDS_PER_DAY = 86400000;

/** A date as "YYYY-MM-DD". */
const toIsoDate = (date) => date.toISOString().slice(0, 10);

/** The date `dayCount` days after `date` (negative = before). */
const addDays = (date, dayCount) => new Date(date.getTime() + dayCount * MILLISECONDS_PER_DAY);

/** "YYYY-MM" for the month `monthOffset` months from now (0 = this month, -1 = last month). */
function monthKey(monthOffset) {
  const monthStart = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
}

/** A believable Bangladeshi mobile number. */
const randomPhoneNumber = () =>
  `01${pickOne([3, 5, 6, 7, 8, 9])}${randomInteger(10000000, 99999999)}`;

/* ------------------------------------------------------------------------------------------
 * Optional wipe of existing school data (user accounts are kept)
 * ---------------------------------------------------------------------------------------- */

// (With --reset, the real database is wiped just before the new data is copied in; see the end.)

/* ------------------------------------------------------------------------------------------
 * Reference data
 * ---------------------------------------------------------------------------------------- */

const CLASS_NAMES = ['Nursery', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
const SUBJECT_NAMES = [
  'Quran',
  'Hadith',
  'Fiqh',
  'Arabic',
  'Bangla',
  'English',
  'Mathematics',
  'Science',
];

/** Monthly tuition per class, in taka. */
const MONTHLY_TUITION_BY_CLASS = {
  Nursery: 800,
  'Class 1': 1000,
  'Class 2': 1000,
  'Class 3': 1200,
  'Class 4': 1200,
  'Class 5': 1500,
};

/** Each class's own classroom. */
const HOME_ROOM_BY_CLASS = {
  Nursery: 'Room 101',
  'Class 1': 'Room 102',
  'Class 2': 'Room 103',
  'Class 3': 'Room 201',
  'Class 4': 'Room 202',
  'Class 5': 'Room 203',
};

/** A typical student's age (in years) in each class, used to invent birth dates. */
const TYPICAL_AGE_BY_CLASS = {
  Nursery: 5,
  'Class 1': 6,
  'Class 2': 7,
  'Class 3': 8,
  'Class 4': 9,
  'Class 5': 10,
};

// [name, capacity, room type, notes]
const ROOMS = [
  ['Room 101', 30, 'classroom', 'Ground floor'],
  ['Room 102', 30, 'classroom', 'Ground floor'],
  ['Room 103', 35, 'classroom', 'Ground floor'],
  ['Room 201', 35, 'classroom', 'First floor'],
  ['Room 202', 35, 'classroom', 'First floor'],
  ['Room 203', 40, 'classroom', 'First floor'],
  ['Science Lab', 25, 'lab', 'Shared lab'],
  ['Library', 40, 'library', 'Open 8am to 2pm'],
  ['Main Hall', 200, 'hall', 'Assembly and events'],
  ['Admin Office', 6, 'office', ''],
];

const MALE_FIRST_NAMES = [
  'Abdullah',
  'Muhammad',
  'Ibrahim',
  'Yusuf',
  'Hamza',
  'Omar',
  'Bilal',
  'Zayd',
  'Tahmid',
  'Rafi',
  'Anas',
  'Sakib',
  'Imran',
  'Nafis',
  'Mahir',
  'Ayman',
  'Shafin',
  'Rayhan',
];
const FEMALE_FIRST_NAMES = [
  'Aisha',
  'Fatima',
  'Maryam',
  'Khadija',
  'Zainab',
  'Sumaiya',
  'Ruqayya',
  'Hafsa',
  'Safiya',
  'Nusrat',
  'Tasnim',
  'Jannat',
  'Mim',
  'Tahira',
  'Samia',
];
const FAMILY_NAMES = [
  'Rahman',
  'Hossain',
  'Islam',
  'Ahmed',
  'Uddin',
  'Khan',
  'Chowdhury',
  'Sarkar',
  'Mia',
  'Talukder',
  'Siddique',
  'Karim',
  'Miah',
  'Bhuiyan',
  'Alam',
  'Sheikh',
  'Haque',
  'Mondal',
  'Akter',
  'Begum',
];
const FATHER_FIRST_NAMES = [
  'Abdul',
  'Md.',
  'Mostafa',
  'Jahangir',
  'Kamal',
  'Nurul',
  'Rafiqul',
  'Shahidul',
  'Mizanur',
  'Anwar',
  'Harun',
  'Selim',
];
const MOTHER_FIRST_NAMES = [
  'Rokeya',
  'Salma',
  'Nasrin',
  'Rahima',
  'Shirin',
  'Morjina',
  'Laila',
  'Farida',
  'Rubina',
  'Hasina',
];
const FATHER_OCCUPATIONS = [
  'Shopkeeper',
  'Teacher',
  'Farmer',
  'Driver',
  'Businessman',
  'Garment worker',
  'Imam',
  'Rickshaw puller',
  'Clerk',
  'Tailor',
];
const ADDRESSES = [
  'Mirpur 10, Dhaka',
  'Uttara Sector 7, Dhaka',
  'Jatrabari, Dhaka',
  'Savar, Dhaka',
  'Narayanganj Sadar',
  'Tongi, Gazipur',
  'Keraniganj, Dhaka',
  'Demra, Dhaka',
];
const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'O-', 'A-'];

/* ------------------------------------------------------------------------------------------
 * Classes, subjects and rooms
 * ---------------------------------------------------------------------------------------- */

const insertClass = database.prepare('INSERT OR IGNORE INTO classes (name) VALUES (?)');
CLASS_NAMES.forEach((className) => insertClass.run(className));

const insertSubject = database.prepare('INSERT OR IGNORE INTO subjects (name) VALUES (?)');
SUBJECT_NAMES.forEach((subjectName) => insertSubject.run(subjectName));

const insertRoom = database.prepare(
  'INSERT OR IGNORE INTO rooms (name, capacity, room_type, notes) VALUES (?, ?, ?, ?)',
);
ROOMS.forEach((room) => insertRoom.run(...room));

/* ------------------------------------------------------------------------------------------
 * Teachers (one per subject) and non-teaching faculty
 * ---------------------------------------------------------------------------------------- */

// [name, gender, job title, subject taught, qualification, basic salary, allowance]
const TEACHERS = [
  [
    'Mawlana Abdur Rahim',
    'male',
    'Head Teacher (Quran)',
    'Quran',
    'Dawra-e-Hadith, Jamia Rahmania',
    28000,
    4000,
  ],
  [
    'Mawlana Habibullah',
    'male',
    'Senior Teacher',
    'Hadith',
    'Dawra-e-Hadith, Jamia Islamia',
    24000,
    3000,
  ],
  ['Mufti Saifur Rahman', 'male', 'Senior Teacher', 'Fiqh', 'Takhassus fil Ifta', 25000, 3000],
  ['Ustadh Mahmudul Hasan', 'male', 'Teacher', 'Arabic', 'Kamil, Madrasah Board', 18000, 2000],
  [
    'Rehana Parvin',
    'female',
    'Teacher',
    'Bangla',
    'MA in Bangla, National University',
    17000,
    2000,
  ],
  ['Tanvir Ahmed', 'male', 'Teacher', 'English', 'BA (Hons) English, Dhaka College', 17000, 2000],
  [
    'Shamsun Nahar',
    'female',
    'Teacher',
    'Mathematics',
    'BSc Mathematics, Jagannath University',
    17000,
    2000,
  ],
  ['Kamrul Islam', 'male', 'Teacher', 'Science', 'BSc Physics, Dhaka University', 18000, 2000],
];

// [name, gender, job title, basic salary, allowance]
const FACULTY = [
  ['Abul Kashem', 'male', 'Office Assistant', 12000, 1000],
  ['Rahima Khatun', 'female', 'Cleaner', 8500, 0],
  ['Md. Jalal Uddin', 'male', 'Security Guard', 9000, 500],
  ['Nasima Akter', 'female', 'Accountant', 20000, 2000],
];

const insertTeacher = database.prepare(
  `INSERT INTO teachers (kind, name, job_title, qualification, phone, email, address, joining_date,
                         gender, subjects_taught, status, basic_salary, allowance_amount)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
);

/** "Rehana Parvin" -> "rehana.parvin" (for demo email addresses). */
const toEmailName = (fullName) =>
  fullName
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');

/** subject name -> the id of the teacher who teaches it (used to build the timetable). */
const teacherIdBySubject = {};

TEACHERS.forEach(
  ([name, gender, jobTitle, subject, qualification, basicSalary, allowanceAmount]) => {
    const teacherId = insertTeacher.run(
      'teacher',
      name,
      jobTitle,
      qualification,
      randomPhoneNumber(),
      `${toEmailName(name)}@demo-madrassa.org`,
      pickOne(ADDRESSES),
      toIsoDate(addDays(now, -randomInteger(300, 2500))),
      gender,
      subject,
      basicSalary,
      allowanceAmount,
    ).lastInsertRowid;
    teacherIdBySubject[subject] = Number(teacherId);
  },
);

FACULTY.forEach(([name, gender, jobTitle, basicSalary, allowanceAmount]) =>
  insertTeacher.run(
    'faculty',
    name,
    jobTitle,
    '',
    randomPhoneNumber(),
    '',
    pickOne(ADDRESSES),
    toIsoDate(addDays(now, -randomInteger(200, 2000))),
    gender,
    '',
    basicSalary,
    allowanceAmount,
  ),
);

/* ------------------------------------------------------------------------------------------
 * Students (siblings share guardian + phone, so they get the same Family ID)
 * ---------------------------------------------------------------------------------------- */

const insertStudent = database.prepare(
  `INSERT INTO students (student_number, family_id, name, guardian_name, guardian_phone, class_name,
                         photo_data_url, guardian_relationship, date_of_birth, gender, address,
                         father_name, mother_name, father_occupation, mother_occupation, mother_phone,
                         guardian_email, blood_group, nationality, previous_school, admission_date,
                         emergency_phone, status)
   VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 'Bangladeshi', ?, ?, ?, ?)`,
);

const FAMILY_COUNT = 28;
/** Every student created: { id, className, status }. Used later for invoices and discipline. */
const createdStudents = [];
let studentCounter = 0;

for (let familyIndex = 0; familyIndex < FAMILY_COUNT; familyIndex++) {
  const familyId = `FAM-${String(familyIndex + 1).padStart(4, '0')}`;
  const familyName = FAMILY_NAMES[familyIndex % FAMILY_NAMES.length];
  const fatherName = `${pickOne(FATHER_FIRST_NAMES)} ${pickOne(['Abdul', 'Mostafa', 'Karim', 'Hasan', 'Jamal'])} ${familyName}`;
  const motherName = `${pickOne(MOTHER_FIRST_NAMES)} ${pickOne(['Begum', 'Khatun', 'Akter'])}`;
  const guardianPhone = randomPhoneNumber();
  const homeAddress = pickOne(ADDRESSES);
  const childCount = random() < 0.4 ? 2 : random() < 0.1 ? 3 : 1;

  for (let childIndex = 0; childIndex < childCount; childIndex++) {
    studentCounter++;
    const gender = random() < 0.55 ? 'male' : 'female';
    const className = pickOne(CLASS_NAMES);
    const ageInYears = TYPICAL_AGE_BY_CLASS[className] + random() * 1.5;
    const dateOfBirth = toIsoDate(addDays(now, -Math.round(ageInYears * 365)));
    const status = studentCounter % 17 === 0 ? 'inactive' : 'active';
    const studentNumber = `MMS-${currentYear}-${String(studentCounter).padStart(4, '0')}`;

    const studentId = insertStudent.run(
      studentNumber,
      familyId,
      `${pickOne(gender === 'male' ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES)} ${familyName}`,
      fatherName, // the father is the guardian
      guardianPhone,
      className,
      'Father',
      dateOfBirth,
      gender,
      homeAddress,
      fatherName,
      motherName,
      pickOne(FATHER_OCCUPATIONS),
      random() < 0.8 ? 'Homemaker' : 'Teacher',
      randomPhoneNumber(),
      pickOne(BLOOD_GROUPS),
      random() < 0.5
        ? ''
        : pickOne(['Al-Amin Kindergarten', 'Home schooled', 'Nurul Huda Madrasa']),
      toIsoDate(addDays(now, -randomInteger(30, 700))),
      randomPhoneNumber(),
      status,
    ).lastInsertRowid;

    createdStudents.push({ id: Number(studentId), className, status });
  }
}
const activeStudents = createdStudents.filter((student) => student.status === 'active');

/* ------------------------------------------------------------------------------------------
 * Fee types
 * ---------------------------------------------------------------------------------------- */

const insertFeeType = database.prepare(
  'INSERT INTO fee_types (label, fee_category, amount, class_name) VALUES (?, ?, ?, ?)',
);

/** class name -> { label, amount } of that class's monthly tuition fee. */
const tuitionFeeByClass = {};
CLASS_NAMES.forEach((className) => {
  const label = `Monthly tuition (${className})`;
  const amount = MONTHLY_TUITION_BY_CLASS[className];
  insertFeeType.run(label, 'student', amount, className);
  tuitionFeeByClass[className] = { label, amount };
});

const admissionFee = { label: 'Admission fee', amount: 2000 };
insertFeeType.run(admissionFee.label, 'enrollment', admissionFee.amount, '');
const examFee = { label: 'Half-yearly exam fee', amount: 300 };
insertFeeType.run(examFee.label, 'exam', examFee.amount, '');
const functionFee = { label: 'Annual function fee', amount: 200 };
insertFeeType.run(functionFee.label, 'other', functionFee.amount, '');
insertFeeType.run('Library fee', 'other', 100, '');

/* ------------------------------------------------------------------------------------------
 * Scholarships (about 1 in 7 active students)
 * ---------------------------------------------------------------------------------------- */

const insertScholarship = database.prepare(
  `INSERT INTO scholarships (student_id, name, discount_type, discount_value, applies_to_fee_type,
                             valid_from, valid_to, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

/** student id -> { isPercent, value }: the scholarship used when pricing that student's invoices. */
const scholarshipByStudentId = new Map();

activeStudents.forEach((student, index) => {
  if (index % 7 !== 0) return;
  const isPercent = index % 14 === 0;
  const name = isPercent
    ? pickOne(['Merit scholarship', 'Hifz excellence award'])
    : pickOne(['Zakat fund support', 'Orphan support']);
  const value = isPercent ? pickOne([25, 50, 100]) : pickOne([200, 300]);
  insertScholarship.run(
    student.id,
    name,
    isPercent ? 'percent' : 'amount',
    value,
    isPercent ? 'student' : 'all', // percentage awards apply to tuition only
    toIsoDate(addDays(now, -200)),
    toIsoDate(addDays(now, 160)),
    'active',
  );
  scholarshipByStudentId.set(student.id, { isPercent, value });
});

// One ended scholarship for variety.
insertScholarship.run(
  activeStudents[3].id,
  'Ramadan special aid',
  'percent',
  20,
  'all',
  toIsoDate(addDays(now, -400)),
  toIsoDate(addDays(now, -120)),
  'ended',
);

/* ------------------------------------------------------------------------------------------
 * Invoices and payments
 * ---------------------------------------------------------------------------------------- */

const insertInvoice = database.prepare(
  `INSERT INTO invoices (invoice_number, student_id, fee_label, total_amount, discount_amount, paid_amount, issued_on)
   VALUES (?, ?, ?, ?, ?, 0, ?)`,
);
const insertPayment = database.prepare(
  'INSERT INTO payments (invoice_id, amount, paid_at, received_by_username) VALUES (?, ?, ?, ?)',
);
let invoiceCounter = 0;

/**
 * Creates one invoice (with the scholarship discount applied) and, depending on
 * `paymentBehaviour`, one or two payments against it.
 *
 * @param {number} studentId
 * @param {{ label: string, amount: number }} fee
 * @param {string} issuedOn - "YYYY-MM-DD".
 * @param {string} feeCategory - 'student', 'enrollment', 'exam' or 'other'.
 * @param {'paid' | 'partial' | 'unpaid'} paymentBehaviour
 */
function createInvoice(studentId, fee, issuedOn, feeCategory, paymentBehaviour) {
  invoiceCounter++;

  // Percentage scholarships only reduce tuition ('student' fees); fixed amounts reduce any fee.
  const scholarship = scholarshipByStudentId.get(studentId);
  let discountAmount = 0;
  if (scholarship && (feeCategory === 'student' || !scholarship.isPercent)) {
    discountAmount = scholarship.isPercent
      ? (fee.amount * scholarship.value) / 100
      : Math.min(scholarship.value, fee.amount);
  }
  discountAmount = Math.round(Math.min(discountAmount, fee.amount) * 100) / 100;
  const totalAmount = fee.amount - discountAmount;

  const invoiceId = Number(
    insertInvoice.run(
      `INV-${String(invoiceCounter).padStart(5, '0')}`,
      studentId,
      fee.label,
      totalAmount,
      discountAmount,
      issuedOn,
    ).lastInsertRowid,
  );

  let paidAmount = 0;
  if (paymentBehaviour === 'paid') paidAmount = totalAmount;
  else if (paymentBehaviour === 'partial' && totalAmount > 0) {
    paidAmount = Math.round(totalAmount * pickOne([0.25, 0.5, 0.6]));
  }
  if (paidAmount <= 0) return;

  // Larger fully-paid invoices are sometimes paid in two instalments.
  const paidInTwoInstalments = totalAmount > 600 && paymentBehaviour === 'paid' && random() < 0.3;
  const firstInstalment = Math.round((paidAmount * 100) / (paidInTwoInstalments ? 2 : 1)) / 100;
  const instalments =
    firstInstalment < paidAmount
      ? [firstInstalment, Math.round((paidAmount - firstInstalment) * 100) / 100]
      : [paidAmount];

  instalments.forEach((instalmentAmount, instalmentIndex) => {
    const paymentDate = toIsoDate(
      addDays(new Date(issuedOn), randomInteger(1, 9) + instalmentIndex * 6),
    );
    const hour = String(randomInteger(9, 15)).padStart(2, '0');
    const minute = String(randomInteger(0, 59)).padStart(2, '0');
    insertPayment.run(
      invoiceId,
      instalmentAmount,
      `${paymentDate}T${hour}:${minute}:00.000Z`,
      'accounts',
    );
  });
  database
    .prepare('UPDATE invoices SET paid_amount = ROUND(?, 2) WHERE id = ?')
    .run(paidAmount, invoiceId);
}

// Monthly tuition: the three past months are mostly paid; the current month is mixed.
[-3, -2, -1, 0].forEach((monthOffset) => {
  const issuedOn = `${monthKey(monthOffset)}-01`;
  activeStudents.forEach((student) => {
    const roll = random();
    const isPastMonth = monthOffset < 0;
    const paymentBehaviour = isPastMonth
      ? roll < 0.9
        ? 'paid'
        : roll < 0.97
          ? 'partial'
          : 'unpaid'
      : roll < 0.5
        ? 'paid'
        : roll < 0.65
          ? 'partial'
          : 'unpaid';
    createInvoice(
      student.id,
      tuitionFeeByClass[student.className],
      issuedOn,
      'student',
      paymentBehaviour,
    );
  });
});

// Admission fee for every student; exam and function fees for active students.
createdStudents.forEach((student) =>
  createInvoice(
    student.id,
    admissionFee,
    toIsoDate(addDays(now, -randomInteger(60, 300))),
    'enrollment',
    'paid',
  ),
);
activeStudents.forEach((student) => {
  createInvoice(
    student.id,
    examFee,
    toIsoDate(addDays(now, -30)),
    'exam',
    random() < 0.75 ? 'paid' : 'unpaid',
  );
  createInvoice(
    student.id,
    functionFee,
    toIsoDate(addDays(now, -10)),
    'other',
    random() < 0.4 ? 'paid' : 'unpaid',
  );
});

/* ------------------------------------------------------------------------------------------
 * Payroll: the last 3 months are paid; the current month is generated but unpaid
 * ---------------------------------------------------------------------------------------- */

const insertPayrollLine = database.prepare(
  `INSERT INTO payroll (teacher_id, payroll_month, basic_salary, allowance_amount, deduction_amount, net_pay, paid_on)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);
const staffWithSalary = database
  .prepare("SELECT * FROM teachers WHERE status = 'active' AND basic_salary > 0")
  .all();

[-3, -2, -1, 0].forEach((monthOffset) => {
  const payrollMonth = monthKey(monthOffset);
  staffWithSalary.forEach((staffMember, index) => {
    const deductionAmount = index % 5 === 2 ? 500 : 0;
    const netPay = staffMember.basic_salary + staffMember.allowance_amount - deductionAmount;
    const paidOn = monthOffset < 0 ? `${payrollMonth}-28` : '';
    insertPayrollLine.run(
      staffMember.id,
      payrollMonth,
      staffMember.basic_salary,
      staffMember.allowance_amount,
      deductionAmount,
      netPay,
      paidOn,
    );
  });
});

/* ------------------------------------------------------------------------------------------
 * Timetable: Saturday to Wednesday, 4 periods a day.
 * The subject formula below guarantees no class, teacher or room is double-booked.
 * ---------------------------------------------------------------------------------------- */

const PERIOD_TIMES = [
  ['08:00', '08:45'],
  ['08:50', '09:35'],
  ['09:50', '10:35'],
  ['10:40', '11:25'],
];
const TEACHING_WEEKDAYS = ['sat', 'sun', 'mon', 'tue', 'wed'];

const insertSchedulePeriod = database.prepare(
  `INSERT INTO schedule (class_name, subject_name, teacher_id, room_name, weekday, start_time, end_time)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);

TEACHING_WEEKDAYS.forEach((weekday, weekdayIndex) =>
  PERIOD_TIMES.forEach(([startTime, endTime], periodIndex) =>
    CLASS_NAMES.forEach((className, classIndex) => {
      // A different subject for each class in the same time slot.
      const subjectIndex =
        (weekdayIndex * PERIOD_TIMES.length + periodIndex + classIndex) % SUBJECT_NAMES.length;
      const subjectName = SUBJECT_NAMES[subjectIndex];
      // The three oldest classes use the lab for science; everyone else stays in their classroom.
      const roomName =
        subjectName === 'Science' && classIndex >= 3
          ? 'Science Lab'
          : HOME_ROOM_BY_CLASS[className];
      insertSchedulePeriod.run(
        className,
        subjectName,
        teacherIdBySubject[subjectName],
        roomName,
        weekday,
        startTime,
        endTime,
      );
    }),
  ),
);

/* ------------------------------------------------------------------------------------------
 * School agenda
 * ---------------------------------------------------------------------------------------- */

const insertAgendaItem = database.prepare(
  'INSERT INTO agenda (title, event_date, event_time, category, notes) VALUES (?, ?, ?, ?, ?)',
);

// [title, days from today (negative = past), time, category, notes]
[
  ['Parents meeting', 5, '10:00', 'meeting', 'Progress discussion with guardians'],
  ['Half-yearly exam begins', 14, '09:00', 'exam', 'Reporting time 8:30 AM'],
  ['Milad and Dua gathering', 21, '11:00', 'event', ''],
  ['Staff meeting', 3, '13:30', 'meeting', 'Syllabus and timetable review'],
  ['Winter vacation starts', 45, '', 'holiday', ''],
  ['Annual sports day', 30, '08:30', 'event', 'Madrassa field'],
  ['Quran recitation competition', -12, '10:00', 'event', 'Completed'],
].forEach(([title, daysFromToday, time, category, notes]) =>
  insertAgendaItem.run(title, toIsoDate(addDays(now, daysFromToday)), time, category, notes),
);

/* ------------------------------------------------------------------------------------------
 * Disciplinary records
 * ---------------------------------------------------------------------------------------- */

const insertIncident = database.prepare(
  `INSERT INTO discipline (student_id, incident_date, incident_type, description, action_taken, status)
   VALUES (?, ?, ?, ?, ?, ?)`,
);

// [incident type, description, action taken, status, days from today]
[
  [
    'late',
    'Arrived late three days in a row',
    'Verbal warning, guardian informed',
    'resolved',
    -25,
  ],
  [
    'misconduct',
    'Quarrelled with a classmate during break',
    'Counselling by class teacher',
    'open',
    -6,
  ],
  ['absence', 'Absent for one week without notice', 'Guardian called to the office', 'open', -3],
  ['warning', 'Incomplete homework repeatedly', 'Written warning', 'resolved', -40],
  ['other', 'Damaged a classroom bench', 'Guardian agreed to pay repair cost', 'resolved', -18],
].forEach(([incidentType, description, actionTaken, status, daysFromToday], index) =>
  insertIncident.run(
    activeStudents[(index * 5 + 2) % activeStudents.length].id,
    toIsoDate(addDays(now, daysFromToday)),
    incidentType,
    description,
    actionTaken,
    status,
  ),
);

/* ------------------------------------------------------------------------------------------
 * Administrative records
 * ---------------------------------------------------------------------------------------- */

const insertRecord = database.prepare(
  'INSERT INTO records (reference_number, title, category, record_date, notes) VALUES (?, ?, ?, ?, ?)',
);

// [reference number, title, category, days from today, notes]
[
  ['CIR-2026-014', 'Circular: new uniform policy', 'circular', -70, 'Sent to all guardians'],
  [
    'MTG-2026-006',
    'Managing committee meeting minutes',
    'meeting',
    -35,
    'Budget approved for new classroom',
  ],
  ['CRT-2026-021', 'Certificate issued: Hifz completion', 'certificate', -20, ''],
  ['LGL-2026-003', 'Land lease renewal agreement', 'legal', -150, 'Valid for 5 years'],
  ['CIR-2026-019', 'Circular: Half-yearly exam routine', 'circular', -8, ''],
].forEach(([referenceNumber, title, category, daysFromToday, notes]) =>
  insertRecord.run(referenceNumber, title, category, toIsoDate(addDays(now, daysFromToday)), notes),
);

/* ------------------------------------------------------------------------------------------
 * Demo staff logins
 * ---------------------------------------------------------------------------------------- */

const upsertUser = database.prepare(
  `INSERT INTO users (username, password_hash, role, family_id) VALUES (?, ?, ?, ?)
   ON CONFLICT (username) DO UPDATE SET
     password_hash = excluded.password_hash, role = excluded.role, family_id = excluded.family_id`,
);
upsertUser.run('registrar', hashPassword('Demo-Pass-2026'), 'registrar', '');
upsertUser.run('accounts', hashPassword('Demo-Pass-2026'), 'accounts', '');
// A guardian account for the student portal: sees only the children of family FAM-0001.
upsertUser.run('guardian', hashPassword('Demo-Pass-2026'), 'student', 'FAM-0001');

database
  .prepare('INSERT INTO audit_log (created_at, username, action) VALUES (?, ?, ?)')
  .run(new Date().toISOString(), 'seed-demo', 'demo data generated');

/* ------------------------------------------------------------------------------------------
 * Summary
 * ---------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------
 * Copy the demo school from the temporary file to the real database
 * ---------------------------------------------------------------------------------------- */

if (shouldResetFirst) {
  await targetClient.batch(
    [
      'payments',
      'invoices',
      'discipline',
      'scholarships',
      'payroll',
      'schedule',
      'students',
      'teachers',
      'fee_types',
      'rooms',
      'agenda',
      'records',
      'classes',
      'subjects',
      'audit_log',
    ].map((tableName) => `DELETE FROM ${tableName}`),
    'write',
  );
}

const ROWS_PER_BATCH = 100;
for (const tableName of BACKUP_TABLE_ORDER) {
  const rows = database.prepare(`SELECT * FROM ${tableName}`).all();
  // Users are matched by username (their ids may differ); audit rows just get new ids.
  const skipId = tableName === 'users' || tableName === 'audit_log';
  const statements = rows.map((row) => {
    const columnNames = Object.keys(row).filter((columnName) => !(skipId && columnName === 'id'));
    const insertSql = `INSERT OR REPLACE INTO ${tableName} (${columnNames.join(', ')})
                       VALUES (${columnNames.map(() => '?').join(', ')})`;
    return {
      sql:
        tableName === 'users'
          ? `INSERT INTO users (${columnNames.join(', ')}) VALUES (${columnNames.map(() => '?').join(', ')})
             ON CONFLICT (username) DO UPDATE SET
               password_hash = excluded.password_hash, role = excluded.role, family_id = excluded.family_id`
          : insertSql,
      args: columnNames.map((columnName) => row[columnName]),
    };
  });
  for (let start = 0; start < statements.length; start += ROWS_PER_BATCH) {
    await targetClient.batch(statements.slice(start, start + ROWS_PER_BATCH), 'write');
  }
}

database.close();
for (const suffix of ['', '-wal', '-shm', '-journal']) fs.rmSync(temporaryFile + suffix, { force: true });

const countRows = async (tableName) =>
  (await queryOne(`SELECT COUNT(*) AS rowCount FROM ${tableName}`)).rowCount;

console.log('Demo data ready:');
for (const tableName of [
  'students',
  'teachers',
  'fee_types',
  'invoices',
  'payments',
  'scholarships',
  'payroll',
  'schedule',
  'rooms',
  'agenda',
  'discipline',
  'records',
]) {
  console.log(`  ${tableName.padEnd(13)} ${await countRows(tableName)}`);
}
console.log(
  'Logins: registrar / accounts  (password Demo-Pass-2026). Admin is your existing admin user.',
);
process.exit(0); // the database connection would otherwise keep the process open
