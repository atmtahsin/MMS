'use client';

import { useState } from 'react';
import { getTodayAsIsoDate } from '../../../helpers/formatting';
import { roundToTwoDecimals } from '../../../helpers/money';
import { useAppContext } from '../../AppContext';
import { FormActions } from '../../ui/FormActions';
import { FormField } from '../../ui/FormField';
import { ModalDialog } from '../../ui/ModalDialog';
import { ResponsiveTable } from '../../ui/ResponsiveTable';
import { StatCard } from '../../ui/StatCard';
import { StatusBadge } from '../../ui/StatusBadge';
import { TabBar } from '../../ui/TabBar';

/**
 * HR & Payroll screen. Two tabs:
 *   - Payroll: pick a month, generate that month's pay lines for all active staff, then
 *     adjust, mark as paid, print a payslip or delete each line
 *   - Salary structure: the basic salary and allowance of each staff member
 */
export function HrPayrollScreen() {
  const { translate, submitToServer, openPrintSheet, formatMoney, schoolData } = useAppContext();
  const { teachers, payrollLines } = schoolData;

  // Which tab is open: 'payroll' or 'salaryStructure'.
  const [activeTabKey, setActiveTabKey] = useState('payroll');
  // The month being viewed, as "YYYY-MM". Starts on the current month.
  const [selectedMonth, setSelectedMonth] = useState(getTodayAsIsoDate().slice(0, 7));
  // The salary form's values { id, name, basic_salary, allowance_amount }; null when closed.
  const [salaryForm, setSalaryForm] = useState(null);
  // The adjustment form's values (a copy of one payroll line); null when closed.
  const [adjustmentForm, setAdjustmentForm] = useState(null);

  const findStaffMember = (teacherId) => teachers.find((person) => person.id === teacherId);
  const linesOfSelectedMonth = payrollLines.filter((line) => line.payroll_month === selectedMonth);

  /** Adds up the net pay of the selected month's lines that pass `shouldInclude`. */
  const sumNetPay = (shouldInclude) =>
    roundToTwoDecimals(
      linesOfSelectedMonth.filter(shouldInclude).reduce((total, line) => total + line.net_pay, 0),
    );

  const salaryStructureColumns = [
    {
      heading: translate('field.full_name'),
      renderCell: (person) => <strong>{person.name}</strong>,
    },
    { heading: translate('field.job_title'), renderCell: (person) => person.job_title },
    {
      heading: translate('field.type'),
      renderCell: (person) => translate(`option.${person.kind}`),
    },
    {
      heading: translate('payroll.basicSalary'),
      renderCell: (person) => formatMoney(person.basic_salary),
    },
    {
      heading: translate('payroll.allowance'),
      renderCell: (person) => formatMoney(person.allowance_amount),
    },
    {
      heading: translate('payroll.gross'),
      renderCell: (person) => (
        <strong>{formatMoney(person.basic_salary + person.allowance_amount)}</strong>
      ),
    },
    {
      heading: '',
      isActionColumn: true,
      renderCell: (person) => (
        <button
          className="button button--secondary button--small"
          onClick={() =>
            setSalaryForm({
              id: person.id,
              name: person.name,
              basic_salary: person.basic_salary,
              allowance_amount: person.allowance_amount,
            })
          }
        >
          {translate('common.edit')}
        </button>
      ),
    },
  ];

  const payrollColumns = [
    {
      heading: translate('field.full_name'),
      renderCell: (line) => <strong>{findStaffMember(line.teacher_id)?.name}</strong>,
    },
    {
      heading: translate('payroll.basicSalary'),
      renderCell: (line) => formatMoney(line.basic_salary),
    },
    {
      heading: translate('payroll.allowance'),
      renderCell: (line) => formatMoney(line.allowance_amount),
    },
    {
      heading: translate('payroll.deduction'),
      renderCell: (line) => formatMoney(line.deduction_amount),
    },
    {
      heading: translate('payroll.netPay'),
      renderCell: (line) => <strong>{formatMoney(line.net_pay)}</strong>,
    },
    {
      heading: translate('field.status'),
      renderCell: (line) => (
        <StatusBadge tone={line.paid_on ? 'success' : 'warning'}>
          {line.paid_on
            ? `${translate('accounting.paid')} · ${line.paid_on}`
            : translate('accounting.unpaid')}
        </StatusBadge>
      ),
    },
    {
      heading: '',
      isActionColumn: true,
      renderCell: (line) => (
        <div className="table-actions">
          {!line.paid_on && (
            <button
              className="button button--small"
              onClick={() =>
                window.confirm(translate('payroll.confirmMarkPaid')) &&
                submitToServer('payroll/mark-paid', { id: line.id })
              }
            >
              {translate('accounting.pay')}
            </button>
          )}
          {!line.paid_on && (
            <button
              className="button button--secondary button--small"
              onClick={() => setAdjustmentForm({ ...line })}
            >
              {translate('payroll.adjust')}
            </button>
          )}
          <button
            className="button button--secondary button--small"
            onClick={() =>
              openPrintSheet({
                kind: 'payslip',
                payrollLine: line,
                staffMember: findStaffMember(line.teacher_id),
              })
            }
          >
            {translate('payroll.payslip')}
          </button>
          {!line.paid_on && (
            <button
              className="button button--secondary button--small button--danger"
              onClick={() =>
                window.confirm(translate('common.confirmDelete')) &&
                submitToServer('payroll/delete', { id: line.id })
              }
            >
              {translate('common.delete')}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <TabBar
        activeTabKey={activeTabKey}
        onTabChange={setActiveTabKey}
        tabs={[
          { key: 'payroll', label: translate('payroll.title') },
          { key: 'salaryStructure', label: translate('payroll.salaryStructure') },
        ]}
      />

      {activeTabKey === 'salaryStructure' && (
        <div className="card">
          <div className="card-header">
            <h2>{translate('payroll.salaryStructure')}</h2>
          </div>
          <ResponsiveTable
            emptyMessage={translate('common.emptyState')}
            rows={teachers}
            columns={salaryStructureColumns}
          />
        </div>
      )}

      {activeTabKey === 'payroll' && (
        <>
          <div className="stat-grid">
            <StatCard
              iconName="money"
              value={formatMoney(sumNetPay(() => true))}
              label={translate('accounting.total')}
            />
            <StatCard
              iconName="money"
              value={formatMoney(sumNetPay((line) => line.paid_on))}
              label={translate('accounting.paid')}
            />
            <StatCard
              iconName="warning"
              value={formatMoney(sumNetPay((line) => !line.paid_on))}
              label={translate('accounting.outstanding')}
              isAlert
            />
          </div>
          <div className="card">
            <div className="card-header">
              <h2>{translate('payroll.title')}</h2>
              <div className="toolbar">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(changeEvent) => setSelectedMonth(changeEvent.target.value)}
                  aria-label={translate('payroll.month')}
                />
                <button
                  className="button"
                  onClick={() =>
                    submitToServer('payroll/generate', { payroll_month: selectedMonth })
                  }
                >
                  {translate('payroll.generate')}
                </button>
              </div>
            </div>
            <ResponsiveTable
              emptyMessage={translate('common.emptyState')}
              rows={linesOfSelectedMonth}
              columns={payrollColumns}
            />
          </div>
        </>
      )}

      {salaryForm && (
        <ModalDialog
          title={salaryForm.name}
          closeButtonLabel={translate('common.close')}
          onClose={() => setSalaryForm(null)}
        >
          <form
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              submitToServer(
                'payroll/set-salary',
                {
                  id: salaryForm.id,
                  basic_salary: salaryForm.basic_salary,
                  allowance_amount: salaryForm.allowance_amount,
                },
                () => setSalaryForm(null),
              );
            }}
          >
            <div className="form-grid">
              <FormField label={translate('payroll.basicSalary')}>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={salaryForm.basic_salary}
                  onChange={(changeEvent) =>
                    setSalaryForm({ ...salaryForm, basic_salary: changeEvent.target.value })
                  }
                />
              </FormField>
              <FormField label={translate('payroll.allowance')}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salaryForm.allowance_amount}
                  onChange={(changeEvent) =>
                    setSalaryForm({ ...salaryForm, allowance_amount: changeEvent.target.value })
                  }
                />
              </FormField>
            </div>
            <FormActions onCancel={() => setSalaryForm(null)} />
          </form>
        </ModalDialog>
      )}

      {adjustmentForm && (
        <ModalDialog
          title={findStaffMember(adjustmentForm.teacher_id)?.name || ''}
          closeButtonLabel={translate('common.close')}
          onClose={() => setAdjustmentForm(null)}
        >
          <form
            onSubmit={(submitEvent) => {
              submitEvent.preventDefault();
              submitToServer(
                'payroll/adjust',
                {
                  id: adjustmentForm.id,
                  allowance_amount: adjustmentForm.allowance_amount,
                  deduction_amount: adjustmentForm.deduction_amount,
                },
                () => setAdjustmentForm(null),
              );
            }}
          >
            <div className="form-grid">
              <FormField label={translate('payroll.allowance')}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentForm.allowance_amount}
                  onChange={(changeEvent) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      allowance_amount: changeEvent.target.value,
                    })
                  }
                />
              </FormField>
              <FormField label={translate('payroll.deduction')}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentForm.deduction_amount}
                  onChange={(changeEvent) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      deduction_amount: changeEvent.target.value,
                    })
                  }
                />
              </FormField>
            </div>
            <FormActions onCancel={() => setAdjustmentForm(null)} />
          </form>
        </ModalDialog>
      )}
    </>
  );
}
