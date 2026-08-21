import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { useDashboardData } from './useDashboardData';
import { KEYS } from '@/utils/swr-keys';
import { HttpClient } from '@/utils/httpClient';

vi.mock('@/utils/httpClient', () => ({
  HttpClient: { get: vi.fn() },
}));

const get = HttpClient.get as unknown as ReturnType<typeof vi.fn>;

function Probe() {
  const { currentExpenses, previousExpenses, loading, error } = useDashboardData('1M');
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ?? 'none'}</span>
      <span data-testid="current">{currentExpenses.length}</span>
      <span data-testid="previous">{previousExpenses.length}</span>
    </div>
  );
}

/** A fresh in-memory cache per test, optionally pre-seeded. */
function renderDashboard(seed?: Map<string, any>) {
  return render(
    <SWRConfig
      value={{
        provider: () => seed ?? new Map(),
        revalidateIfStale: false,
        revalidateOnFocus: false,
        errorRetryCount: 0,
        dedupingInterval: 0,
      }}
    >
      <Probe />
    </SWRConfig>,
  );
}

const expensesFor = (n: number) => ({
  data: { expenses: Array.from({ length: n }, (_, i) => ({ id: i })), totalExpenses: n },
});
const incomesFor = (n: number) => ({
  data: { incomes: Array.from({ length: n }, (_, i) => ({ id: i })), totalIncome: n },
});

beforeEach(() => {
  vi.clearAllMocks();
  get.mockImplementation((url: string) =>
    Promise.resolve(url.startsWith('/expenses') ? expensesFor(2) : incomesFor(1)),
  );
});

describe('useDashboardData', () => {
  it('fetches each month in the range once', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    // 1M = one current month + one previous, expenses and incomes each.
    expect(get).toHaveBeenCalledTimes(4);
  });

  it('writes each month back under its canonical key', async () => {
    const cache = new Map();
    renderDashboard(cache);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    const monthKeys = [...cache.keys()].filter(
      (k) => typeof k === 'string' && k.startsWith('/expenses?month='),
    );
    expect(monthKeys.length).toBeGreaterThan(0);
  });

  it('reuses a month AppContext already fetched instead of refetching it', async () => {
    // Seed the cache the way AppContext would have after loading the current month.
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const cache = new Map<string, any>([
      [KEYS.expenses(thisMonth), { data: expensesFor(7) }],
      [KEYS.incomes(thisMonth), { data: incomesFor(3) }],
    ]);

    renderDashboard(cache);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    const requested = get.mock.calls.map((c) => c[0]);
    expect(requested).not.toContain(KEYS.expenses(thisMonth));
    expect(requested).not.toContain(KEYS.incomes(thisMonth));
  });

  it('surfaces an error instead of rendering an empty dashboard', async () => {
    get.mockRejectedValue(new Error('Too Many Requests'));
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Too Many Requests'),
    );
    expect(screen.getByTestId('current')).toHaveTextContent('0');
  });

  it('does not leave loading true after a failure', async () => {
    get.mockRejectedValue(new Error('boom'));
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
  });

  it('splits the range into current and previous', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('current')).toHaveTextContent('2');
    expect(screen.getByTestId('previous')).toHaveTextContent('2');
  });
});
