import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import useSWR from 'swr';
import {
  cacheNamespaceFor,
  createCacheProvider,
  stalenessFor,
  STALENESS,
} from './swr-cache';

const NS = cacheNamespaceFor('user-abc');

/** Seed localStorage the way a previous session would have left it. */
function seed(entries: Record<string, { data: unknown; ageMs: number }>) {
  const now = Date.now();
  const payload: Record<string, unknown> = {};
  for (const [key, { data, ageMs }] of Object.entries(entries)) {
    payload[key] = { data, ts: now - ageMs };
  }
  localStorage.setItem(NS, JSON.stringify(payload));
}

function Probe({ swrKey, fetcher }: { swrKey: string; fetcher: () => Promise<unknown> }) {
  const { data } = useSWR(swrKey, fetcher);
  return <div data-testid="out">{data ? JSON.stringify(data) : 'empty'}</div>;
}

function renderWithCache(swrKey: string, fetcher: () => Promise<unknown>) {
  return render(
    <SWRConfig
      value={{
        provider: createCacheProvider(NS),
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        errorRetryCount: 0,
      }}
    >
      <Probe swrKey={swrKey} fetcher={fetcher} />
    </SWRConfig>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('staleness classes', () => {
  it('gives every AppContext key a class', () => {
    for (const key of [
      '/budget/frameworks',
      '/tags',
      '/lendings',
      '/assets',
      '/fund-sources',
      '/budget',
      '/expenses?month=2026-08',
      '/incomes?month=2026-08',
      '/transfers',
      '/recurring-expenses',
    ]) {
      expect(Number.isNaN(stalenessFor(key))).toBe(false);
    }
  });

  it('treats seeded framework definitions as never stale', () => {
    expect(stalenessFor('/budget/frameworks')).toBe(Infinity);
  });

  it('matches month-scoped keys by prefix, not exact string', () => {
    expect(stalenessFor('/expenses?month=2026-01')).toBe(
      stalenessFor('/expenses?month=2099-12'),
    );
    expect(stalenessFor('/expenses?month=2026-01')).toBe(STALENESS.MINUTES_5);
  });

  it('falls back to the shortest class for an unrecognised key', () => {
    expect(stalenessFor('/something-new')).toBe(STALENESS.MINUTES_5);
  });
});

describe('TTL enforced at hydration', () => {
  // The claim the whole "fewer requests" goal rests on. If this fails,
  // persistence buys a fast first paint and nothing else.
  it('does not hit the network for an entry still inside its class', async () => {
    seed({ '/tags': { data: { tags: ['food'] }, ageMs: 60_000 } });
    const fetcher = vi.fn().mockResolvedValue({ tags: ['stale'] });

    renderWithCache('/tags', fetcher);

    expect(await screen.findByTestId('out')).toHaveTextContent('food');
    // Give any deferred revalidation a chance to fire before asserting silence.
    await new Promise((r) => setTimeout(r, 50));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('paints the cached value synchronously, before any fetch could resolve', () => {
    seed({ '/tags': { data: { tags: ['food'] }, ageMs: 60_000 } });
    renderWithCache('/tags', vi.fn().mockResolvedValue({}));
    expect(screen.getByTestId('out')).toHaveTextContent('food');
  });

  it('fetches when the entry has outlived its class', async () => {
    // /tags is a 24h class; 25h is expired.
    seed({ '/tags': { data: { tags: ['old'] }, ageMs: 25 * 60 * 60 * 1000 } });
    const fetcher = vi.fn().mockResolvedValue({ tags: ['fresh'] });

    renderWithCache('/tags', fetcher);

    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('fresh'));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('never expires an Infinity class however old the entry', async () => {
    seed({
      '/budget/frameworks': {
        data: { frameworks: ['JARS'] },
        ageMs: 365 * 24 * 60 * 60 * 1000,
      },
    });
    const fetcher = vi.fn().mockResolvedValue({ frameworks: [] });

    renderWithCache('/budget/frameworks', fetcher);

    expect(await screen.findByTestId('out')).toHaveTextContent('JARS');
    await new Promise((r) => setTimeout(r, 50));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('fetches when there is no cache at all', async () => {
    const fetcher = vi.fn().mockResolvedValue({ tags: ['first'] });
    renderWithCache('/tags', fetcher);
    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('first'));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('cache namespace', () => {
  it('keys the store on the user id', () => {
    expect(cacheNamespaceFor('user-abc')).not.toBe(cacheNamespaceFor('user-def'));
    expect(cacheNamespaceFor('user-abc')).toContain('user-abc');
  });

  it('cannot read another user\'s entries', async () => {
    seed({ '/tags': { data: { tags: ['mine'] }, ageMs: 1000 } });
    const fetcher = vi.fn().mockResolvedValue({ tags: ['theirs'] });

    render(
      <SWRConfig
        value={{
          provider: createCacheProvider(cacheNamespaceFor('user-def')),
          revalidateIfStale: false,
          revalidateOnFocus: false,
          errorRetryCount: 0,
        }}
      >
        <Probe swrKey="/tags" fetcher={fetcher} />
      </SWRConfig>,
    );

    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('theirs'));
  });

  it('degrades to an empty cache on unparseable storage', async () => {
    localStorage.setItem(NS, '{not json');
    const fetcher = vi.fn().mockResolvedValue({ tags: ['recovered'] });
    renderWithCache('/tags', fetcher);
    await waitFor(() => expect(screen.getByTestId('out')).toHaveTextContent('recovered'));
  });
});
