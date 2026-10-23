/**
 * Money helpers shared by the accounting, payroll and dashboard screens.
 */

/** Rounds to two decimal places (paisa), avoiding floating-point artefacts like 0.1 + 0.2. */
export function roundToTwoDecimals(amount) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

/**
 * How much of an invoice is still unpaid.
 *
 * @param {{ total_amount: number, paid_amount: number }} invoice
 * @returns {number} The outstanding amount, never negative.
 */
export function getAmountStillOwed(invoice) {
  return roundToTwoDecimals(invoice.total_amount - invoice.paid_amount);
}

/** Adds up one numeric property across a list of records, e.g. sumOf(invoices, 'paid_amount'). */
export function sumOf(records, propertyName) {
  return roundToTwoDecimals(
    records.reduce((runningTotal, record) => runningTotal + (Number(record[propertyName]) || 0), 0),
  );
}
