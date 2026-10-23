/** The currency symbol shown before every amount (Bangladeshi taka). */
const CURRENCY_SYMBOL = '৳';

/**
 * Creates the money and date formatters for the chosen language.
 * Bangla mode shows Bangla digits; English mode shows Western digits.
 *
 * @param {'en' | 'bn'} languageCode - The language the screen is currently shown in.
 * @returns {{ formatMoney: (amount: number) => string, formatDate: (isoDate: string) => string }}
 */
export function createFormatters(languageCode) {
  const isBangla = languageCode === 'bn';

  const numberFormatter = new Intl.NumberFormat(isBangla ? 'bn-BD' : 'en-US', {
    maximumFractionDigits: 2,
  });

  /** Formats an amount like "৳ 1,250.5". Missing values are shown as zero. */
  function formatMoney(amount) {
    const amountRoundedToCents = Math.round((amount || 0) * 100) / 100;
    return `${CURRENCY_SYMBOL} ${numberFormatter.format(amountRoundedToCents)}`;
  }

  /** Formats a "YYYY-MM-DD" date like "10 Jun 2019". Empty input gives an empty string. */
  function formatDate(isoDate) {
    if (!isoDate) return '';
    // Adding a time makes the browser read the date in local time, so it never shifts by a day.
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString(isBangla ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return { formatMoney, formatDate };
}

/**
 * Today's date as "YYYY-MM-DD" in the browser's local time zone.
 * (toISOString() would use UTC and can be a day off in Bangladesh late at night.)
 */
export function getTodayAsIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Today's weekday as the short key the school week uses ('sat', 'sun', ... 'fri').
 * The school week starts on Saturday, while JavaScript counts Sunday as day 0, so the
 * index is shifted by one.
 *
 * @param {string[]} weekdayKeys - The ordered week, normally WEEKDAYS from lib/record-types.js.
 */
export function getTodaysWeekdayKey(weekdayKeys) {
  const javascriptDayNumber = new Date().getDay(); // 0 = Sunday ... 6 = Saturday
  return weekdayKeys[(javascriptDayNumber + 1) % 7];
}
