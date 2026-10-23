'use client';

import { useAppContext } from '../../AppContext';
import { StudentProfileDetails } from '../students/StudentProfileDetails';
import { ChildPicker } from './ChildPicker';
import { NoStudentsNotice } from './NoStudentsNotice';
import { useSelectedStudent } from './use-selected-student';

/**
 * Student portal: "My profile". Read-only personal details of the selected child,
 * with a button to print the student ID card.
 */
export function PortalProfileScreen() {
  const { translate, openPrintSheet, schoolData } = useAppContext();
  const { students } = schoolData;
  const [selectedStudent, selectStudent] = useSelectedStudent(students);

  if (!selectedStudent) return <NoStudentsNotice />;

  return (
    <>
      <ChildPicker
        students={students}
        selectedStudent={selectedStudent}
        onSelectStudent={selectStudent}
      />
      <section className="card">
        <StudentProfileDetails student={selectedStudent} />
        <p className="hint-text">{translate('portal.readOnlyNote')}</p>
        <div className="button-row">
          <button
            className="button"
            onClick={() => openPrintSheet({ kind: 'studentIdCard', student: selectedStudent })}
          >
            {translate('students.idCard')}
          </button>
        </div>
      </section>
    </>
  );
}
