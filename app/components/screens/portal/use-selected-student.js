import { useState } from 'react';

/**
 * Remembers which of the family's children is being looked at in the student portal.
 * Falls back to the first child, so there is always one selected as soon as there are students.
 *
 * @param {object[]} students - The students of this family (from schoolData.students).
 * @returns {[object | undefined, (studentId: number) => void]} The selected student (undefined when the
 *   family has no students) and a function that selects another one by id.
 */
export function useSelectedStudent(students) {
  // The id the person clicked; may be unset (or stale after a reload), so it is checked below.
  const [chosenStudentId, setChosenStudentId] = useState(null);
  const selectedStudent = students.find((student) => student.id === chosenStudentId) ?? students[0];
  return [selectedStudent, setChosenStudentId];
}
