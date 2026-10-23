'use client';

import { getAmountStillOwed } from '../../helpers/money';
import { useAppContext } from '../AppContext';
import { WeeklyTimetable } from '../records/WeeklyTimetable';

/**
 * A full-screen preview of something to print: a student ID card, an invoice, a payslip
 * or a timetable. The "Print" button opens the browser's print dialog; while printing,
 * everything except this sheet is hidden (see print.css).
 *
 * @param {object} props
 * @param {object} props.sheet - What to show. One of:
 *   { kind: 'studentIdCard', student }
 *   { kind: 'invoice', invoice }
 *   { kind: 'payslip', payrollLine, staffMember }
 *   { kind: 'timetable', title, scheduleRows, omittedDetail }
 * @param {() => void} props.onClose - Closes the preview.
 */
export function PrintableSheet({ sheet, onClose }) {
  const { translate } = useAppContext();

  return (
    <div className="print-overlay">
      <div className="print-sheet">
        {sheet.kind === 'studentIdCard' && <StudentIdCard student={sheet.student} />}
        {sheet.kind === 'invoice' && <InvoiceDocument invoice={sheet.invoice} />}
        {sheet.kind === 'payslip' && (
          <PayslipDocument payrollLine={sheet.payrollLine} staffMember={sheet.staffMember} />
        )}
        {sheet.kind === 'timetable' && (
          <div>
            <h2>{sheet.title}</h2>
            <WeeklyTimetable
              scheduleRows={sheet.scheduleRows}
              omittedDetail={sheet.omittedDetail}
            />
          </div>
        )}

        <div className="button-row print-sheet-actions no-print">
          <button className="button" onClick={() => window.print()}>
            {translate('common.print')}
          </button>
          <button className="button button--secondary" onClick={onClose}>
            {translate('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** A credit-card-sized student identity card. */
function StudentIdCard({ student }) {
  const { translate } = useAppContext();

  return (
    <div className="id-card">
      <div className="id-card-header">{translate('app.title')}</div>
      <div className="id-card-body">
        {student.photo_data_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- inline data URL, not an optimisable file
          <img className="id-card-photo" alt="" src={student.photo_data_url} />
        ) : (
          <div className="id-card-photo" />
        )}
        <div>
          <div className="id-card-name">{student.name}</div>
          <div>
            <strong>{translate('field.student_number')}:</strong> {student.student_number}
          </div>
          <div>
            <strong>{translate('field.family_id')}:</strong> {student.family_id}
          </div>
          <div>
            <strong>{translate('field.class_name')}:</strong> {student.class_name}
          </div>
          {student.blood_group && (
            <div>
              <strong>{translate('field.blood_group')}:</strong> {student.blood_group}
            </div>
          )}
        </div>
      </div>
      <div className="id-card-footer">
        <strong>{translate('field.guardian_name')}:</strong> {student.guardian_name} ·{' '}
        {student.guardian_phone}
      </div>
    </div>
  );
}

/** A fee invoice with its discount, total, amount paid and balance. */
function InvoiceDocument({ invoice }) {
  const { translate, formatMoney, formatDate, schoolData } = useAppContext();
  const student = schoolData.students.find((candidate) => candidate.id === invoice.student_id);

  return (
    <div className="print-document">
      <div className="print-sheet-header">
        <h2>{translate('app.title')}</h2>
        <h3>
          {translate('field.invoice_number')} {invoice.invoice_number}
        </h3>
      </div>
      <p>
        {translate('field.date')}: {formatDate(invoice.issued_on)}
        <br />
        {translate('field.student')}: {student?.name} ({student?.student_number})
        <br />
        {translate('field.family_id')}: {student?.family_id}
      </p>
      <table className="document-table">
        <tbody>
          <tr>
            <td>{translate('field.fee')}</td>
            <td>{invoice.fee_label}</td>
          </tr>
          {invoice.discount_amount > 0 && (
            <tr>
              <td>{translate('recordType.scholarships')}</td>
              <td>−{formatMoney(invoice.discount_amount)}</td>
            </tr>
          )}
          <tr>
            <td>{translate('accounting.total')}</td>
            <td>{formatMoney(invoice.total_amount)}</td>
          </tr>
          <tr>
            <td>{translate('accounting.paid')}</td>
            <td>{formatMoney(invoice.paid_amount)}</td>
          </tr>
          <tr className="document-total-row">
            <td>{translate('accounting.outstanding')}</td>
            <td>{formatMoney(getAmountStillOwed(invoice))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** A salary slip for one staff member and one month. */
function PayslipDocument({ payrollLine, staffMember }) {
  const { translate, formatMoney } = useAppContext();

  return (
    <div className="print-document">
      <div className="print-sheet-header">
        <h2>{translate('app.title')}</h2>
        <h3>
          {translate('payroll.payslip')} · {payrollLine.payroll_month}
        </h3>
      </div>
      <p>
        {translate('field.full_name')}: {staffMember?.name}
        <br />
        {translate('field.job_title')}: {staffMember?.job_title}
      </p>
      <table className="document-table">
        <tbody>
          <tr>
            <td>{translate('payroll.basicSalary')}</td>
            <td>{formatMoney(payrollLine.basic_salary)}</td>
          </tr>
          <tr>
            <td>{translate('payroll.allowance')}</td>
            <td>{formatMoney(payrollLine.allowance_amount)}</td>
          </tr>
          <tr>
            <td>{translate('payroll.deduction')}</td>
            <td>−{formatMoney(payrollLine.deduction_amount)}</td>
          </tr>
          <tr className="document-total-row">
            <td>{translate('payroll.netPay')}</td>
            <td>{formatMoney(payrollLine.net_pay)}</td>
          </tr>
          <tr>
            <td>{translate('field.status')}</td>
            <td>
              {payrollLine.paid_on
                ? `${translate('accounting.paid')} · ${payrollLine.paid_on}`
                : translate('accounting.unpaid')}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
