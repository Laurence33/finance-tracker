import { RecurringExpense } from '@/types/RecurringExpense';
import {
  MoneyAmount,
  formatMoneyLong,
  formatMoneyValue,
} from '@/utils/money';

export function getCurrentPeriodKey(
  frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed',
): string {
  const now = new Date();

  if (frequency === 'as_needed') {
    return now.toISOString();
  }

  if (frequency === 'monthly') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  if (frequency === 'yearly') {
    return `${now.getFullYear()}`;
  }

  // Weekly - ISO week number
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getPeriodLabel(
  frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed',
  periodKey: string,
): string {
  if (frequency === 'as_needed') {
    return 'As needed';
  }

  if (frequency === 'monthly') {
    const [year, month] = periodKey.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  if (frequency === 'yearly') {
    return periodKey;
  }

  // Weekly
  const match = periodKey.match(/^(\d{4})-W(\d{2})$/);
  if (match) {
    return `Week ${Number(match[2])}, ${match[1]}`;
  }
  return periodKey;
}

/**
 * The recurring expense's amount as a `MoneyAmount`, collapsing the
 * `amountType` discriminant. Pass the result to `<Money>` or to the shared
 * formatters in `@/utils/money`.
 */
export function getRecurringAmount(re: RecurringExpense): MoneyAmount {
  return re.amountType === 'fixed'
    ? re.amount
    : { min: re.amountMin, max: re.amountMax };
}

/** Long form (`₱2,000 - ₱6,000`) for dialogs and forms. */
export function getAmountDisplay(re: RecurringExpense): string {
  return formatMoneyLong(getRecurringAmount(re));
}

/**
 * Amount without the currency symbol, ranges collapsed to a single en dash
 * (`2,000–6,000`).
 *
 * @deprecated Render `<Money amount={getRecurringAmount(re)} />` instead — it
 * styles the glyph for you. Kept so the string form stays available.
 */
export function getAmountValueDisplay(re: RecurringExpense): string {
  return formatMoneyValue(getRecurringAmount(re));
}

export function getFrequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    case 'as_needed':
      return 'As Needed';
    default:
      return frequency;
  }
}

export function isCurrentPeriodOverdue(
  frequency: 'weekly' | 'monthly' | 'yearly' | 'as_needed',
  paidPeriodKeys: Set<string>,
): boolean {
  if (frequency === 'as_needed') return false;
  const currentKey = getCurrentPeriodKey(frequency);
  return !paidPeriodKeys.has(currentKey);
}
