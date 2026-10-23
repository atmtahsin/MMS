'use client';

import { useState } from 'react';
import { useAppContext } from '../../AppContext';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { BLANK_STUDENT_FORM, StudentFormDialog } from './StudentFormDialog';
import { StudentProfileDialog } from './StudentProfileDialog';
import { STUDENT_STATUS_TONE } from './student-status-tone';

/**
 * Students screen: a searchable list with a class filter. From each row the user can open a
 * profile, print an ID card and (with permission) edit or delete the student.
 */
export function StudentsScreen() {
  const { translate, canEdit, userRole, submitToServer, openPrintSheet, schoolData } =
    useAppContext();
  const { students, classNames } = schoolData;

  // The text typed in the search box. Clicking a Family ID fills it in to show that family.
  const [searchText, setSearchText] = useState('');
  // The class chosen in the filter; '' means all classes.
  const [selectedClassName, setSelectedClassName] = useState('');
  // The student whose add/edit form is open (BLANK_STUDENT_FORM to add); null when closed.
  const [studentInForm, setStudentInForm] = useState(null);
  // The student whose profile is open; null when closed.
  const [studentInProfile, setStudentInProfile] = useState(null);

  const userMayEdit = canEdit('students');
  const lowercaseSearchText = searchText.toLowerCase();

  // A student matches when the chosen class fits and the search text appears in any key detail.
  const visibleStudents = students.filter(
    (student) =>
      (!selectedClassName || student.class_name === selectedClassName) &&
      [
        student.name,
        student.student_number,
        student.family_id,
        student.guardian_name,
        student.father_name,
        student.mother_name,
        student.guardian_phone,
        student.class_name,
      ]
        .join(' ')
        .toLowerCase()
        .includes(lowercaseSearchText),
  );

  const tableColumns = [
    {
      heading: '',
      renderCell: (student) => <Avatar name={student.name} photoDataUrl={student.photo_data_url} />,
    },
    { heading: translate('field.student_number'), renderCell: (student) => student.student_number },
    {
      heading: translate('field.full_name'),
      renderCell: (student) => <strong>{student.name}</strong>,
    },
    {
      heading: translate('field.family_id'),
      renderCell: (student) => (
        <button
          className="button button--secondary button--small"
          onClick={() => setSearchText(student.family_id)}
        >
          {student.family_id}
        </button>
      ),
    },
    { heading: translate('field.guardian_name'), renderCell: (student) => student.guardian_name },
    { heading: translate('field.class_name'), renderCell: (student) => student.class_name },
    {
      heading: translate('field.status'),
      renderCell: (student) => (
        <StatusBadge tone={STUDENT_STATUS_TONE[student.status]}>
          {translate(`option.${student.status}`)}
        </StatusBadge>
      ),
    },
    {
      heading: '',
      isActionColumn: true,
      renderCell: (student) => (
        <div className="table-actions">
          <button className="button button--small" onClick={() => setStudentInProfile(student)}>
            {translate('common.view')}
          </button>
          <button
            className="button button--secondary button--small"
            onClick={() => openPrintSheet({ kind: 'studentIdCard', student })}
          >
            {translate('students.idCard')}
          </button>
          {userMayEdit && (
            <button
              className="button button--secondary button--small"
              onClick={() => setStudentInForm(student)}
            >
              {translate('common.edit')}
            </button>
          )}
          {userRole === 'admin' && (
            <button
              className="button button--secondary button--small button--danger"
              onClick={() =>
                window.confirm(translate('common.confirmDelete')) &&
                submitToServer('students/delete', { id: student.id })
              }
            >
              {translate('common.delete')}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2>
          {translate('nav.students')} <StatusBadge>{visibleStudents.length}</StatusBadge>
        </h2>
        <div className="toolbar">
          <input
            placeholder={translate('students.searchPlaceholder')}
            aria-label={translate('common.search')}
            value={searchText}
            onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
          />
          <select
            value={selectedClassName}
            onChange={(changeEvent) => setSelectedClassName(changeEvent.target.value)}
            aria-label={translate('field.class_name')}
          >
            <option value="">{translate('students.allClasses')}</option>
            {classNames.map((className) => (
              <option key={className}>{className}</option>
            ))}
          </select>
          {userMayEdit && (
            <button className="button" onClick={() => setStudentInForm({ ...BLANK_STUDENT_FORM })}>
              <Icon name="add" size={16} />
              {translate('students.addTitle')}
            </button>
          )}
        </div>
      </div>

      <ResponsiveTable
        columns={tableColumns}
        rows={visibleStudents}
        emptyMessage={translate('common.emptyState')}
      />

      {studentInForm && (
        <StudentFormDialog initialStudent={studentInForm} onClose={() => setStudentInForm(null)} />
      )}

      {studentInProfile && (
        <StudentProfileDialog
          student={studentInProfile}
          onClose={() => setStudentInProfile(null)}
          onEdit={() => {
            setStudentInForm(studentInProfile);
            setStudentInProfile(null);
          }}
          onPrintIdCard={() => {
            openPrintSheet({ kind: 'studentIdCard', student: studentInProfile });
            setStudentInProfile(null);
          }}
        />
      )}
    </div>
  );
}
