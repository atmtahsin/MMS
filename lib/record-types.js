// Definitions of the "simple record" types: rooms, class schedule, agenda, discipline, scholarships
// and administrative records. They all work the same way, so one definition per type is enough:
// the server validates with it and the browser builds the table and form from it.
//
// Field types:
//   text, textarea, integer, decimal, date, time,
//   choice                         (a fixed list of `choices`)
//   studentId, teacherId           (a link to a student / teacher)
//   className, subjectName, roomName  (pick from the lists configured in the system)

// The school week starts on Saturday.
export const WEEKDAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];

export const SIMPLE_RECORD_TYPES = {
  rooms: {
    fields: [
      { name: 'name', type: 'text', required: true, maxLength: 50 },
      { name: 'capacity', type: 'integer' },
      {
        name: 'room_type',
        type: 'choice',
        choices: ['classroom', 'lab', 'hall', 'library', 'office', 'other'],
      },
      { name: 'notes', type: 'textarea', maxLength: 500 },
    ],
    tableColumns: ['name', 'capacity', 'room_type', 'notes'],
  },

  schedule: {
    fields: [
      { name: 'class_name', type: 'className', required: true },
      { name: 'subject_name', type: 'subjectName', required: true },
      { name: 'teacher_id', type: 'teacherId' },
      { name: 'room_name', type: 'roomName' },
      { name: 'weekday', type: 'choice', required: true, choices: WEEKDAYS },
      { name: 'start_time', type: 'time', required: true },
      { name: 'end_time', type: 'time', required: true },
    ],
    tableColumns: [
      'weekday',
      'start_time',
      'end_time',
      'class_name',
      'subject_name',
      'teacher_id',
      'room_name',
    ],
  },

  agenda: {
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'event_date', type: 'date', required: true },
      { name: 'event_time', type: 'time' },
      {
        name: 'category',
        type: 'choice',
        choices: ['event', 'exam', 'holiday', 'meeting', 'other'],
      },
      { name: 'notes', type: 'textarea' },
    ],
    tableColumns: ['event_date', 'event_time', 'title', 'category'],
  },

  discipline: {
    fields: [
      { name: 'student_id', type: 'studentId', required: true },
      { name: 'incident_date', type: 'date', required: true },
      {
        name: 'incident_type',
        type: 'choice',
        choices: ['warning', 'misconduct', 'absence', 'late', 'other'],
      },
      { name: 'description', type: 'textarea', required: true },
      { name: 'action_taken', type: 'text' },
      { name: 'status', type: 'choice', choices: ['open', 'resolved'] },
    ],
    tableColumns: [
      'incident_date',
      'student_id',
      'incident_type',
      'description',
      'action_taken',
      'status',
    ],
  },

  scholarships: {
    fields: [
      { name: 'student_id', type: 'studentId', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'discount_type', type: 'choice', choices: ['percent', 'amount'] },
      { name: 'discount_value', type: 'decimal', required: true },
      {
        name: 'applies_to_fee_type',
        type: 'choice',
        choices: ['all', 'student', 'enrollment', 'exam', 'other'],
      },
      { name: 'valid_from', type: 'date' },
      { name: 'valid_to', type: 'date' },
      { name: 'status', type: 'choice', choices: ['active', 'ended'] },
    ],
    tableColumns: [
      'student_id',
      'name',
      'discount_type',
      'discount_value',
      'applies_to_fee_type',
      'valid_to',
      'status',
    ],
  },

  records: {
    fields: [
      { name: 'reference_number', type: 'text', maxLength: 50 },
      { name: 'title', type: 'text', required: true },
      {
        name: 'category',
        type: 'choice',
        choices: ['circular', 'certificate', 'meeting', 'legal', 'other'],
      },
      { name: 'record_date', type: 'date', required: true },
      { name: 'notes', type: 'textarea' },
    ],
    tableColumns: ['reference_number', 'record_date', 'title', 'category'],
  },
};

// The order in which each record type is listed on screen.
export function sortRecordsForDisplay(recordTypeName, rows) {
  const sortedRows = [...rows];
  switch (recordTypeName) {
    case 'schedule': // by weekday, then start time
      return sortedRows.sort(
        (a, b) =>
          WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) ||
          a.start_time.localeCompare(b.start_time),
      );
    case 'agenda': // soonest first
      return sortedRows.sort((a, b) =>
        (a.event_date + a.event_time).localeCompare(b.event_date + b.event_time),
      );
    case 'rooms': // alphabetical
      return sortedRows.sort((a, b) => a.name.localeCompare(b.name));
    default: // newest first
      return sortedRows.sort((a, b) => b.id - a.id);
  }
}
