import { TZDate } from '@date-fns/tz';
import { format, startOfMonth, subMonths } from 'date-fns';

export type DashboardRange = '1M' | '3M' | '6M' | 'YTD';

export const RANGE_LABELS: Record<DashboardRange, string> = {
  '1M': 'This month',
  '3M': '3M',
  '6M': '6M',
  YTD: 'YTD',
};

function today(): Date {
  return TZDate.tz('asia/singapore') as unknown as Date;
}

const fmt = (d: Date) => format(d, 'yyyy-MM');

export function getRangeMonths(
  range: DashboardRange,
  now: Date = today(),
): { current: string[]; previous: string[] } {
  if (range === 'YTD') {
    const currentMonthIdx = now.getMonth(); // 0-based
    const current: string[] = [];
    for (let i = 0; i <= currentMonthIdx; i++) {
      current.push(fmt(new Date(now.getFullYear(), i, 1)));
    }
    const previous: string[] = [];
    for (let i = 0; i <= currentMonthIdx; i++) {
      previous.push(fmt(new Date(now.getFullYear() - 1, i, 1)));
    }
    return { current, previous };
  }

  const count = range === '1M' ? 1 : range === '3M' ? 3 : 6;
  const allBack: Date[] = [];
  for (let i = 2 * count - 1; i >= 0; i--) {
    allBack.push(startOfMonth(subMonths(now, i)));
  }
  return {
    previous: allBack.slice(0, count).map(fmt),
    current: allBack.slice(count).map(fmt),
  };
}
