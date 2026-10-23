'use client';

import { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { FormActions } from '../../ui/FormActions';
import { FormField } from '../../ui/FormField';
import { ModalDialog } from '../../ui/ModalDialog';

/** The kinds of fee a fee type can belong to. */
const FEE_CATEGORIES = ['student', 'enrollment', 'exam', 'other'];

/** What the form holds when adding a new fee type. */
export const BLANK_FEE_TYPE_FORM = {
  label: '',
  fee_category: 'student',
  amount: '',
  class_name: '',
};

/**
 * The add / edit form for a fee type (e.g. "Monthly tuition", 500), shown in a dialog.
 *
 * @param {object} props
 * @param {object} props.initialFeeType - The fee type to edit, or BLANK_FEE_TYPE_FORM to add one.
 *   A fee type that has an `id` is updated; one without is created.
 * @param {() => void} props.onClose - Closes the dialog (after saving or cancelling).
 */
export function FeeTypeFormDialog({ initialFeeType, onClose }) {
  const { translate, submitToServer, schoolData } = useAppContext();

  // The values currently typed into the form.
  const [formValues, setFormValues] = useState(initialFeeType);
  const isEditingExistingFeeType = Boolean(formValues.id);

  /** Props that connect an <input> to one field of the form: its value and how to update it. */
  const bindField = (fieldName) => ({
    value: formValues[fieldName] ?? '',
    onChange: (changeEvent) =>
      setFormValues({ ...formValues, [fieldName]: changeEvent.target.value }),
  });

  function handleSubmit(submitEvent) {
    submitEvent.preventDefault();
    submitToServer(
      isEditingExistingFeeType ? 'fee-types/update' : 'fee-types',
      { ...formValues, amount: Number(formValues.amount) },
      onClose,
    );
  }

  return (
    <ModalDialog
      title={isEditingExistingFeeType ? translate('common.edit') : translate('common.add')}
      closeButtonLabel={translate('common.close')}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <FormField label={translate('field.fee_label')}>
            <input required {...bindField('label')} />
          </FormField>
          <FormField label={translate('field.fee_category')}>
            <select {...bindField('fee_category')}>
              {FEE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {translate(`option.${category}`)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={translate('field.amount')}>
            <input required type="number" min="0" step="0.01" {...bindField('amount')} />
          </FormField>
          <FormField label={translate('accounting.classOptional')}>
            <select {...bindField('class_name')}>
              <option value="" />
              {schoolData.classNames.map((className) => (
                <option key={className}>{className}</option>
              ))}
            </select>
          </FormField>
        </div>
        <FormActions onCancel={onClose} />
      </form>
    </ModalDialog>
  );
}
