'use client';

import { useAppContext } from '../../AppContext';
import { WeeklyTimetable } from '../../records/WeeklyTimetable';
import { ChildPicker } from './ChildPicker';
import { NoStudentsNotice } from './NoStudentsNotice';
import { useSelectedStudent } from './use-selected-student';

/**
 * Student portal: "Class timetable". The weekly timetable of the selected child's class, printable.
 */
export function PortalTimetableScreen() {
  const { translate, openPrintSheet, schoolData } = useAppContext();
  const { students, schedule } = schoolData;
  const [selectedStudent, selectStudent] = useSelectedStudent(students);

  if (!selectedStudent) return <NoStudentsNotice />;

  const periodsOfStudentsClass = schedule.filter(
    (period) => period.class_name === selectedStudent.class_name,
  );

  return (
    <>
      <ChildPicker
        students={students}
        selectedStudent={selectedStudent}
        onSelectStudent={selectStudent}
      />
      <section className="card">
        <div className="card-header">
          <h2>{selectedStudent.class_name}</h2>
          <button
            className="button button--secondary button--small"
            onClick={() =>
              openPrintSheet({
                kind: 'timetable',
                title: `${selectedStudent.name} · ${selectedStudent.class_name}`,
                scheduleRows: periodsOfStudentsClass,
                omittedDetail: 'class',
              })
            }
          >
            {translate('common.print')}
          </button>
        </div>
        <WeeklyTimetable scheduleRows={periodsOfStudentsClass} omittedDetail="class" />
      </section>
    </>
  );
}
