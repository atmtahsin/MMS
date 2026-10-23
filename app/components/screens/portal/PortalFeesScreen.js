'use client';

import { getAmountStillOwed } from '../../../helpers/money';
import { useAppContext } from '../../AppContext';
import { BillingSummaryStats } from '../../ui/BillingSummaryStats';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { NoStudentsNotice } from './NoStudentsNotice';

/**
 * Student portal: "Fees & payments". Totals plus every invoice of the family's children
 * (newest first), with what has been paid and what is still owed. Invoices can be printed.
 * Payments are recorded by the madrassa's accounts office, never here.
 */
export function PortalFeesScreen() {
  const { translate, formatMoney, formatDate, openPrintSheet, schoolData } = useAppContext();
  const { students, invoices } = schoolData;

  if (students.length === 0) return <NoStudentsNotice />;

  const hasSeveralChildren = students.length > 1;
  const invoicesNewestFirst = [...invoices].reverse();
  const findStudentName = (studentId) =>
    students.find((student) => student.id === studentId)?.name || '';

  const columns = [
    { heading: translate('field.invoice_number'), renderCell: (invoice) => invoice.invoice_number },
    { heading: translate('field.date'), renderCell: (invoice) => formatDate(invoice.issued_on) },
  ];
  // Only name the student when the guardian has more than one child.
  if (hasSeveralChildren) {
    columns.push({
      heading: translate('field.student'),
      renderCell: (invoice) => findStudentName(invoice.student_id),
    });
  }
  columns.push(
    {
      heading: translate('field.fee'),
      renderCell: (invoice) => (
        <>
          {invoice.fee_label}{' '}
          {invoice.discount_amount > 0 && (
            <StatusBadge tone="success">−{formatMoney(invoice.discount_amount)}</StatusBadge>
          )}
        </>
      ),
    },
    {
      heading: translate('accounting.total'),
      renderCell: (invoice) => formatMoney(invoice.total_amount),
    },
    {
      heading: translate('accounting.paid'),
      renderCell: (invoice) => formatMoney(invoice.paid_amount),
    },
    {
      heading: translate('accounting.outstanding'),
      renderCell: (invoice) => (
        <span className={getAmountStillOwed(invoice) > 0 ? 'amount-due' : undefined}>
          {formatMoney(getAmountStillOwed(invoice))}
        </span>
      ),
    },
    {
      heading: '',
      isActionColumn: true,
      renderCell: (invoice) => (
        <button
          className="button button--secondary button--small"
          onClick={() => openPrintSheet({ kind: 'invoice', invoice })}
        >
          {translate('common.print')}
        </button>
      ),
    },
  );

  return (
    <>
      <BillingSummaryStats />
      <section className="card">
        <div className="card-header">
          <h2>{translate('accounting.invoices')}</h2>
        </div>
        <ResponsiveTable
          columns={columns}
          rows={invoicesNewestFirst}
          emptyMessage={translate('common.emptyState')}
        />
        <p className="hint-text">{translate('portal.readOnlyNote')}</p>
      </section>
    </>
  );
}
