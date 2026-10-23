'use client';

import { buildCsv, LEGACY_CSV_COLUMN_NAMES } from '../../../helpers/csv';
import { downloadTextFile } from '../../../helpers/files';
import { useAppContext } from '../../AppContext';
import { BillingSummaryStats } from '../../ui/BillingSummaryStats';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { CsvImportCard } from './CsvImportCard';
import { UserAccountsCard } from './UserAccountsCard';

/** How many of the newest audit-trail entries are listed. */
const AUDIT_ROWS_SHOWN = 50;

/**
 * Settings screen (administrators only): billing totals, user accounts, CSV import,
 * database backup, invoice export and the audit trail of who changed what.
 */
export function SettingsScreen() {
  const { translate, schoolData } = useAppContext();
  const { invoices, students, auditLog } = schoolData;

  const findStudentName = (studentId) =>
    students.find((student) => student.id === studentId)?.name || '';

  /** Downloads every invoice as a spreadsheet-friendly CSV file. */
  function exportInvoicesAsCsv() {
    const csvText = buildCsv(
      [
        'invoice_number',
        'student',
        'fee',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'issued_on',
      ],
      invoices.map((invoice) => [
        invoice.invoice_number,
        findStudentName(invoice.student_id),
        invoice.fee_label,
        invoice.discount_amount,
        invoice.total_amount,
        invoice.paid_amount,
        invoice.issued_on,
      ]),
    );
    downloadTextFile('invoices.csv', csvText, 'text/csv');
  }

  return (
    <>
      <BillingSummaryStats />
      <UserAccountsCard />

      <div className="two-column-grid">
        <CsvImportCard
          title={translate('settings.importStudents')}
          importRoutePath="students/import"
          legacyColumnNames={LEGACY_CSV_COLUMN_NAMES.students}
          expectedColumnsHint="name, guardian_name, guardian_phone, class_name, father_name, mother_name, date_of_birth, gender, address …"
        />
        <CsvImportCard
          title={translate('settings.importTeachers')}
          importRoutePath="teachers/import"
          legacyColumnNames={LEGACY_CSV_COLUMN_NAMES.teachers}
          expectedColumnsHint="kind, name, job_title, qualification, phone, email, address, joining_date"
        />
        <CsvImportCard
          title={translate('settings.importFeeTypes')}
          importRoutePath="fee-types/import"
          legacyColumnNames={LEGACY_CSV_COLUMN_NAMES.feeTypes}
          expectedColumnsHint="label, fee_category (student|enrollment|exam|other), amount, class_name"
        />
      </div>
      <p className="hint-text">{translate('settings.csvLegacyNote')}</p>

      <section className="card">
        <div className="card-header">
          <h2>{translate('settings.backupAndExport')}</h2>
        </div>
        <div className="button-row">
          <button
            className="button"
            onClick={() => {
              window.location.href = '/api/backup';
            }}
          >
            {translate('settings.downloadBackup')}
          </button>
          <button className="button button--secondary" onClick={exportInvoicesAsCsv}>
            {translate('settings.exportInvoicesCsv')}
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>{translate('settings.auditTrail')}</h2>
        </div>
        <ResponsiveTable
          emptyMessage={translate('common.emptyState')}
          rows={auditLog.slice(0, AUDIT_ROWS_SHOWN)}
          columns={[
            {
              heading: translate('settings.auditTime'),
              renderCell: (entry) => entry.created_at.replace('T', ' ').slice(0, 19),
            },
            {
              heading: translate('settings.auditUser'),
              renderCell: (entry) => <StatusBadge>{entry.username}</StatusBadge>,
            },
            { heading: translate('settings.auditAction'), renderCell: (entry) => entry.action },
          ]}
        />
      </section>
    </>
  );
}
