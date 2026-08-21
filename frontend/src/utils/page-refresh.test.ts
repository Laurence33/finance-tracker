import { describe, it, expect, vi } from 'vitest';
import { buildPageRefresh } from './page-refresh';
import { KEYS } from './swr-keys';

const MONTH = '2026-08';

function harness(pathname: string) {
  const revalidated: string[] = [];
  const filters: Array<{ fn: (k: string) => boolean; revalidate: boolean }> = [];

  const mutate = vi.fn((target: any, _data?: any, opts?: any) => {
    if (typeof target === 'function') {
      filters.push({ fn: target, revalidate: opts?.revalidate !== false });
    } else {
      revalidated.push(target);
    }
    return Promise.resolve();
  });

  return {
    run: buildPageRefresh(mutate as any, pathname, MONTH),
    revalidated,
    evicted: (key: string) => filters.some((f) => !f.revalidate && f.fn(key)),
    refetchedByFilter: (key: string) => filters.some((f) => f.revalidate && f.fn(key)),
  };
}

describe('page-scoped refresh', () => {
  it('home refreshes the visible month and balances', async () => {
    const h = harness('/');
    await h.run();
    expect(h.revalidated).toEqual([KEYS.expenses(MONTH), KEYS.incomes(MONTH), KEYS.fundSources]);
  });

  it('wallet refreshes only what wallet shows', async () => {
    const h = harness('/wallet');
    await h.run();
    expect(h.revalidated).toEqual([KEYS.fundSources, KEYS.transfers]);
  });

  it('stays bounded — no page pulls more than a handful of keys', async () => {
    for (const path of ['/', '/wallet', '/budget', '/lendings', '/assets', '/tags', '/recurring']) {
      const h = harness(path);
      await h.run();
      expect(h.revalidated.length).toBeLessThanOrEqual(4);
    }
  });

  it('an unknown route refreshes nothing rather than guessing', async () => {
    const h = harness('/some/new/page');
    await h.run();
    expect(h.revalidated).toEqual([]);
  });
});

describe('dashboard refresh', () => {
  // The aggregate fetcher reads months from cache, so revalidating it alone
  // would re-derive identical numbers and look like a no-op refresh.
  it('evicts the cached months before re-deriving', async () => {
    const h = harness('/dashboard');
    await h.run();
    expect(h.evicted(KEYS.expenses('2026-01'))).toBe(true);
    expect(h.evicted(KEYS.incomes('2026-01'))).toBe(true);
  });

  it('re-derives the aggregate for every cached range', async () => {
    const h = harness('/dashboard');
    await h.run();
    expect(h.refetchedByFilter('dashboard:YTD')).toBe(true);
    expect(h.refetchedByFilter('dashboard:1M')).toBe(true);
  });

  it('does not evict unrelated collections', async () => {
    const h = harness('/dashboard');
    await h.run();
    expect(h.evicted(KEYS.tags)).toBe(false);
    expect(h.evicted(KEYS.lendings)).toBe(false);
  });
});
