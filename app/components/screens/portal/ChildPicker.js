'use client';

import { TabBar } from '../../ui/TabBar';

/**
 * A row of tabs, one per child, for guardians who have more than one student in the madrassa.
 * Renders nothing when there is only one child, because there is nothing to choose.
 *
 * @param {object} props
 * @param {object[]} props.students - The family's students.
 * @param {object} props.selectedStudent - The student currently shown.
 * @param {(studentId: number) => void} props.onSelectStudent - Called with the clicked child's id.
 */
export function ChildPicker({ students, selectedStudent, onSelectStudent }) {
  if (students.length < 2) return null;

  return (
    <TabBar
      tabs={students.map((student) => ({ key: String(student.id), label: student.name }))}
      activeTabKey={String(selectedStudent.id)}
      onTabChange={(studentKey) => onSelectStudent(Number(studentKey))}
    />
  );
}
