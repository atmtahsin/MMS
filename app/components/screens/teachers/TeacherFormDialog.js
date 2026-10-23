'use client';

import { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { FormActions } from '../../ui/FormActions';
import { FormField } from '../../ui/FormField';
import { ModalDialog } from '../../ui/ModalDialog';

/** What the form holds when adding a new staff member. */
export const BLANK_TEACHER_FORM = {
  kind: 'teacher',
  name: '',
  job_title: '',
  gender: '',
  qualification: '',
  subjects_taught: '',
  phone: '',
  email: '',
  address: '',
  joining_date: '',
  status: 'active',
};

/**
 * The add / edit form for a teacher or a faculty (non-teaching) member, shown in a dialog.
 * Salaries are not edited here; they live on the HR & Payroll screen.
 *
 * @param {object} props
 * @param {object} props.initialTeacher - The person to edit, or BLANK_TEACHER_FORM to add one.
 *   A person that has an `id` is updated; one without is created.
 * @param {() => void} props.onClose - Closes the dialog (after saving or cancelling).
 */
export function TeacherFormDialog({ initialTeacher, onClose }) {
  const { translate, submitToServer } = useAppContext();

  // The values currently typed into the form.
  const [formValues, setFormValues] = useState(initialTeacher);
  const isEditingExistingPerson = Boolean(formValues.id);

  /** Props that connect an <input> to one field of the form: its value and how to update it. */
  const bindField = (fieldName) => ({
    value: formValues[fieldName] ?? '',
    onChange: (changeEvent) =>
      setFormValues({ ...formValues, [fieldName]: changeEvent.target.value }),
  });

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    submitToServer(isEditingExistingPerson ? 'teachers/update' : 'teachers', formValues, onClose);
  }

  return (
    <ModalDialog
      title={isEditingExistingPerson ? translate('common.edit') : translate('common.add')}
      closeButtonLabel={translate('common.close')}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <FormField label={translate('field.type')}>
            <select {...bindField('kind')}>
              <option value="teacher">{translate('option.teacher')}</option>
              <option value="faculty">{translate('option.faculty')}</option>
            </select>
          </FormField>
          <FormField label={translate('field.full_name')}>
            <input required {...bindField('name')} />
          </FormField>
          <FormField label={translate('field.job_title')}>
            <input required {...bindField('job_title')} />
          </FormField>
          <FormField label={translate('field.gender')}>
            <select {...bindField('gender')}>
              <option value="" />
              <option value="male">{translate('option.male')}</option>
              <option value="female">{translate('option.female')}</option>
            </select>
          </FormField>
          <FormField label={translate('field.qualification')}>
            <input {...bindField('qualification')} />
          </FormField>
          <FormField label={translate('field.subjects_taught')}>
            <input {...bindField('subjects_taught')} />
          </FormField>
          <FormField label={translate('field.phone')}>
            <input inputMode="tel" {...bindField('phone')} />
          </FormField>
          <FormField label={translate('field.email')}>
            <input type="email" {...bindField('email')} />
          </FormField>
          <FormField label={translate('field.joining_date')}>
            <input type="date" {...bindField('joining_date')} />
          </FormField>
          <FormField label={translate('field.status')}>
            <select {...bindField('status')}>
              <option value="active">{translate('option.active')}</option>
              <option value="inactive">{translate('option.inactive')}</option>
            </select>
          </FormField>
          <FormField label={translate('field.address')} spansFullWidth>
            <input {...bindField('address')} />
          </FormField>
        </div>
        <FormActions onCancel={onClose} />
      </form>
    </ModalDialog>
  );
}
