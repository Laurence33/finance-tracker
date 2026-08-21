import { describe, it, expect, vi } from 'vitest';
import { buildInvalidators } from './invalidation';
import { KEYS } from './swr-keys';

/**
 * Captures what each invalidator asks SWR to do. `mutate` is called either with
 * a literal key (revalidate it now) or with a filter fn plus
 * `{ revalidate: false }` (evict without fetching).
 */
function harness(month = '2026-08') {
  const revalidated: string[] = [];
  const evictors: Array<(key: string) => boolean> = [];

  const mutate = vi.fn((target: any, _data?: any, opts?: any) => {
    if (typeof target === 'function') {
      expect(opts).toMatchObject({ revalidate: false });
      evictors.push(target);
    } else {
      revalidated.push(target);
    }
    return Promise.resolve();
  });

  return {
    invalidators: buildInvalidators(mutate as any, () => month),
    revalidated,
    evicted: (key: string) => evictors.some((f) => f(key)),
    mutate,
  };
}

describe('expense writes', () => {
  it('invalidates the month, fund sources and the budget', () => {
    const h = harness();
    h.invalidators.afterExpenseWrite();
    expect(h.revalidated).toEqual(
      expect.arrayContaining([KEYS.expenses('2026-08'), KEYS.fundSources, KEYS.budget]),
    );
  });

  it('revalidates only the affected month and evicts the rest', () => {
    const h = harness('2026-08');
    h.invalidators.afterExpenseWrite();

    expect(h.revalidated).toContain(KEYS.expenses('2026-08'));
    // 16 cached months must not become 16 requests against a 10-burst limit.
    expect(h.revalidated).not.toContain(KEYS.expenses('2026-01'));
    expect(h.evicted(KEYS.expenses('2026-01'))).toBe(true);
    expect(h.evicted(KEYS.expenses('2026-08'))).toBe(false);
  });

  it('targets a month other than the selected one when given', () => {
    const h = harness('2026-08');
    h.invalidators.afterExpenseWrite('2026-03');
    expect(h.revalidated).toContain(KEYS.expenses('2026-03'));
    expect(h.evicted(KEYS.expenses('2026-08'))).toBe(true);
  });

  it('does not evict unrelated collections', () => {
    const h = harness();
    h.invalidators.afterExpenseWrite();
    expect(h.evicted(KEYS.tags)).toBe(false);
    expect(h.evicted(KEYS.lendings)).toBe(false);
    expect(h.evicted(KEYS.incomes('2026-01'))).toBe(false);
  });
});

describe('income writes', () => {
  // IncomesService reaches buckets through allocationDiffItems, so /budget is
  // as stale after an income write as after an expense one.
  it('invalidates the budget too', () => {
    const h = harness();
    h.invalidators.afterIncomeWrite();
    expect(h.revalidated).toEqual(
      expect.arrayContaining([KEYS.incomes('2026-08'), KEYS.fundSources, KEYS.budget]),
    );
  });

  it('evicts other income months but not expense months', () => {
    const h = harness('2026-08');
    h.invalidators.afterIncomeWrite();
    expect(h.evicted(KEYS.incomes('2026-01'))).toBe(true);
    expect(h.evicted(KEYS.expenses('2026-01'))).toBe(false);
  });
});

describe('writes that create an expense as a side effect', () => {
  it('transfer invalidates transfers, fund sources, the month and tags', () => {
    const h = harness();
    h.invalidators.afterTransferWrite();
    expect(h.revalidated).toEqual(
      expect.arrayContaining([
        KEYS.transfers,
        KEYS.fundSources,
        KEYS.expenses('2026-08'),
        KEYS.tags,
      ]),
    );
  });

  it('recurring payment invalidates recurring, fund sources and the month', () => {
    const h = harness();
    h.invalidators.afterRecurringPaymentWrite();
    expect(h.revalidated).toEqual(
      expect.arrayContaining([
        KEYS.recurringExpenses,
        KEYS.fundSources,
        KEYS.expenses('2026-08'),
      ]),
    );
  });
});

describe('writes that only touch their own collection and balances', () => {
  it('lending', () => {
    const h = harness();
    h.invalidators.afterLendingWrite();
    expect(h.revalidated).toEqual(
      expect.arrayContaining([KEYS.lendings, KEYS.fundSources]),
    );
    expect(h.revalidated).not.toContain(KEYS.budget);
  });

  it('asset', () => {
    const h = harness();
    h.invalidators.afterAssetWrite();
    expect(h.revalidated).toEqual(
      expect.arrayContaining([KEYS.assets, KEYS.fundSources]),
    );
  });

  it('tag', () => {
    const h = harness();
    h.invalidators.afterTagWrite();
    expect(h.revalidated).toEqual([KEYS.tags]);
  });

  it('fund source', () => {
    const h = harness();
    h.invalidators.afterFundSourceWrite();
    expect(h.revalidated).toEqual([KEYS.fundSources]);
  });

  it('budget config', () => {
    const h = harness();
    h.invalidators.afterBudgetWrite();
    expect(h.revalidated).toEqual([KEYS.budget]);
  });
});
