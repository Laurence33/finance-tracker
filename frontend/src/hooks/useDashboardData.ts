import { useEffect, useState } from 'react';
import { HttpClient } from '@/utils/httpClient';
import { Expense } from '@/types/Expense';
import { Income } from '@/types/Income';
import { DashboardRange, getRangeMonths } from '@/utils/dashboard-helpers';

type MonthBundle = { expenses: Expense[]; incomes: Income[] };

async function fetchMonth(month: string): Promise<MonthBundle> {
  const [expensesRes, incomesRes] = await Promise.all([
    HttpClient.get<any>(`/expenses?month=${month}`),
    HttpClient.get<any>(`/incomes?month=${month}`),
  ]);
  return {
    expenses: expensesRes?.data?.expenses || [],
    incomes: incomesRes?.data?.incomes || [],
  };
}

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

export function useDashboardData(range: DashboardRange): DashboardData {
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'error'>>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const { current, previous } = getRangeMonths(range);
    const allMonths = [...previous, ...current];

    Promise.all(allMonths.map(fetchMonth))
      .then((bundles) => {
        if (cancelled) return;
        const previousBundles = bundles.slice(0, previous.length);
        const currentBundles = bundles.slice(previous.length);
        setData({
          currentExpenses: currentBundles.flatMap((b) => b.expenses),
          currentIncomes: currentBundles.flatMap((b) => b.incomes),
          previousExpenses: previousBundles.flatMap((b) => b.expenses),
          previousIncomes: previousBundles.flatMap((b) => b.incomes),
          currentMonths: current,
        });
      })
      // Without this the rejection was unhandled and the screen rendered a
      // dashboard of zeros: `loading` flips false either way, so a partial
      // failure was indistinguishable from a month with no activity.
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(EMPTY);
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load dashboard data.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  return { ...data, loading, error };
}
