import type { ScopedMutator } from 'swr';
import {
  DERIVED_PREFIX,
  EXPENSES_PREFIX,
  INCOMES_PREFIX,
  KEYS,
  LENDING_PAYMENTS_PREFIX,
  RECURRING_PAYMENTS_PREFIX,
} from './swr-keys';

/**
 * What each mutation makes stale.
 *
 * Derived from what the backend actually writes in one transaction, not from
 * what a screen happens to display — that distinction is what caught both
 * stale-budget delete bugs. Trace the helpers, not their names: `IncomesService`
 * reaches buckets through `allocationDiffItems`, which wraps
 * `bucketIncrementItem`, so income looks bucket-free to a grep and is not.
 *
 *   ExpensesService  create :68   update :185  delete :235   -> buckets
 *   IncomesService   create :58   update :170  delete :213   -> buckets
 */
export function buildInvalidators(mutate: ScopedMutator, currentMonth: () => string) {
  /**
   * `/expenses?month=` is a family, not a key — a dashboard YTD toggle leaves 16
   * of them cached, and a write to one month makes exactly that month wrong. The
   * other fifteen are still correct, so they are left alone: revalidating the
   * family would fire 16 requests at a 10-burst limit.
   *
   * The dashboard's aggregate has to be re-derived explicitly. It is assembled
   * from the per-month keys, so refreshing a month does not by itself change it
   * — and with `revalidateIfStale: false` a mounted dashboard holding data never
   * revalidates on its own. Re-deriving is cheap: the fetcher reads every other
   * month straight from cache and only the refreshed month came off the wire.
   */
  const refreshMonth = (prefix: string, month: string) => {
    mutate(`${prefix}${month}`);
    mutate((key) => typeof key === 'string' && key.startsWith(DERIVED_PREFIX));
  };

  /**
   * Payment histories are fetched per record and only while a detail dialog is
   * open, so dropping them without fetching is enough — the next open refetches.
   */
  const evictHistories = (prefix: string) => {
    mutate((key) => typeof key === 'string' && key.startsWith(prefix), undefined, {
      revalidate: false,
    });
  };

  return {
    afterExpenseWrite() {
      refreshMonth(EXPENSES_PREFIX, currentMonth());
      mutate(KEYS.fundSources);
      mutate(KEYS.budget);
    },

    afterIncomeWrite() {
      refreshMonth(INCOMES_PREFIX, currentMonth());
      mutate(KEYS.fundSources);
      mutate(KEYS.budget);
    },

    // The fee is written as an expense in its own right (TransfersService.ts:83).
    afterTransferWrite() {
      mutate(KEYS.transfers);
      mutate(KEYS.fundSources);
      refreshMonth(EXPENSES_PREFIX, currentMonth());
      mutate(KEYS.tags);
    },

    // Settling a recurring expense writes one (RecurringExpensesService.ts:146).
    // Settling one also writes a RecurringExpensePayment, which the detail
    // dialog caches per record.
    afterRecurringPaymentWrite() {
      mutate(KEYS.recurringExpenses);
      mutate(KEYS.fundSources);
      refreshMonth(EXPENSES_PREFIX, currentMonth());
      evictHistories(RECURRING_PAYMENTS_PREFIX);
    },

    afterRecurringWrite() {
      mutate(KEYS.recurringExpenses);
    },

    // A repayment writes a LendingPayment, which the detail dialog caches per
    // record — without this the history stays stale for the whole session.
    afterLendingWrite() {
      mutate(KEYS.lendings);
      mutate(KEYS.fundSources);
      evictHistories(LENDING_PAYMENTS_PREFIX);
    },

    afterAssetWrite() {
      mutate(KEYS.assets);
      mutate(KEYS.fundSources);
    },

    afterTagWrite() {
      mutate(KEYS.tags);
    },

    afterFundSourceWrite() {
      mutate(KEYS.fundSources);
    },

    afterBudgetWrite() {
      mutate(KEYS.budget);
    },
  };
}

export type Invalidators = ReturnType<typeof buildInvalidators>;
