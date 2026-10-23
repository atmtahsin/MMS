'use client';

import { getAmountStillOwed } from '../../../helpers/money';
import { useAppContext } from '../../AppContext';
import { ModalDialog } from '../../ui/ModalDialog';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StudentProfileDetails } from './StudentProfileDetails';

/**
 * A read-only profile of one student: personal details, parents, guardian, family members,
 * and (for roles that may see them) invoices, scholarships and disciplinary records.
 *
 * @param {object} props
 * @param {object} props.student - The student to show.
 * @param {() => void} props.onClose - Closes the profile.
 * @param {() => void} props.onEdit - Opens the edit form for this student (hidden when the user cannot edit).
 * @param {() => void} props.onPrintIdCard - Opens the ID card print preview.
 */
export function StudentProfileDialog({ student, onClose, onEdit, onPrintIdCard }) {
  const { translate, canView, canEdit, formatMoney, formatDate, schoolData } = useAppContext();

  // Everything below is limited to records that belong to this student (or this family).
  const studentInvoices = schoolData.invoices.filter(
    (invoice) => invoice.student_id === student.id,
  );
  const studentScholarships = schoolData.scholarships.filter(
    (scholarship) => scholarship.student_id === student.id,
  );
  const studentDisciplineRecords = schoolData.discipline.filter(
    (incident) => incident.student_id === student.id,
  );
  const otherFamilyMembers = schoolData.students.filter(
    (candidate) => candidate.family_id === student.family_id && candidate.id !== student.id,
  );

  return (
    <ModalDialog
      isWide
      title={student.name}
      closeButtonLabel={translate('common.close')}
      onClose={onClose}
    >
      <StudentProfileDetails student={student} />

      {otherFamilyMembers.length > 0 && (
        <>
          <div className="form-section-title">{translate('students.familyMembers')}</div>
          <div className="chip-list">
            {otherFamilyMembers.map((familyMember) => (
              <span className="chip" key={familyMember.id}>
                {familyMember.name} · {familyMember.class_name}
              </span>
            ))}
          </div>
        </>
      )}

      {canView('accounting') && studentInvoices.length > 0 && (
        <>
          <div className="form-section-title">{translate('nav.accounting')}</div>
          <ResponsiveTable
            emptyMessage=""
            rows={studentInvoices}
            columns={[
              {
                heading: translate('field.invoice_number'),
                renderCell: (invoice) => invoice.invoice_number,
              },
              { heading: translate('field.fee'), renderCell: (invoice) => invoice.fee_label },
              {
                heading: translate('accounting.total'),
                renderCell: (invoice) => formatMoney(invoice.total_amount),
              },
              {
                heading: translate('accounting.outstanding'),
                renderCell: (invoice) => (
                  <span className={getAmountStillOwed(invoice) > 0 ? 'amount-due' : undefined}>
                    {formatMoney(getAmountStillOwed(invoice))}
                  </span>
                ),
              },
            ]}
          />
        </>
      )}

      {canView('scholarships') && studentScholarships.length > 0 && (
        <>
          <div className="form-section-title">{translate('recordType.scholarships')}</div>
          <div className="chip-list">
            {studentScholarships.map((scholarship) => (
              <span className="chip" key={scholarship.id}>
                {scholarship.name} ·{' '}
                {scholarship.discount_type === 'percent'
                  ? `${scholarship.discount_value}%`
                  : formatMoney(scholarship.discount_value)}{' '}
                · {translate(`option.${scholarship.status}`)}
              </span>
            ))}
          </div>
        </>
      )}

      {canView('discipline') && studentDisciplineRecords.length > 0 && (
        <>
          <div className="form-section-title">{translate('recordType.discipline')}</div>
          <ResponsiveTable
            emptyMessage=""
            rows={studentDisciplineRecords}
            columns={[
              {
                heading: translate('field.incident_date'),
                renderCell: (incident) => formatDate(incident.incident_date),
              },
              {
                heading: translate('field.incident_type'),
                renderCell: (incident) => translate(`option.${incident.incident_type}`),
              },
              {
                heading: translate('field.description'),
                renderCell: (incident) => incident.description,
              },
              {
                heading: translate('field.status'),
                renderCell: (incident) => translate(`option.${incident.status}`),
              },
            ]}
          />
        </>
      )}

      <div className="button-row form-actions">
        <button className="button" onClick={onPrintIdCard}>
          {translate('students.idCard')}
        </button>
        {canEdit('students') && (
          <button className="button button--secondary" onClick={onEdit}>
            {translate('common.edit')}
          </button>
        )}
      </div>
    </ModalDialog>
  );
}
