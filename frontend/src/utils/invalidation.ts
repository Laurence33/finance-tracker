import type { ScopedMutator } from 'swr';
import { EXPENSES_PREFIX, INCOMES_PREFIX, KEYS } from './swr-keys';

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
   * of them cached and one write makes exactly one wrong. Revalidate that one so
   * the visible screen is right, and drop the others without fetching:
   * revalidating the family would fire 16 requests at a 10-burst limit.
   */
  const refreshMonth = (prefix: string, month: string) => {
    mutate(`${prefix}${month}`);
    mutate(
      (key) => typeof key === 'string' && key.startsWith(prefix) && key !== `${prefix}${month}`,
      undefined,
      { revalidate: false },
    );
  };

  return {
    afterExpenseWrite(month?: string) {
      refreshMonth(EXPENSES_PREFIX, month ?? currentMonth());
      mutate(KEYS.fundSources);
      mutate(KEYS.budget);
    },

    afterIncomeWrite(month?: string) {
      refreshMonth(INCOMES_PREFIX, month ?? currentMonth());
      mutate(KEYS.fundSources);
      mutate(KEYS.budget);
    },

    // The fee is written as an expense in its own right (TransfersService.ts:83).
    afterTransferWrite(month?: string) {
      mutate(KEYS.transfers);
      mutate(KEYS.fundSources);
      refreshMonth(EXPENSES_PREFIX, month ?? currentMonth());
      mutate(KEYS.tags);
    },

    // Settling a recurring expense writes one (RecurringExpensesService.ts:146).
    afterRecurringPaymentWrite(month?: string) {
      mutate(KEYS.recurringExpenses);
      mutate(KEYS.fundSources);
      refreshMonth(EXPENSES_PREFIX, month ?? currentMonth());
    },

    afterRecurringWrite() {
      mutate(KEYS.recurringExpenses);
    },

    afterLendingWrite() {
      mutate(KEYS.lendings);
      mutate(KEYS.fundSources);
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
