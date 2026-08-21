import type { Cache, State } from 'swr';

/**
 * How long a cached response stays usable, by data class.
 *
 * These are the client's policy, not the API's — nothing in a response declares
 * a lifetime, and `Cache-Control: private, no-store` deliberately keeps the
 * browser's HTTP cache out of it. See
 * `docs/adr/0001-swr-owns-client-get-caching.md`.
 */
export const STALENESS = {
  FOREVER: Infinity,
  HOURS_24: 24 * 60 * 60 * 1000,
  HOUR_1: 60 * 60 * 1000,
  MINUTES_5: 5 * 60 * 1000,
} as const;

/**
 * Longest prefix wins, so `/budget/frameworks` is matched before `/budget`.
 * Anything unrecognised gets the shortest class: a new endpoint should be
 * over-fetched until someone classifies it deliberately, never under-fetched.
 */
const CLASSES: ReadonlyArray<readonly [string, number]> = [
  ['/budget/frameworks', STALENESS.FOREVER],
  ['/tags', STALENESS.HOURS_24],
  ['/lendings', STALENESS.HOUR_1],
  ['/assets', STALENESS.HOUR_1],
  ['/recurring-expenses', STALENESS.HOUR_1],
  ['/transfers', STALENESS.MINUTES_5],
  ['/fund-sources', STALENESS.MINUTES_5],
  ['/budget', STALENESS.MINUTES_5],
  ['/expenses', STALENESS.MINUTES_5],
  ['/incomes', STALENESS.MINUTES_5],
];

export function stalenessFor(key: string): number {
  let best: readonly [string, number] | undefined;
  for (const entry of CLASSES) {
    if (!key.startsWith(entry[0])) continue;
    if (!best || entry[0].length > best[0].length) best = entry;
  }
  return best ? best[1] : STALENESS.MINUTES_5;
}

/**
 * The storage key a user's cache lives under. Partitioning on the Cognito sub is
 * what stops the next person to sign in on this device from seeing the previous
 * user's balances painted from cache before any revalidation returns — the wipe
 * on sign-out is hygiene on top, not the guarantee.
 */
export function cacheNamespaceFor(userId: string): string {
  return `ft-cache:${userId}`;
}

export const CACHE_PREFIX = 'ft-cache:';

/**
 * Wipes every persisted cache on this device, not just the signed-in user's.
 *
 * Sign-out is the one moment we can be sure nobody is mid-session, and clearing
 * by prefix means a namespace orphaned by an interrupted sign-out doesn't sit on
 * the device forever. The namespace is still what *guarantees* one user cannot
 * read another's entries; this is hygiene on top of it.
 */
export function clearAllCacheNamespaces(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) doomed.push(key);
    }
    doomed.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Storage unavailable (private mode, quota) — nothing to clear.
  }
}

type Persisted = Record<string, { data: unknown; ts: number }>;

/**
 * Derived keys are rebuilt from the canonical ones they fan out to, so storing
 * them would duplicate every month they cover. Excluding them also means a
 * reload re-runs the derivation against an already-hydrated cache and makes no
 * requests at all.
 */
const DERIVED_PREFIXES = ['dashboard:'];

function isPersistable(key: string): boolean {
  return !DERIVED_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function readNamespace(namespace: string): Persisted {
  try {
    const raw = window.localStorage.getItem(namespace);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Persisted) : {};
  } catch {
    // Unparseable or unavailable storage degrades to a cold cache, never a crash.
    return {};
  }
}

/**
 * An SWR cache provider backed by localStorage, with staleness evaluated once —
 * here, at hydration.
 *
 * SWR's own `dedupingInterval` cannot do this job: its bookkeeping lives in
 * module state that a provider does not persist, so it only ever suppresses
 * refetches *within* a session. The case this design exists for is the reload,
 * where that state is gone. Dropping expired entries on the way in, and running
 * with `revalidateIfStale: false`, means a surviving entry paints and costs
 * nothing while an expired one is simply absent and fetches normally.
 *
 * Consequence worth not "fixing": a tab left open all day never refreshes itself.
 * That is why `revalidateOnFocus` is off and pull-to-refresh exists.
 */
export function createCacheProvider(namespace: string): () => Cache {
  return () => {
    const stored = readNamespace(namespace);
    const now = Date.now();

    const map = new Map<string, State<unknown, unknown>>();
    const stamps = new Map<string, number>();

    for (const [key, entry] of Object.entries(stored)) {
      if (!entry || typeof entry.ts !== 'number') continue;
      const ttl = stalenessFor(key);
      if (ttl !== Infinity && now - entry.ts >= ttl) continue;
      map.set(key, { data: entry.data });
      stamps.set(key, entry.ts);
    }

    const persist = () => {
      const out: Persisted = {};
      for (const [key, value] of map.entries()) {
        if (value?.data === undefined) continue;
        if (!isPersistable(key)) continue;
        out[key] = { data: value.data, ts: stamps.get(key) ?? Date.now() };
      }
      try {
        window.localStorage.setItem(namespace, JSON.stringify(out));
      } catch {
        // Quota exceeded or storage unavailable — the in-memory cache still works.
      }
    };

    if (typeof window !== 'undefined') {
      // `pagehide` and `visibilitychange` fire on mobile Safari where
      // `beforeunload` does not, and mobile is the target.
      window.addEventListener('pagehide', persist);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') persist();
      });
    }

    return {
      get: (key: string) => map.get(key),
      set: (key: string, value: State<unknown, unknown>) => {
        const previous = map.get(key);
        // Only re-stamp when data actually changed, so hydrated entries keep
        // their original age instead of being reset to "fresh" on every render.
        if (value?.data !== undefined && value.data !== previous?.data) {
          stamps.set(key, Date.now());
        }
        map.set(key, value);
      },
      delete: (key: string) => {
        map.delete(key);
        stamps.delete(key);
      },
      keys: () => map.keys(),
    } as Cache;
  };
}
