import type { ScopedMutator } from 'swr';
import { DERIVED_PREFIX, EXPENSES_PREFIX, INCOMES_PREFIX, KEYS } from './swr-keys';
import { format, subMonths } from 'date-fns';

/** The current month and the two before it, which the forecast averages. */
function forecastMonths(month: string): string[] {
  const [year, m] = month.split('-').map(Number);
  const anchor = new Date(year, m - 1, 1);
  return [0, 1, 2].map((back) => format(subMonths(anchor, back), 'yyyy-MM'));
}

/**
 * The keys each screen reads, and therefore what its pull-to-refresh re-fetches.
 *
 * Data rather than code, so adding a page is a line here — and so the list stays
 * readable next to the screens it describes. A page absent from this table
 * refreshes nothing: better a gesture that does nothing than one that fires a
 * surprise fan-out.
 */
const PAGE_KEYS: Record<string, (month: string) => string[]> = {
  '/': (month) => [KEYS.expenses(month), KEYS.incomes(month), KEYS.fundSources],
  '/wallet': () => [KEYS.fundSources, KEYS.transfers],
  // The budget page shows fund sources alongside the buckets.
  '/budget': () => [KEYS.budget, KEYS.fundSources],
  '/lendings': () => [KEYS.lendings, KEYS.fundSources],
  '/assets': () => [KEYS.assets, KEYS.fundSources],
  '/tags': (month) => [KEYS.tags, KEYS.expenses(month)],
  '/recurring': () => [KEYS.recurringExpenses, KEYS.fundSources],
  // Matching an income prefix here would revalidate every cached month — 16 of
  // them after a dashboard visit — on a screen that shows three.
  '/forecast': (month) => [
    ...forecastMonths(month).map((m) => KEYS.incomes(m)),
    KEYS.fundSources,
    KEYS.recurringExpenses,
    KEYS.lendings,
  ],
  '/dashboard': () => [KEYS.fundSources, KEYS.recurringExpenses, KEYS.lendings],
};

/**
 * What a pull-to-refresh on each screen should actually re-fetch.
 *
 * Scoped to the page rather than the whole cache: 2–4 requests per pull is
 * bounded and predictable, where refreshing everything would be 10+ against a
 * 10-burst limit and trivially spammable.
 *
 * Staleness classes are deliberately bypassed here — this gesture is the user
 * saying "I don't care how fresh you think this is". It is also the only way to
 * get fresh data without a reload, since `revalidateOnFocus` is off and TTLs are
 * evaluated once at hydration.
 */
export function buildPageRefresh(
  mutate: ScopedMutator,
  pathname: string,
  month: string,
): () => Promise<void> {
  const keysFor = PAGE_KEYS[pathname];

  return async () => {
    if (pathname === '/dashboard') {
      // The only page whose data is derived. Its aggregate fetcher reads
      // per-month keys from the cache, so revalidating it alone would re-derive
      // identical numbers and look like a refresh that did nothing. Drop the
      // months first, then re-derive.
      await mutate(
        (key) =>
          typeof key === 'string' &&
          (key.startsWith(EXPENSES_PREFIX) || key.startsWith(INCOMES_PREFIX)),
        undefined,
        { revalidate: false },
      );
      await mutate((key) => typeof key === 'string' && key.startsWith(DERIVED_PREFIX));
    }

    if (!keysFor) return;
    await Promise.all(keysFor(month).map((key) => mutate(key)));
  };
}
