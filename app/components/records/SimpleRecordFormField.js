'use client';

import { FormField } from '../ui/FormField';
import { useAppContext } from '../AppContext';

/**
 * One form control for one field of a "simple record" (see lib/record-types.js).
 * The kind of control is chosen from the field's `type`: text box, number box, date picker,
 * dropdown of fixed choices, dropdown of students / teachers / classes / subjects / rooms, ...
 *
 * @param {object} props
 * @param {{ name: string, type: string, required?: boolean, maxLength?: number, choices?: string[] }} props.fieldDefinition
 *   The field as defined in SIMPLE_RECORD_TYPES.
 * @param {object} props.formValues - The record being edited (field name -> current value).
 * @param {(newFormValues: object) => void} props.onFormValuesChange - Receives the updated record.
 */
export function SimpleRecordFormField({ fieldDefinition, formValues, onFormValuesChange }) {
  const { translate, schoolData } = useAppContext();
  const { students, staffNames, classNames, subjectNames, rooms } = schoolData;
  const { name, type, required = false, maxLength, choices } = fieldDefinition;

  // Props shared by every control: show the current value and write changes back into the record.
  const sharedControlProps = {
    value: formValues[name] ?? '',
    onChange: (changeEvent) =>
      onFormValuesChange({ ...formValues, [name]: changeEvent.target.value }),
  };

  /**
   * If the record already holds a value that is no longer in the list (e.g. a class that was
   * deleted), keep it as an option so editing the record does not silently clear it.
   */
  const withCurrentValue = (listOfNames) =>
    formValues[name] && !listOfNames.includes(formValues[name])
      ? [formValues[name], ...listOfNames]
      : listOfNames;

  /** Turns a list of plain names into <option> elements. */
  const optionsFromNames = (listOfNames) =>
    withCurrentValue(listOfNames).map((itemName) => (
      <option key={itemName} value={itemName}>
        {itemName}
      </option>
    ));

  let control;
  switch (type) {
    case 'textarea':
      control = <textarea {...sharedControlProps} />;
      break;
    case 'decimal':
      control = (
        <input type="number" min="0" step="0.01" required={required} {...sharedControlProps} />
      );
      break;
    case 'integer':
      control = <input type="number" min="0" step="1" {...sharedControlProps} />;
      break;
    case 'date':
      control = <input type="date" required={required} {...sharedControlProps} />;
      break;
    case 'time':
      control = <input type="time" required={required} {...sharedControlProps} />;
      break;
    case 'choice':
      control = (
        <select {...sharedControlProps}>
          {choices.map((choice) => (
            <option key={choice} value={choice}>
              {translate(`option.${choice}`)}
            </option>
          ))}
        </select>
      );
      break;
    case 'studentId':
      control = (
        <select required={required} {...sharedControlProps}>
          <option value="" />
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.student_number} · {student.name}
            </option>
          ))}
        </select>
      );
      break;
    case 'teacherId':
      control = (
        <select {...sharedControlProps}>
          <option value="" />
          {staffNames.map((staffMember) => (
            <option key={staffMember.id} value={staffMember.id}>
              {staffMember.name}
            </option>
          ))}
        </select>
      );
      break;
    case 'className':
      control = (
        <select required={required} {...sharedControlProps}>
          <option value="" />
          {optionsFromNames(classNames)}
        </select>
      );
      break;
    case 'subjectName':
      control = (
        <select required={required} {...sharedControlProps}>
          <option value="" />
          {optionsFromNames(subjectNames)}
        </select>
      );
      break;
    case 'roomName':
      control = (
        <select {...sharedControlProps}>
          <option value="" />
          {optionsFromNames(rooms.map((room) => room.name))}
        </select>
      );
      break;
    default: // plain text
      control = <input required={required} maxLength={maxLength || 200} {...sharedControlProps} />;
  }

  return (
    <FormField label={translate(`field.${name}`)} spansFullWidth={type === 'textarea'}>
      {control}
    </FormField>
  );
}
