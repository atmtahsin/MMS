'use client';

import { getAmountStillOwed, sumOf } from '../../helpers/money';
import { useAppContext } from '../AppContext';
import { StatCard } from './StatCard';

/**
 * Three statistic cards summarising all invoices: billed, paid and still outstanding.
 * Shown at the top of the Accounting and Settings screens.
 */
export function BillingSummaryStats() {
  const { translate, formatMoney, schoolData } = useAppContext();
  const { invoices } = schoolData;

  const totalBilled = sumOf(invoices, 'total_amount');
  const totalPaid = sumOf(invoices, 'paid_amount');
  const totalOutstanding = invoices.reduce(
    (runningTotal, invoice) => runningTotal + getAmountStillOwed(invoice),
    0,
  );

  return (
    <div className="stat-grid">
      <StatCard
        iconName="money"
        value={formatMoney(totalBilled)}
        label={translate('accounting.billed')}
      />
      <StatCard
        iconName="money"
        value={formatMoney(totalPaid)}
        label={translate('accounting.paid')}
      />
      <StatCard
        iconName="warning"
        value={formatMoney(totalOutstanding)}
        label={translate('accounting.outstanding')}
        isAlert
      />
    </div>
  );
}
