import type { ScopedMutator } from 'swr';
import { DERIVED_PREFIX, EXPENSES_PREFIX, INCOMES_PREFIX, KEYS } from './swr-keys';
import { format, subMonths } from 'date-fns';

/**
 * What a pull-to-refresh on each screen should actually re-fetch.
 *
 * Scoped to the page rather than the whole cache: 2–4 requests per pull is
 * bounded and predictable, where refreshing everything would be 10+ against a
 * 10-burst limit and trivially spammable.
 *
 * Staleness classes are deliberately bypassed here — this gesture is the
 * user saying "I don't care how fresh you think this is". It is also the only
 * way to get fresh data without a reload, since `revalidateOnFocus` is off and
 * TTLs are evaluated once at hydration.
 */
export function buildPageRefresh(
  mutate: ScopedMutator,
  pathname: string,
  month: string,
): () => Promise<void> {
  // The current month and the two before it, which the forecast averages.
  const forecastMonths = () => {
    const [year, m] = month.split('-').map(Number);
    const anchor = new Date(year, m - 1, 1);
    return [0, 1, 2].map((back) => format(subMonths(anchor, back), 'yyyy-MM'));
  };

  const revalidate = (keys: string[]) => Promise.all(keys.map((key) => mutate(key)));

  switch (pathname) {
    case '/':
      return async () => {
        await revalidate([KEYS.expenses(month), KEYS.incomes(month), KEYS.fundSources]);
      };

    case '/wallet':
      return async () => {
        await revalidate([KEYS.fundSources, KEYS.transfers]);
      };

    case '/budget':
      return async () => {
        // The page shows fund sources alongside the buckets.
        await revalidate([KEYS.budget, KEYS.fundSources]);
      };

    case '/lendings':
      return async () => {
        await revalidate([KEYS.lendings, KEYS.fundSources]);
      };

    case '/assets':
      return async () => {
        await revalidate([KEYS.assets, KEYS.fundSources]);
      };

    case '/tags':
      return async () => {
        await revalidate([KEYS.tags, KEYS.expenses(month)]);
      };

    case '/recurring':
      return async () => {
        await revalidate([KEYS.recurringExpenses, KEYS.fundSources]);
      };

    case '/dashboard':
      return async () => {
        // The aggregate key's fetcher reads per-month keys from the cache, so
        // revalidating it alone would re-derive the same numbers and look like a
        // refresh that did nothing. Drop the months first, then re-derive.
        await mutate(
          (key) =>
            typeof key === 'string' &&
            (key.startsWith(EXPENSES_PREFIX) || key.startsWith(INCOMES_PREFIX)),
          undefined,
          { revalidate: false },
        );
        await mutate((key) => typeof key === 'string' && key.startsWith(DERIVED_PREFIX));
        await revalidate([KEYS.fundSources, KEYS.recurringExpenses, KEYS.lendings]);
      };

    case '/forecast':
      return async () => {
        // The page averages the current month and the two before it. Matching a
        // prefix here would revalidate every cached income month — 16 of them
        // after a dashboard visit — on a screen that shows three.
        await revalidate([
          ...forecastMonths().map((m) => KEYS.incomes(m)),
          KEYS.fundSources,
          KEYS.recurringExpenses,
          KEYS.lendings,
        ]);
      };

    default:
      // An unknown route refreshes nothing rather than guessing — better a
      // gesture that does nothing than one that fires a surprise fan-out.
      return async () => {};
  }
}
