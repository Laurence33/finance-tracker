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
export const LENDING_PAYMENTS_PREFIX = '/lendings/payments';
// The trailing slash is what separates a payment history from the collection.
export const RECURRING_PAYMENTS_PREFIX = '/recurring-expenses/';

/** Keys assembled from other keys rather than fetched directly. */
export const DERIVED_PREFIX = 'dashboard:';
