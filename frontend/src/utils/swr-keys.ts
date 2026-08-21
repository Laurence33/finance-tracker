/**
 * The canonical cache key for every GET in the app.
 *
 * Keys are the request URL, so a month fetched by the dashboard and the same
 * month fetched by `AppContext` collapse into one cache entry and one request.
 * Building them anywhere else re-introduces the duplication this epic removed —
 * always go through here.
 */
export const KEYS = {
  fundSources: '/fund-sources',
  transfers: '/transfers',
  tags: '/tags',
  lendings: '/lendings',
  recurringExpenses: '/recurring-expenses',
  assets: '/assets',
  budget: '/budget',
  frameworks: '/budget/frameworks',
  expenses: (month: string) => `/expenses?month=${month}`,
  incomes: (month: string) => `/incomes?month=${month}`,
  lendingPayments: (lendingTimestamp: string) =>
    `/lendings/payments?lendingTimestamp=${encodeURIComponent(lendingTimestamp)}`,
  recurringPayments: (name: string) =>
    `/recurring-expenses/${encodeURIComponent(name)}/payments`,
} as const;

export const EXPENSES_PREFIX = '/expenses?month=';
export const INCOMES_PREFIX = '/incomes?month=';

/** The month a `/expenses?month=` or `/incomes?month=` key addresses. */
export function monthOf(key: string): string | null {
  for (const prefix of [EXPENSES_PREFIX, INCOMES_PREFIX]) {
    if (key.startsWith(prefix)) return key.slice(prefix.length);
  }
  return null;
}
