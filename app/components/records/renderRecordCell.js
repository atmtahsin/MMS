import { StatusBadge } from '../ui/StatusBadge';

/** Badge colour for each choice value. Values not listed here get the neutral grey badge. */
const BADGE_TONE_BY_VALUE = {
  resolved: 'success',
  active: 'success',
  open: 'warning',
  ended: 'neutral',
  holiday: 'warning',
  exam: 'danger',
};

/**
 * What to show in a table cell for one field of a record: names instead of ids,
 * badges for choices, formatted dates and amounts.
 *
 * @param {string} recordTypeName - e.g. 'scholarships'.
 * @param {{ name: string, type: string }} fieldDefinition - The field being shown.
 * @param {object} record - The row of data.
 * @param {object} appContext - The value of useAppContext() (translate, formatters, school data).
 * @returns {import('react').ReactNode}
 */
export function renderRecordCell(recordTypeName, fieldDefinition, record, appContext) {
  const { translate, formatMoney, formatDate, schoolData } = appContext;
  const value = record[fieldDefinition.name];

  switch (fieldDefinition.type) {
    case 'studentId': {
      const student = schoolData.students.find((candidate) => candidate.id === value);
      return student ? `${student.name} (${student.student_number})` : '';
    }
    case 'teacherId':
      return schoolData.staffNames.find((candidate) => candidate.id === value)?.name || '';
    case 'choice':
      return (
        <StatusBadge tone={BADGE_TONE_BY_VALUE[value] ?? 'neutral'}>
          {translate(`option.${value}`)}
        </StatusBadge>
      );
    case 'date':
      return value ? formatDate(value) : '';
    default:
      // A scholarship's value is either a percentage or a fixed amount of money.
      if (recordTypeName === 'scholarships' && fieldDefinition.name === 'discount_value') {
        return record.discount_type === 'percent' ? `${value}%` : formatMoney(value);
      }
      return value;
  }
}
