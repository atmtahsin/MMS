'use client';

import { useState } from 'react';
import { shrinkImageToDataUrl } from '../../../helpers/files';
import { useAppContext } from '../../AppContext';
import { Avatar } from '../../ui/Avatar';
import { FormActions } from '../../ui/FormActions';
import { FormField } from '../../ui/FormField';
import { ModalDialog } from '../../ui/ModalDialog';

/** Blood groups offered in the dropdown. */
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** Statuses a student can have. */
const STUDENT_STATUSES = ['active', 'inactive', 'graduated'];

/** What the form holds when adding a new student: every field empty, status "active". */
export const BLANK_STUDENT_FORM = {
  name: '',
  class_name: '',
  gender: '',
  date_of_birth: '',
  blood_group: '',
  nationality: '',
  admission_date: '',
  previous_school: '',
  status: 'active',
  address: '',
  photo_data_url: '',
  father_name: '',
  father_occupation: '',
  mother_name: '',
  mother_occupation: '',
  mother_phone: '',
  guardian_name: '',
  guardian_relationship: '',
  guardian_phone: '',
  emergency_phone: '',
  guardian_email: '',
};

/**
 * The add / edit student form, shown in a dialog.
 *
 * @param {object} props
 * @param {object} props.initialStudent - The student to edit, or BLANK_STUDENT_FORM to add a new one.
 *   A student that has an `id` is updated; one without is created.
 * @param {() => void} props.onClose - Closes the dialog (after saving or cancelling).
 */
export function StudentFormDialog({ initialStudent, onClose }) {
  const { translate, submitToServer, showErrorToast, schoolData } = useAppContext();

  // The values currently typed into the form.
  const [formValues, setFormValues] = useState(initialStudent);
  const isEditingExistingStudent = Boolean(formValues.id);

  /** Props that connect an <input> to one field of the form: its value and how to update it. */
  const bindField = (fieldName) => ({
    value: formValues[fieldName] ?? '',
    onChange: (changeEvent) =>
      setFormValues({ ...formValues, [fieldName]: changeEvent.target.value }),
  });

  /** Shrinks the chosen photo and stores it in the form; shows a message if it is not an image. */
  async function handlePhotoChosen(changeEvent) {
    const chosenFile = changeEvent.target.files[0];
    if (!chosenFile) return;
    try {
      setFormValues({ ...formValues, photo_data_url: await shrinkImageToDataUrl(chosenFile) });
    } catch {
      showErrorToast(translate('students.photoReadError'));
    }
  }

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    submitToServer(isEditingExistingStudent ? 'students/update' : 'students', formValues, onClose);
  }

  return (
    <ModalDialog
      isWide
      title={
        isEditingExistingStudent ? translate('students.editTitle') : translate('students.addTitle')
      }
      closeButtonLabel={translate('common.close')}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-section-title">{translate('students.sectionStudent')}</div>
        <div className="form-grid">
          <FormField label={translate('field.full_name')}>
            <input required {...bindField('name')} />
          </FormField>
          <FormField label={translate('field.class_name')}>
            {/* A text box with suggestions: pick an existing class or type a new one. */}
            <input required list="class-name-suggestions" {...bindField('class_name')} />
            <datalist id="class-name-suggestions">
              {schoolData.classNames.map((className) => (
                <option key={className} value={className} />
              ))}
            </datalist>
          </FormField>
          <FormField label={translate('field.gender')}>
            <select {...bindField('gender')}>
              <option value="" />
              <option value="male">{translate('option.male')}</option>
              <option value="female">{translate('option.female')}</option>
            </select>
          </FormField>
          <FormField label={translate('field.date_of_birth')}>
            <input type="date" {...bindField('date_of_birth')} />
          </FormField>
          <FormField label={translate('field.blood_group')}>
            <select {...bindField('blood_group')}>
              <option value="" />
              {BLOOD_GROUPS.map((bloodGroup) => (
                <option key={bloodGroup}>{bloodGroup}</option>
              ))}
            </select>
          </FormField>
          <FormField label={translate('field.nationality')}>
            <input {...bindField('nationality')} />
          </FormField>
          <FormField label={translate('field.admission_date')}>
            <input type="date" {...bindField('admission_date')} />
          </FormField>
          <FormField label={translate('field.previous_school')}>
            <input {...bindField('previous_school')} />
          </FormField>
          <FormField label={translate('field.status')}>
            <select {...bindField('status')}>
              {STUDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {translate(`option.${status}`)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={translate('field.photo')}>
            <span className="photo-upload">
              <Avatar name={formValues.name} photoDataUrl={formValues.photo_data_url} />
              <input type="file" accept="image/*" onChange={handlePhotoChosen} />
            </span>
          </FormField>
          <FormField label={translate('field.address')} spansFullWidth>
            <input {...bindField('address')} />
          </FormField>
        </div>

        <div className="form-section-title">{translate('students.sectionParents')}</div>
        <div className="form-grid">
          <FormField label={translate('field.father_name')}>
            <input {...bindField('father_name')} />
          </FormField>
          <FormField label={translate('field.father_occupation')}>
            <input {...bindField('father_occupation')} />
          </FormField>
          <FormField label={translate('field.mother_name')}>
            <input {...bindField('mother_name')} />
          </FormField>
          <FormField label={translate('field.mother_occupation')}>
            <input {...bindField('mother_occupation')} />
          </FormField>
          <FormField label={translate('field.mother_phone')}>
            <input inputMode="tel" {...bindField('mother_phone')} />
          </FormField>
        </div>

        <div className="form-section-title">{translate('students.sectionGuardian')}</div>
        <div className="form-grid">
          <FormField label={translate('field.guardian_name')}>
            <input required {...bindField('guardian_name')} />
          </FormField>
          <FormField label={translate('field.guardian_relationship')}>
            <input {...bindField('guardian_relationship')} />
          </FormField>
          <FormField label={translate('field.phone')}>
            <input required inputMode="tel" {...bindField('guardian_phone')} />
          </FormField>
          <FormField label={translate('field.emergency_phone')}>
            <input inputMode="tel" {...bindField('emergency_phone')} />
          </FormField>
          <FormField label={translate('field.email')}>
            <input type="email" {...bindField('guardian_email')} />
          </FormField>
        </div>

        <p className="hint-text">{translate('students.familyHint')}</p>
        <FormActions onCancel={onClose} />
      </form>
    </ModalDialog>
  );
}
