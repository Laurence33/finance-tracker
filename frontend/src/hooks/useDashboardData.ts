import { useMemo } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { HttpClient } from '@/utils/httpClient';
import { Expense } from '@/types/Expense';
import { Income } from '@/types/Income';
import { DashboardRange, getRangeMonths } from '@/utils/dashboard-helpers';
import { KEYS } from '@/utils/swr-keys';

type MonthBundle = { expenses: Expense[]; incomes: Income[] };

export type DashboardData = {
  loading: boolean;
  error: string | null;
  currentExpenses: Expense[];
  currentIncomes: Income[];
  previousExpenses: Expense[];
  previousIncomes: Income[];
  currentMonths: string[];
};

const EMPTY = {
  currentExpenses: [],
  currentIncomes: [],
  previousExpenses: [],
  previousIncomes: [],
  currentMonths: [],
};

/** The aggregate key is deliberately not persisted — see `swr-cache.ts`. */
export const dashboardKey = (range: DashboardRange) => `dashboard:${range}`;

export function useDashboardData(range: DashboardRange): DashboardData {
  const { cache, mutate } = useSWRConfig();
  const { current, previous } = useMemo(() => getRangeMonths(range), [range]);

  /**
   * One hook, not one per month.
   *
   * The month count varies with the range — 2 for 1M, 16 for YTD in August —
   * and `useSWR` cannot be called in a loop whose length changes, because React
   * requires a stable hook count. So a single aggregate key fans out inside its
   * fetcher, reading and writing the canonical per-month keys on the way. That
   * gives dedupe in both directions: the dashboard reuses months `AppContext`
   * already fetched, and `AppContext` reuses months the dashboard fetched.
   */
  const { data, error, isLoading } = useSWR(
    dashboardKey(range),
    async () => {
      const months = [...previous, ...current];

      const readCached = (key: string) => (cache.get(key)?.data as any)?.data;

      const loadMonth = async (month: string): Promise<MonthBundle> => {
        const expensesKey = KEYS.expenses(month);
        const incomesKey = KEYS.incomes(month);

        const cachedExpenses = readCached(expensesKey);
        const cachedIncomes = readCached(incomesKey);

        const [expensesRes, incomesRes] = await Promise.all([
          cachedExpenses
            ? Promise.resolve({ data: cachedExpenses })
            : HttpClient.get<any>(expensesKey).then((res) => {
                // Write it back under the canonical key so AppContext and any
                // other consumer share this fetch rather than repeating it.
                mutate(expensesKey, res, false);
                return res;
              }),
          cachedIncomes
            ? Promise.resolve({ data: cachedIncomes })
            : HttpClient.get<any>(incomesKey).then((res) => {
                mutate(incomesKey, res, false);
                return res;
              }),
        ]);

        return {
          expenses: expensesRes?.data?.expenses || [],
          incomes: incomesRes?.data?.incomes || [],
        };
      };

      // Requests go through httpClient's concurrency cap, so a 16-month range
      // stays inside the usage plan instead of bursting past it.
      const bundles = await Promise.all(months.map(loadMonth));
      const previousBundles = bundles.slice(0, previous.length);
      const currentBundles = bundles.slice(previous.length);

      return {
        currentExpenses: currentBundles.flatMap((b) => b.expenses),
        currentIncomes: currentBundles.flatMap((b) => b.incomes),
        previousExpenses: previousBundles.flatMap((b) => b.expenses),
        previousIncomes: previousBundles.flatMap((b) => b.incomes),
        currentMonths: current,
      };
    },
    { keepPreviousData: true },
  );

  return {
    ...(data ?? EMPTY),
    loading: isLoading,
    error: error ? (error as Error).message ?? 'Could not load dashboard data.' : null,
  };
}
