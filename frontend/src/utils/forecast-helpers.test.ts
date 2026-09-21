import { describe, it, expect } from 'vitest';
import {
  computeAverageSpending,
  generateForecast,
  isProjectedRecurring,
  recurringPaidInMonth,
} from './forecast-helpers';
import { RecurringExpense } from '@/types/RecurringExpense';

function recurring(overrides: Partial<RecurringExpense>): RecurringExpense {
  return {
    name: 'rent',
    displayName: 'Rent',
    amountType: 'fixed',
    amount: 10000,
    amountMin: 0,
    amountMax: 0,
    frequency: 'monthly',
    startDate: '2026-01-05',
    endDate: '',
    status: 'active',
    tags: [],
    notes: '',
    ...overrides,
  };
}

const RENT = recurring({});
const GROCERIES = recurring({ name: 'groceries', frequency: 'as_needed' });
const OLD_GYM = recurring({ name: 'gym', status: 'cancelled' });

const PAYMENTS = [
  { recurringName: 'rent', amount: 10000, expenseTimestamp: '2026-08-05 09:00:00.000' },
  { recurringName: 'rent', amount: 10000, expenseTimestamp: '2026-09-05 09:00:00.000' },
  { recurringName: 'groceries', amount: 3000, expenseTimestamp: '2026-08-12 09:00:00.000' },
  { recurringName: 'gym', amount: 1500, expenseTimestamp: '2026-08-01 09:00:00.000' },
  { recurringName: 'deleted-sub', amount: 500, expenseTimestamp: '2026-08-20 09:00:00.000' },
];

describe('recurringPaidInMonth', () => {
  it('nets only the expenses the forecast projects, in the month the expense landed', () => {
    expect(recurringPaidInMonth(PAYMENTS, [RENT, GROCERIES, OLD_GYM], '2026-08')).toBe(10000);
    expect(recurringPaidInMonth(PAYMENTS, [RENT, GROCERIES, OLD_GYM], '2026-09')).toBe(10000);
  });

  // Nothing projects these, so they are ordinary spending and must stay in
  // the average — otherwise they would be counted in neither place.
  it('leaves as-needed, cancelled and orphaned payments in the total', () => {
    expect(recurringPaidInMonth(PAYMENTS, [GROCERIES, OLD_GYM], '2026-08')).toBe(0);
  });

  it('shares its predicate with the forecast', () => {
    expect(isProjectedRecurring(RENT)).toBe(true);
    expect(isProjectedRecurring(GROCERIES)).toBe(false);
    expect(isProjectedRecurring(OLD_GYM)).toBe(false);
  });
});

describe('computeAverageSpending', () => {
  it('averages the non-recurring remainder and reports the months used', () => {
    expect(
      computeAverageSpending([
        { totalExpenses: 25000, recurringPaid: 10000 },
        { totalExpenses: 21000, recurringPaid: 10000 },
      ]),
    ).toEqual({ average: 13000, monthsUsed: 2 });
  });

  it('skips months with nothing recorded, but counts a month that nets to zero', () => {
    expect(
      computeAverageSpending([
        { totalExpenses: 0, recurringPaid: 0 },
        { totalExpenses: 10000, recurringPaid: 10000 },
        { totalExpenses: 4000, recurringPaid: 0 },
      ]),
    ).toEqual({ average: 2000, monthsUsed: 2 });
  });

  // A bill paid for a prior period can push recurring above the month's
  // total; letting that go negative would silently make the forecast rosier.
  it('clamps each month at zero', () => {
    expect(
      computeAverageSpending([
        { totalExpenses: 8000, recurringPaid: 20000 },
        { totalExpenses: 6000, recurringPaid: 0 },
      ]),
    ).toEqual({ average: 3000, monthsUsed: 2 });
  });

  it('reports no months when nothing is recorded', () => {
    expect(computeAverageSpending([])).toEqual({ average: 0, monthsUsed: 0 });
  });
});

describe('generateForecast spending', () => {
  const base = {
    fundSources: [{ balance: 100000 }] as never,
    recurringExpenses: [],
    lendings: [],
    averageMonthlyIncome: 0,
    horizonDays: 30 as const,
  };

  it('spreads spending evenly and equally across all three lines', () => {
    const data = generateForecast({ ...base, averageMonthlySpending: 3000 });
    const weekly = (3000 * 7) / 30;
    expect(data[1].expected).toBeCloseTo(100000 - weekly, 2);
    expect(data[1].best).toBe(data[1].expected);
    expect(data[1].worst).toBe(data[1].expected);
    expect(data[1].events).toEqual([
      expect.objectContaining({ type: 'spending', amount: -weekly }),
    ]);
  });

  it('is a no-op when omitted', () => {
    const data = generateForecast(base);
    expect(data[1].expected).toBe(100000);
    expect(data[1].events).toEqual([]);
  });
});
