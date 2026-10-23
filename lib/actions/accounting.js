// Accounting: fee types, invoice generation (with scholarship discounts) and payments.
import { execute, queryAll, queryOne, recordAudit } from '../database.mjs';
import { AppError } from '../app-error.js';
import {
  requireText,
  optionalText,
  toMoneyAmount,
  roundToCents,
  todayAsIsoDate,
} from '../validation.js';
import { inTransaction, nextSequenceNumber, deleteRowById } from './shared.js';

const FEE_CATEGORIES = ['student', 'enrollment', 'exam', 'other'];

/* ------------------------------ fee types ------------------------------ */

function validateFeeTypeInput(input) {
  if (!FEE_CATEGORIES.includes(input.fee_category)) throw new AppError('Invalid fee type');
  return {
    label: requireText(input.label),
    fee_category: input.fee_category,
    amount: toMoneyAmount(input.amount),
    // Optional: when set, a bulk "bill everyone" run only bills students of this class.
    class_name: optionalText(input.class_name, 50),
  };
}

export async function addFeeType(input, user) {
  const feeType = validateFeeTypeInput(input);
  await execute(
    'INSERT INTO fee_types (label, fee_category, amount, class_name) VALUES (?, ?, ?, ?)',
    [feeType.label, feeType.fee_category, feeType.amount, feeType.class_name],
  );
  await recordAudit(user, `fee type added: ${feeType.label}`);
}

export async function updateFeeType(input, user) {
  const feeType = validateFeeTypeInput(input);
  await execute(
    'UPDATE fee_types SET label = ?, fee_category = ?, amount = ?, class_name = ? WHERE id = ?',
    [feeType.label, feeType.fee_category, feeType.amount, feeType.class_name, Number(input.id)],
  );
  await recordAudit(user, `fee type updated: ${feeType.label}`);
}

export const importFeeTypes = inTransaction(async (feeTypeInputs, user) => {
  for (const input of feeTypeInputs) await addFeeType(input, user);
});

export const deleteFeeType = (input, user) =>
  deleteRowById('fee_types', input.id, 'fee type', user);

/* ------------------------------ invoices ------------------------------ */

// `billTo` says who receives the invoice. It is one of:
//   "all"                 every active student (or only the fee's class, if the fee has one)
//   "class:<class name>"  every active student of that class
//   "family:<Family ID>"  every student of that family
//   "<student id>"        one student
async function findStudentsToBill(billTo, feeType) {
  const text = String(billTo);

  if (text.startsWith('class:')) {
    return queryAll("SELECT id FROM students WHERE class_name = ? AND status = 'active'", [
      text.slice('class:'.length),
    ]);
  }
  if (text.startsWith('family:')) {
    return queryAll('SELECT id FROM students WHERE family_id = ?', [text.slice('family:'.length)]);
  }
  if (text === 'all') {
    return feeType.class_name
      ? queryAll("SELECT id FROM students WHERE class_name = ? AND status = 'active'", [
          feeType.class_name,
        ])
      : queryAll("SELECT id FROM students WHERE status = 'active'");
  }
  return [{ id: Number(text) }];
}

// The total discount from the student's active scholarships that apply to this fee,
// never more than the fee itself.
async function calculateScholarshipDiscount(studentId, feeType) {
  const today = todayAsIsoDate();
  const scholarships = await queryAll(
    `SELECT discount_type, discount_value
       FROM scholarships
      WHERE student_id = ?
        AND status = 'active'
        AND applies_to_fee_type IN ('all', ?)
        AND (valid_from = '' OR valid_from <= ?)
        AND (valid_to = '' OR valid_to >= ?)`,
    [studentId, feeType.fee_category, today, today],
  );

  const totalDiscount = scholarships.reduce((sum, scholarship) => {
    const discount =
      scholarship.discount_type === 'percent'
        ? (feeType.amount * scholarship.discount_value) / 100
        : scholarship.discount_value;
    return sum + discount;
  }, 0);
  return roundToCents(Math.min(totalDiscount, feeType.amount));
}

// Creates one invoice per student who should be billed for the chosen fee type.
export const createInvoices = inTransaction(async (input, user) => {
  const feeType = await queryOne('SELECT * FROM fee_types WHERE id = ?', [
    Number(input.fee_type_id),
  ]);
  if (!feeType) throw new AppError('Unknown fee type');

  const studentsToBill = await findStudentsToBill(input.bill_to, feeType);
  const studentIds = studentsToBill.map((student) => student.id);
  if (studentIds.length === 0) throw new AppError('No students match');

  for (const studentId of studentIds) {
    const discount = await calculateScholarshipDiscount(studentId, feeType);
    await execute(
      `INSERT INTO invoices (invoice_number, student_id, fee_label, total_amount, discount_amount, issued_on)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        await nextSequenceNumber('invoices', 'INV-', 5),
        studentId,
        feeType.label,
        feeType.amount - discount,
        discount,
        todayAsIsoDate(),
      ],
    );
  }
  await recordAudit(user, `${studentIds.length} invoice(s) created: ${feeType.label}`);
});

/* ------------------------------ payments ------------------------------ */

// Records a full or partial payment. It can never be more than what is still owed.
export const recordPayment = inTransaction(async (input, user) => {
  const invoice = await queryOne('SELECT * FROM invoices WHERE id = ?', [Number(input.invoice_id)]);
  const paymentAmount = toMoneyAmount(input.amount);

  const amountStillOwed = invoice ? roundToCents(invoice.total_amount - invoice.paid_amount) : 0;
  if (!invoice || paymentAmount <= 0 || paymentAmount > amountStillOwed) {
    throw new AppError('Invalid payment amount');
  }

  await execute('UPDATE invoices SET paid_amount = ROUND(paid_amount + ?, 2) WHERE id = ?', [
    paymentAmount,
    invoice.id,
  ]);
  await execute(
    'INSERT INTO payments (invoice_id, amount, paid_at, received_by_username) VALUES (?, ?, ?, ?)',
    [invoice.id, paymentAmount, new Date().toISOString(), user.username],
  );
  await recordAudit(user, `payment ${paymentAmount} on ${invoice.invoice_number}`);
});
