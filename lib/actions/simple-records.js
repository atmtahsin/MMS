// Saving and deleting the "simple record" types (rooms, schedule, agenda, discipline,
// scholarships, administrative records). Their fields are described in lib/record-types.js.
import { execute, queryOne, recordAudit } from '../database.mjs';
import { AppError } from '../app-error.js';
import { SIMPLE_RECORD_TYPES } from '../record-types.js';
import { requireText, optionalText, toMoneyAmount } from '../validation.js';
import { deleteRowById } from './shared.js';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/; // 2026-03-31
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/; // 08:30

const DEFAULT_TEXT_MAX_LENGTH = 200;
const DEFAULT_TEXTAREA_MAX_LENGTH = 1000;

const invalidField = (field) => new AppError(`Missing or invalid field: ${field.name}`);

// Checks one submitted value against its field definition and returns the cleaned value.
function readFieldValue(field, rawValue) {
  const value = rawValue === undefined || rawValue === null ? '' : rawValue;
  const isEmpty = value === '';
  if (isEmpty && field.required) throw invalidField(field);

  switch (field.type) {
    case 'decimal':
      return toMoneyAmount(isEmpty ? 0 : value);

    case 'integer': {
      const number = Math.round(Number(isEmpty ? 0 : value));
      if (!Number.isFinite(number) || number < 0) throw invalidField(field);
      return number;
    }

    case 'studentId':
    case 'teacherId': {
      if (isEmpty) return null; // an empty link is stored as NULL
      const id = Number(value);
      if (!Number.isInteger(id) || id <= 0) throw invalidField(field);
      return id;
    }

    case 'choice':
      if (!field.choices.includes(value)) {
        if (field.required) throw invalidField(field);
        return field.choices[0]; // fall back to the first choice
      }
      return value;

    case 'date':
      if (!isEmpty && !ISO_DATE_PATTERN.test(value)) throw invalidField(field);
      return value;

    case 'time':
      if (!isEmpty && !TIME_PATTERN.test(value)) throw invalidField(field);
      return value;

    default: {
      // text, textarea, className, subjectName, roomName
      const maxLength =
        field.maxLength ||
        (field.type === 'textarea' ? DEFAULT_TEXTAREA_MAX_LENGTH : DEFAULT_TEXT_MAX_LENGTH);
      return field.required ? requireText(value, maxLength) : optionalText(value, maxLength);
    }
  }
}

// Extra business rules for particular record types. Throw an AppError to refuse the save.
const EXTRA_VALIDATION_BY_RECORD_TYPE = {
  // A period may not overlap another period of the same class, teacher or room on the same day.
  async schedule(period, periodId) {
    if (period.end_time <= period.start_time) {
      throw new AppError('End time must be after start time');
    }
    const clashingPeriod = await queryOne(
      `SELECT class_name, teacher_id, room_name
         FROM schedule
        WHERE weekday = ? AND start_time < ? AND end_time > ? AND id != ?
          AND (class_name = ?
               OR (? IS NOT NULL AND teacher_id = ?)
               OR (? != '' AND room_name = ?))`,
      [
        period.weekday,
        period.end_time,
        period.start_time,
        periodId,
        period.class_name,
        period.teacher_id,
        period.teacher_id,
        period.room_name,
        period.room_name,
      ],
    );
    if (!clashingPeriod) return;

    if (clashingPeriod.class_name === period.class_name) {
      throw new AppError('Schedule conflict: class');
    }
    if (period.teacher_id && clashingPeriod.teacher_id === period.teacher_id) {
      throw new AppError('Schedule conflict: teacher');
    }
    throw new AppError('Schedule conflict: room');
  },

  scholarships(scholarship) {
    if (scholarship.discount_type === 'percent' && scholarship.discount_value > 100) {
      throw new AppError('Percentage cannot exceed 100');
    }
  },
};

// Creates a new record, or updates an existing one when `input.id` is set.
export async function saveSimpleRecord(recordTypeName, input, user) {
  const recordType = SIMPLE_RECORD_TYPES[recordTypeName];
  const record = Object.fromEntries(
    recordType.fields.map((field) => [field.name, readFieldValue(field, input[field.name])]),
  );
  const existingId = Number(input.id) || 0;
  await EXTRA_VALIDATION_BY_RECORD_TYPE[recordTypeName]?.(record, existingId);

  const columns = recordType.fields.map((field) => field.name);
  const values = columns.map((columnName) => record[columnName]);

  try {
    if (existingId) {
      const result = await execute(
        `UPDATE ${recordTypeName} SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...values, existingId],
      );
      if (!result.changes) throw new AppError('Not found', 404);
    } else {
      await execute(
        `INSERT INTO ${recordTypeName} (${columns.join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})`,
        values,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (String(error.code).startsWith('SQLITE_CONSTRAINT') || /constraint/i.test(String(error.message))) {
      throw new AppError('Already exists');
    }
    throw error;
  }
  await recordAudit(user, `${recordTypeName} ${existingId ? 'updated' : 'added'}`);
}

export async function deleteSimpleRecord(recordTypeName, input, user) {
  await deleteRowById(recordTypeName, input.id, recordTypeName, user);
}
