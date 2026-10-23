'use client';

import { useAppContext } from '../../AppContext';
import { Avatar } from '../../ui/Avatar';
import { DetailItem } from '../../ui/DetailItem';
import { StatusBadge } from '../../ui/StatusBadge';
import { STUDENT_STATUS_TONE } from './student-status-tone';

/**
 * The read-only personal details of one student: a header (photo, name, numbers, status)
 * followed by the student, parents and guardian sections.
 * Used by the staff profile pop-up and by the student portal, so both show the same thing.
 *
 * @param {object} props
 * @param {object} props.student - The student to show (a row of the `students` table).
 */
export function StudentProfileDetails({ student }) {
  const { translate, formatDate } = useAppContext();

  return (
    <>
      <div className="profile-header">
        <Avatar name={student.name} photoDataUrl={student.photo_data_url} size="large" />
        <div className="profile-header-details">
          <h4>{student.name}</h4>
          <div>
            {student.student_number} · {student.family_id} · {student.class_name}{' '}
            <StatusBadge tone={STUDENT_STATUS_TONE[student.status]}>
              {translate(`option.${student.status}`)}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="form-section-title">{translate('students.sectionStudent')}</div>
      <div className="detail-grid">
        <DetailItem
          label={translate('field.gender')}
          value={student.gender && translate(`option.${student.gender}`)}
        />
        <DetailItem
          label={translate('field.date_of_birth')}
          value={student.date_of_birth && formatDate(student.date_of_birth)}
        />
        <DetailItem label={translate('field.blood_group')} value={student.blood_group} />
        <DetailItem label={translate('field.nationality')} value={student.nationality} />
        <DetailItem
          label={translate('field.admission_date')}
          value={student.admission_date && formatDate(student.admission_date)}
        />
        <DetailItem label={translate('field.previous_school')} value={student.previous_school} />
        <DetailItem label={translate('field.address')} value={student.address} />
      </div>

      <div className="form-section-title">{translate('students.sectionParents')}</div>
      <div className="detail-grid">
        <DetailItem label={translate('field.father_name')} value={student.father_name} />
        <DetailItem
          label={translate('field.father_occupation')}
          value={student.father_occupation}
        />
        <DetailItem label={translate('field.mother_name')} value={student.mother_name} />
        <DetailItem
          label={translate('field.mother_occupation')}
          value={student.mother_occupation}
        />
        <DetailItem label={translate('field.mother_phone')} value={student.mother_phone} />
      </div>

      <div className="form-section-title">{translate('students.sectionGuardian')}</div>
      <div className="detail-grid">
        <DetailItem label={translate('field.guardian_name')} value={student.guardian_name} />
        <DetailItem
          label={translate('field.guardian_relationship')}
          value={student.guardian_relationship}
        />
        <DetailItem label={translate('field.phone')} value={student.guardian_phone} />
        <DetailItem label={translate('field.emergency_phone')} value={student.emergency_phone} />
        <DetailItem label={translate('field.email')} value={student.guardian_email} />
      </div>
    </>
  );
}
