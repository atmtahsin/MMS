'use client';

import { useState } from 'react';
import { SIMPLE_RECORD_TYPES, sortRecordsForDisplay } from '../../../lib/record-types';
import { useAppContext } from '../AppContext';
import { Icon } from '../ui/Icon';
import { ModalDialog } from '../ui/ModalDialog';
import { ResponsiveTable } from '../ui/ResponsiveTable';
import { FormActions } from '../ui/FormActions';
import { SimpleRecordFormField } from './SimpleRecordFormField';
import { renderRecordCell } from './renderRecordCell';

/**
 * Builds an empty record for a type: dropdowns that have fixed choices start on their first
 * choice, everything else starts empty.
 */
function createBlankRecord(recordTypeName) {
  return Object.fromEntries(
    SIMPLE_RECORD_TYPES[recordTypeName].fields.map((field) => [
      field.name,
      field.type === 'choice' ? field.choices[0] : '',
    ]),
  );
}

/**
 * A card with a searchable table and add / edit / delete for one "simple record" type
 * (rooms, class schedule, agenda, discipline, scholarships, administrative records).
 * The table columns and the form are built from SIMPLE_RECORD_TYPES in lib/record-types.js.
 *
 * @param {object} props
 * @param {string} props.recordTypeName - Which type: 'rooms', 'schedule', 'agenda', 'discipline', 'scholarships' or 'records'.
 * @param {object[]} props.rows - The records to list.
 * @param {import('react').ReactNode} [props.extraToolbarControls] - Extra controls shown beside the search box (e.g. a class filter).
 * @param {string} [props.title] - Overrides the default card title for this record type.
 */
export function SimpleRecordPanel({ recordTypeName, rows, extraToolbarControls, title }) {
  const appContext = useAppContext();
  const { translate, canEdit, submitToServer } = appContext;

  const recordTypeDefinition = SIMPLE_RECORD_TYPES[recordTypeName];
  const userMayEdit = canEdit(recordTypeName);
  const panelTitle = title || translate(`recordType.${recordTypeName}`);

  // The record in the open form, or null when the form is closed. Has an `id` when editing.
  const [recordBeingEdited, setRecordBeingEdited] = useState(null);
  // The text typed in the search box.
  const [searchText, setSearchText] = useState('');

  const visibleRows = sortRecordsForDisplay(recordTypeName, rows).filter((row) =>
    JSON.stringify(Object.values(row)).toLowerCase().includes(searchText.toLowerCase()),
  );

  const tableColumns = recordTypeDefinition.tableColumns.map((columnName) => {
    const fieldDefinition = recordTypeDefinition.fields.find((field) => field.name === columnName);
    return {
      heading: translate(`field.${columnName}`),
      renderCell: (row) => renderRecordCell(recordTypeName, fieldDefinition, row, appContext),
    };
  });

  if (userMayEdit) {
    tableColumns.push({
      heading: '',
      isActionColumn: true,
      renderCell: (row) => (
        <div className="table-actions">
          <button
            className="button button--secondary button--small"
            onClick={() => setRecordBeingEdited({ ...createBlankRecord(recordTypeName), ...row })}
          >
            {translate('common.edit')}
          </button>
          <button
            className="button button--secondary button--small button--danger"
            onClick={() =>
              window.confirm(translate('common.confirmDelete')) &&
              submitToServer(`simple-records/${recordTypeName}/delete`, { id: row.id })
            }
          >
            {translate('common.delete')}
          </button>
        </div>
      ),
    });
  }

  function handleFormSubmit(submitEvent) {
    submitEvent.preventDefault();
    submitToServer(`simple-records/${recordTypeName}`, recordBeingEdited, () =>
      setRecordBeingEdited(null),
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>{panelTitle}</h2>
        <div className="toolbar">
          <input
            placeholder={translate('common.search')}
            aria-label={translate('common.search')}
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
          />
          {extraToolbarControls}
          {userMayEdit && (
            <button
              className="button"
              onClick={() => setRecordBeingEdited(createBlankRecord(recordTypeName))}
            >
              <Icon name="add" size={16} />
              {translate('common.add')}
            </button>
          )}
        </div>
      </div>

      <ResponsiveTable
        columns={tableColumns}
        rows={visibleRows}
        emptyMessage={translate('common.emptyState')}
      />

      {recordBeingEdited && (
        <ModalDialog
          title={`${translate(recordBeingEdited.id ? 'common.edit' : 'common.add')} · ${panelTitle}`}
          closeButtonLabel={translate('common.close')}
          onClose={() => setRecordBeingEdited(null)}
        >
          <form onSubmit={handleFormSubmit}>
            <div className="form-grid">
              {recordTypeDefinition.fields.map((fieldDefinition) => (
                <SimpleRecordFormField
                  key={fieldDefinition.name}
                  fieldDefinition={fieldDefinition}
                  formValues={recordBeingEdited}
                  onFormValuesChange={setRecordBeingEdited}
                />
              ))}
            </div>
            <FormActions onCancel={() => setRecordBeingEdited(null)} />
          </form>
        </ModalDialog>
      )}
    </div>
  );
}
