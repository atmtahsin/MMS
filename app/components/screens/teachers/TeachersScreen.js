'use client';

import { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { Icon } from '../../ui/Icon';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { BLANK_TEACHER_FORM, TeacherFormDialog } from './TeacherFormDialog';

/**
 * Teachers screen: teachers and faculty (non-teaching staff) with search, a type filter and
 * add / edit / delete. Pay is handled on the HR & Payroll screen.
 */
export function TeachersScreen() {
  const { translate, canEdit, userRole, submitToServer, formatDate, schoolData } = useAppContext();

  // The text typed in the search box.
  const [searchText, setSearchText] = useState('');
  // The type chosen in the filter: '' (all), 'teacher' or 'faculty'.
  const [selectedKind, setSelectedKind] = useState('');
  // The person whose form is open (BLANK_TEACHER_FORM to add); null when closed.
  const [personInForm, setPersonInForm] = useState(null);

  const userMayEdit = canEdit('teachers');

  const visiblePeople = schoolData.teachers.filter(
    (person) =>
      (!selectedKind || person.kind === selectedKind) &&
      [
        person.name,
        person.job_title,
        person.qualification,
        person.subjects_taught,
        person.phone,
        person.email,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchText.toLowerCase()),
  );

  const tableColumns = [
    {
      heading: translate('field.type'),
      renderCell: (person) => (
        <StatusBadge tone={person.kind === 'faculty' ? 'warning' : 'neutral'}>
          {translate(`option.${person.kind}`)}
        </StatusBadge>
      ),
    },
    {
      heading: translate('field.full_name'),
      renderCell: (person) => <strong>{person.name}</strong>,
    },
    { heading: translate('field.job_title'), renderCell: (person) => person.job_title },
    { heading: translate('field.subjects_taught'), renderCell: (person) => person.subjects_taught },
    { heading: translate('field.qualification'), renderCell: (person) => person.qualification },
    { heading: translate('field.phone'), renderCell: (person) => person.phone },
    {
      heading: translate('field.joining_date'),
      renderCell: (person) => (person.joining_date ? formatDate(person.joining_date) : ''),
    },
    {
      heading: translate('field.status'),
      renderCell: (person) => (
        <StatusBadge tone={person.status === 'active' ? 'success' : 'warning'}>
          {translate(`option.${person.status}`)}
        </StatusBadge>
      ),
    },
  ];

  if (userMayEdit) {
    tableColumns.push({
      heading: '',
      isActionColumn: true,
      renderCell: (person) => (
        <div className="table-actions">
          <button
            className="button button--secondary button--small"
            onClick={() => setPersonInForm(person)}
          >
            {translate('common.edit')}
          </button>
          {userRole === 'admin' && (
            <button
              className="button button--secondary button--small button--danger"
              onClick={() =>
                window.confirm(translate('common.confirmDelete')) &&
                submitToServer('teachers/delete', { id: person.id })
              }
            >
              {translate('common.delete')}
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>
          {translate('nav.teachers')} <StatusBadge>{visiblePeople.length}</StatusBadge>
        </h2>
        <div className="toolbar">
          <input
            placeholder={translate('common.search')}
            aria-label={translate('common.search')}
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
          />
          <select
            value={selectedKind}
            onChange={(changeEvent) => setSelectedKind(changeEvent.target.value)}
            aria-label={translate('field.type')}
          >
            <option value="">{translate('common.all')}</option>
            <option value="teacher">{translate('option.teacher')}</option>
            <option value="faculty">{translate('option.faculty')}</option>
          </select>
          {userMayEdit && (
            <button className="button" onClick={() => setPersonInForm({ ...BLANK_TEACHER_FORM })}>
              <Icon name="add" size={16} />
              {translate('common.add')}
            </button>
          )}
        </div>
      </div>

      <ResponsiveTable
        columns={tableColumns}
        rows={visiblePeople}
        emptyMessage={translate('common.emptyState')}
      />

      {personInForm && (
        <TeacherFormDialog initialTeacher={personInForm} onClose={() => setPersonInForm(null)} />
      )}
    </div>
  );
}
