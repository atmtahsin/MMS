// HR & payroll: each staff member's salary structure and the monthly payroll run.
import { execute, queryAll, queryOne, recordAudit } from '../database.mjs';
import { AppError } from '../app-error.js';
import { toMoneyAmount, roundToCents, todayAsIsoDate, requirePayrollMonth } from '../validation.js';
import { inTransaction } from './shared.js';

// Sets the basic salary and allowance that future payroll runs will use.
export async function setSalaryStructure(input, user) {
  const basicSalary = toMoneyAmount(input.basic_salary);
  const allowanceAmount = toMoneyAmount(input.allowance_amount || 0);
  const staffMember = await queryOne('SELECT name FROM teachers WHERE id = ?', [Number(input.id)]);
  if (!staffMember) throw new AppError('Staff member not found', 404);

  await execute('UPDATE teachers SET basic_salary = ?, allowance_amount = ? WHERE id = ?', [
    basicSalary,
    allowanceAmount,
    Number(input.id),
  ]);
  await recordAudit(user, `salary set for ${staffMember.name}`);
}

// Creates one payroll line for every active staff member who has a salary, once per month.
// Running it twice for the same month does not create duplicates.
export const generatePayroll = inTransaction(async (input, user) => {
  const payrollMonth = requirePayrollMonth(input.payroll_month);

  const staffToPay = await queryAll(
    "SELECT * FROM teachers WHERE status = 'active' AND basic_salary > 0",
  );
  if (staffToPay.length === 0) throw new AppError('No active staff have a salary set');

  let createdLineCount = 0;
  for (const staffMember of staffToPay) {
    const netPay = staffMember.basic_salary + staffMember.allowance_amount;
    const insertion = await execute(
      `INSERT OR IGNORE INTO payroll
         (teacher_id, payroll_month, basic_salary, allowance_amount, deduction_amount, net_pay)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [staffMember.id, payrollMonth, staffMember.basic_salary, staffMember.allowance_amount, netPay],
    );
    createdLineCount += insertion.changes;
  }
  await recordAudit(user, `payroll generated ${payrollMonth}: ${createdLineCount} line(s)`);
});

// Loads a payroll line that can still be changed. Paid lines are locked.
async function loadUnpaidPayrollLine(id) {
  const payrollLine = await queryOne('SELECT * FROM payroll WHERE id = ?', [Number(id)]);
  if (!payrollLine) throw new AppError('Not found', 404);
  if (payrollLine.paid_on) throw new AppError('Already paid');
  return payrollLine;
}

// Changes the allowance and deduction of one payroll line and recalculates the net pay.
export async function adjustPayrollLine(input, user) {
  const payrollLine = await loadUnpaidPayrollLine(input.id);
  const allowanceAmount = toMoneyAmount(input.allowance_amount);
  const deductionAmount = toMoneyAmount(input.deduction_amount);
  const netPay = roundToCents(payrollLine.basic_salary + allowanceAmount - deductionAmount);
  if (netPay < 0) throw new AppError('Invalid amount');

  await execute(
    'UPDATE payroll SET allowance_amount = ?, deduction_amount = ?, net_pay = ? WHERE id = ?',
    [allowanceAmount, deductionAmount, netPay, payrollLine.id],
  );
  await recordAudit(user, `payroll adjusted (id ${payrollLine.id})`);
}

export async function markPayrollLinePaid(input, user) {
  const payrollLine = await loadUnpaidPayrollLine(input.id);
  await execute('UPDATE payroll SET paid_on = ? WHERE id = ?', [todayAsIsoDate(), payrollLine.id]);
  await recordAudit(user, `salary paid ${payrollLine.net_pay} (payroll ${payrollLine.id})`);
}

export async function deletePayrollLine(input, user) {
  const payrollLine = await loadUnpaidPayrollLine(input.id);
  await execute('DELETE FROM payroll WHERE id = ?', [payrollLine.id]);
  await recordAudit(user, `payroll line removed (id ${payrollLine.id})`);
}
