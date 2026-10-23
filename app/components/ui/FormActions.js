'use client';

import { useAppContext } from '../AppContext';

/**
 * The Save + Cancel buttons at the bottom of a form.
 *
 * @param {object} props
 * @param {() => void} props.onCancel - Called when Cancel is pressed (usually closes the form).
 */
export function FormActions({ onCancel }) {
  const { translate } = useAppContext();
  return (
    <div className="button-row form-actions">
      <button className="button">{translate('common.save')}</button>
      <button type="button" className="button button--secondary" onClick={onCancel}>
        {translate('common.cancel')}
      </button>
    </div>
  );
}
