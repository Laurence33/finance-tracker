import { FundSource } from '@/types/FundSource';
import { RecurringExpense } from '@/types/RecurringExpense';
import { Lending } from '@/types/Lending';
import { ForecastDataPoint, ForecastEvent, ForecastHorizon } from '@/types/Forecast';

type GenerateForecastParams = {
  fundSources: FundSource[];
  recurringExpenses: RecurringExpense[];
  lendings: Lending[];
  averageMonthlyIncome: number;
  horizonDays: ForecastHorizon;
};

export function generateForecast({
  fundSources,
  recurringExpenses,
  lendings,
  averageMonthlyIncome,
  horizonDays,
}: GenerateForecastParams): ForecastDataPoint[] {
  const currentBalance = fundSources.reduce((sum, fs) => sum + Number(fs.balance), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weeklyIncome = (averageMonthlyIncome * 7) / 30;

  // Generate weekly date buckets
  const weeks: Date[] = [];
  for (let d = 0; d <= horizonDays; d += 7) {
    const weekDate = new Date(today);
    weekDate.setDate(weekDate.getDate() + d);
    weeks.push(weekDate);
  }

  const activeRecurring = recurringExpenses.filter(
    (re) => re.status === 'active' && re.frequency !== 'as_needed',
  );

  const activeLendings = lendings.filter((l) => l.status !== 'paid');

  let runningBest = currentBalance;
  let runningExpected = currentBalance;
  let runningWorst = currentBalance;

  const dataPoints: ForecastDataPoint[] = [];

  // First data point is today's actual balance
  dataPoints.push({
    weekDate: formatDate(today),
    best: currentBalance,
    expected: currentBalance,
    worst: currentBalance,
    events: [],
  });

  for (let i = 1; i < weeks.length; i++) {
    const weekStart = weeks[i - 1];
    const weekEnd = weeks[i];
    const events: ForecastEvent[] = [];

    // Income (spread evenly)
    runningBest += weeklyIncome;
    runningExpected += weeklyIncome;
    runningWorst += weeklyIncome;

    if (weeklyIncome > 0) {
      events.push({
        date: formatDate(weekEnd),
        type: 'income',
        label: 'Projected income',
        amount: weeklyIncome,
      });
    }

    // Recurring expenses
    for (const re of activeRecurring) {
      const occurrences = getOccurrencesInRange(re, weekStart, weekEnd);
      for (const occDate of occurrences) {
        let bestAmount: number;
        let expectedAmount: number;
        let worstAmount: number;

        if (re.amountType === 'fixed') {
          bestAmount = re.amount;
          expectedAmount = re.amount;
          worstAmount = re.amount;
        } else {
          bestAmount = re.amountMin;
          expectedAmount = (re.amountMin + re.amountMax) / 2;
          worstAmount = re.amountMax;
        }

        runningBest -= bestAmount;
        runningExpected -= expectedAmount;
        runningWorst -= worstAmount;

        events.push({
          date: formatDate(occDate),
          type: 'recurring',
          label: re.displayName,
          amount: -expectedAmount,
        });
      }
    }

    // Lending repayments
    for (const lending of activeLendings) {
      const promisedDate = new Date(lending.promisedDate + 'T00:00:00');
      if (promisedDate >= weekStart && promisedDate < weekEnd) {
        const remaining = lending.amount - lending.totalPaid;
        if (remaining > 0) {
          runningBest += remaining;
          runningExpected += remaining;
          // Worst case: borrower doesn't pay
          // runningWorst unchanged

          events.push({
            date: formatDate(promisedDate),
            type: 'lending_repayment',
            label: `${lending.borrower} repayment`,
            amount: remaining,
          });
        }
      }
    }

    dataPoints.push({
      weekDate: formatDate(weekEnd),
      best: Math.round(runningBest * 100) / 100,
      expected: Math.round(runningExpected * 100) / 100,
      worst: Math.round(runningWorst * 100) / 100,
      events,
    });
  }

  return dataPoints;
}

function getOccurrencesInRange(
  re: RecurringExpense,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const occurrences: Date[] = [];
  const start = new Date(re.startDate + 'T00:00:00');
  const end = re.endDate ? new Date(re.endDate + 'T00:00:00') : null;

  if (re.frequency === 'weekly') {
    // Find the first occurrence on or after rangeStart
    const daysSinceStart = Math.floor(
      (rangeStart.getTime() - start.getTime()) / 86400000,
    );
    const weeksSinceStart = Math.max(0, Math.floor(daysSinceStart / 7));
    const candidate = new Date(start);
    candidate.setDate(candidate.getDate() + weeksSinceStart * 7);

    while (candidate < rangeEnd) {
      if (candidate >= rangeStart && (!end || candidate <= end)) {
        occurrences.push(new Date(candidate));
      }
      candidate.setDate(candidate.getDate() + 7);
      if (candidate >= rangeEnd) break;
    }
  } else if (re.frequency === 'monthly') {
    const dayOfMonth = start.getDate();
    // Check each month in range
    const current = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), dayOfMonth);
    if (current < rangeStart) {
      current.setMonth(current.getMonth() + 1);
    }

    while (current < rangeEnd) {
      if (current >= rangeStart && current >= start && (!end || current <= end)) {
        occurrences.push(new Date(current));
      }
      current.setMonth(current.getMonth() + 1);
      if (current >= rangeEnd) break;
    }
  } else if (re.frequency === 'yearly') {
    const month = start.getMonth();
    const day = start.getDate();
    const current = new Date(rangeStart.getFullYear(), month, day);
    if (current < rangeStart) {
      current.setFullYear(current.getFullYear() + 1);
    }

    if (current >= rangeStart && current < rangeEnd && current >= start && (!end || current <= end)) {
      occurrences.push(new Date(current));
    }
  }

  return occurrences;
}

export function computeAverageIncome(monthlyTotals: number[]): number {
  const nonZero = monthlyTotals.filter((t) => t > 0);
  if (nonZero.length === 0) return 0;
  return nonZero.reduce((sum, t) => sum + t, 0) / nonZero.length;
}

function formatDate(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}
