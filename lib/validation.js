// Small helpers for checking and cleaning values that arrive from forms and CSV files.
import { AppError } from './app-error.js';

// A required piece of text: trimmed, not empty, and not longer than maxLength.
export function requireText(value, maxLength = 200) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > maxLength) throw new AppError('Missing or invalid field');
  return text;
}

// An optional piece of text: trimmed and cut to maxLength. Anything that is not text becomes ''.
export function optionalText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

// Returns `value` if it is one of `allowedValues`, otherwise `fallback`.
export function oneOf(value, allowedValues, fallback) {
  return allowedValues.includes(value) ? value : fallback;
}

// Rounds to 2 decimal places (money has no smaller unit than a cent / poisha).
export function roundToCents(amount) {
  return Math.round(amount * 100) / 100;
}

// Turns form input into a money amount. Rejects negatives and non-numbers.
export function toMoneyAmount(value) {
  const amount = roundToCents(Number(value));
  if (!Number.isFinite(amount) || amount < 0) throw new AppError('Invalid amount');
  return amount;
}

// Today's date as "YYYY-MM-DD".
export function todayAsIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

// A payroll month must look like "2026-03".
export function requirePayrollMonth(value) {
  const month = String(value ?? '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new AppError('Invalid month');
  return month;
}
