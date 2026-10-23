'use client';

import { useState } from 'react';
import { getAmountStillOwed } from '../../../helpers/money';
import { useAppContext } from '../../AppContext';
import { BillingSummaryStats } from '../../ui/BillingSummaryStats';
import { FormField } from '../../ui/FormField';
import { Icon } from '../../ui/Icon';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StatusBadge } from '../../ui/StatusBadge';
import { TabBar } from '../../ui/TabBar';
import { BLANK_FEE_TYPE_FORM, FeeTypeFormDialog } from './FeeTypeFormDialog';

/**
 * Accounting screen. Two tabs:
 *   - Invoices: generate invoices (for everyone, a class, a family or one student), search the
 *     invoice list, record payments and print invoices
 *   - Fee types: the price list that invoices are created from
 */
export function AccountingScreen() {
  const { translate, submitToServer, openPrintSheet, formatMoney, schoolData } = useAppContext();
  const { students, classNames, feeTypes, invoices } = schoolData;

  // Which tab is open: 'invoices' or 'feeTypes'.
  const [activeTabKey, setActiveTabKey] = useState('invoices');
  // The fee type whose form is open (BLANK_FEE_TYPE_FORM to add); null when closed.
  const [feeTypeInForm, setFeeTypeInForm] = useState(null);
  // The "Generate invoices" form: who to bill ('all', 'class:<name>', 'family:<id>' or a student id) and which fee.
  const [invoiceGenerationForm, setInvoiceGenerationForm] = useState({
    billTo: 'all',
    feeTypeId: '',
  });
  // The payment amounts typed beside each unpaid invoice, keyed by invoice id.
  const [paymentAmountByInvoiceId, setPaymentAmountByInvoiceId] = useState({});
  // The text typed in the invoice search box.
  const [searchText, setSearchText] = useState('');
  // The status filter: '' (any), 'unpaid' or 'paid'.
  const [statusFilter, setStatusFilter] = useState('');

  const findStudent = (studentId) => students.find((student) => student.id === studentId);

  // Invoices matching the search text and status filter, newest first.
  const visibleInvoices = invoices
    .filter((invoice) => {
      const student = findStudent(invoice.student_id);
      const matchesSearch = [
        invoice.invoice_number,
        student?.name,
        student?.family_id,
        invoice.fee_label,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const isUnpaid = getAmountStillOwed(invoice) > 0;
      const matchesStatus = !statusFilter || (statusFilter === 'unpaid') === isUnpaid;
      return matchesSearch && matchesStatus;
    })
    .reverse();

  // Every distinct Family ID, for the "whole family" billing options.
  const familyIds = [...new Set(students.map((student) => student.family_id))];

  function handleGenerateInvoices(submitEvent) {
    submitEvent.preventDefault();
    submitToServer('invoices', {
      fee_type_id: invoiceGenerationForm.feeTypeId,
      bill_to: invoiceGenerationForm.billTo,
    });
  }

  /** Records a payment: the typed amount, or the full balance if the box was left empty. */
  function handlePayInvoice(invoice) {
    const typedAmount = Number(paymentAmountByInvoiceId[invoice.id]);
    submitToServer(
      'payments',
      { invoice_id: invoice.id, amount: typedAmount || getAmountStillOwed(invoice) },
      () => setPaymentAmountByInvoiceId({ ...paymentAmountByInvoiceId, [invoice.id]: '' }),
    );
  }

  const invoiceColumns = [
    { heading: translate('field.invoice_number'), renderCell: (invoice) => invoice.invoice_number },
    {
      heading: translate('field.student'),
      renderCell: (invoice) => findStudent(invoice.student_id)?.name || '',
    },
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
        <div className="table-actions">
          {getAmountStillOwed(invoice) > 0 && (
            <>
              <input
                type="number"
                min="0"
                step="0.01"
                aria-label={translate('accounting.paymentAmount')}
                placeholder={translate('accounting.paymentAmount')}
                value={paymentAmountByInvoiceId[invoice.id] || ''}
                onChange={(changeEvent) =>
                  setPaymentAmountByInvoiceId({
                    ...paymentAmountByInvoiceId,
                    [invoice.id]: changeEvent.target.value,
                  })
                }
              />
              <button className="button button--small" onClick={() => handlePayInvoice(invoice)}>
                {translate('accounting.pay')}
              </button>
            </>
          )}
          <button
            className="button button--secondary button--small"
            onClick={() => openPrintSheet({ kind: 'invoice', invoice })}
          >
            {translate('common.print')}
          </button>
        </div>
      ),
    },
  ];

  const feeTypeColumns = [
    {
      heading: translate('field.fee_label'),
      renderCell: (feeType) => <strong>{feeType.label}</strong>,
    },
    {
      heading: translate('field.fee_category'),
      renderCell: (feeType) => (
        <StatusBadge>{translate(`option.${feeType.fee_category}`)}</StatusBadge>
      ),
    },
    { heading: translate('field.amount'), renderCell: (feeType) => formatMoney(feeType.amount) },
    { heading: translate('accounting.classOptional'), renderCell: (feeType) => feeType.class_name },
    {
      heading: '',
      isActionColumn: true,
      renderCell: (feeType) => (
        <div className="table-actions">
          <button
            className="button button--secondary button--small"
            onClick={() => setFeeTypeInForm(feeType)}
          >
            {translate('common.edit')}
          </button>
          <button
            className="button button--secondary button--small button--danger"
            onClick={() =>
              window.confirm(translate('common.confirmDelete')) &&
              submitToServer('fee-types/delete', { id: feeType.id })
            }
          >
            {translate('common.delete')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <BillingSummaryStats />
      <TabBar
        activeTabKey={activeTabKey}
        onTabChange={setActiveTabKey}
        tabs={[
          { key: 'invoices', label: translate('accounting.invoices') },
          { key: 'feeTypes', label: translate('accounting.feeTypes') },
        ]}
      />

      {activeTabKey === 'feeTypes' && (
        <div className="card">
          <div className="card-header">
            <h2>{translate('accounting.feeTypes')}</h2>
            <button className="button" onClick={() => setFeeTypeInForm({ ...BLANK_FEE_TYPE_FORM })}>
              <Icon name="add" size={16} />
              {translate('common.add')}
            </button>
          </div>
          <ResponsiveTable
            emptyMessage={translate('common.emptyState')}
            rows={feeTypes}
            columns={feeTypeColumns}
          />
        </div>
      )}

      {activeTabKey === 'invoices' && (
        <>
          <form className="card" onSubmit={handleGenerateInvoices}>
            <div className="card-header">
              <h2>{translate('accounting.generateInvoices')}</h2>
            </div>
            <div className="form-grid">
              <FormField label={translate('accounting.invoiceFor')}>
                <select
                  value={invoiceGenerationForm.billTo}
                  onChange={(changeEvent) =>
                    setInvoiceGenerationForm({
                      ...invoiceGenerationForm,
                      billTo: changeEvent.target.value,
                    })
                  }
                >
                  <option value="all">{translate('common.all')}</option>
                  {classNames.map((className) => (
                    <option key={className} value={`class:${className}`}>
                      {translate('accounting.wholeClass')}: {className}
                    </option>
                  ))}
                  {familyIds.map((familyId) => (
                    <option key={familyId} value={`family:${familyId}`}>
                      {translate('accounting.wholeFamily')}: {familyId}
                    </option>
                  ))}
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.student_number} {student.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={translate('field.fee')}>
                <select
                  required
                  value={invoiceGenerationForm.feeTypeId}
                  onChange={(changeEvent) =>
                    setInvoiceGenerationForm({
                      ...invoiceGenerationForm,
                      feeTypeId: changeEvent.target.value,
                    })
                  }
                >
                  <option value="" />
                  {feeTypes.map((feeType) => (
                    <option key={feeType.id} value={feeType.id}>
                      {feeType.label} ({formatMoney(feeType.amount)})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <p className="hint-text">{translate('accounting.scholarshipHint')}</p>
            <button className="button">{translate('accounting.generateInvoices')}</button>
          </form>

          <div className="card">
            <div className="card-header">
              <h2>{translate('accounting.invoices')}</h2>
              <div className="toolbar">
                <input
                  placeholder={translate('common.search')}
                  aria-label={translate('common.search')}
                  value={searchText}
                  onChange={(changeEvent) => setSearchText(changeEvent.target.value)}
                />
                <select
                  value={statusFilter}
                  onChange={(changeEvent) => setStatusFilter(changeEvent.target.value)}
                  aria-label={translate('field.status')}
                >
                  <option value="">{translate('accounting.allStatuses')}</option>
                  <option value="unpaid">{translate('accounting.unpaid')}</option>
                  <option value="paid">{translate('accounting.fullyPaid')}</option>
                </select>
              </div>
            </div>
            <ResponsiveTable
              emptyMessage={translate('common.emptyState')}
              rows={visibleInvoices}
              columns={invoiceColumns}
            />
          </div>
        </>
      )}

      {feeTypeInForm && (
        <FeeTypeFormDialog initialFeeType={feeTypeInForm} onClose={() => setFeeTypeInForm(null)} />
      )}
    </>
  );
}
