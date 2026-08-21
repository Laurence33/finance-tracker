# 05 — Back AppContext with SWR without changing its shape

**What to build:** `swr` as a dependency, and each of `AppContext`'s ten fetched fields backed by
`useSWR` internally — with the context's public shape byte-identical.

`AppContext` is already a cache: it fetches everything once on mount and holds it for the session.
What it lacks is survival across reloads, dedupe with the call sites that bypass it, and any notion
of staleness. SWR supplies all three, and a facade keeps 26 consumer components and 36 `fetchX()`
call sites untouched — `fetchExpenses()` simply becomes `mutate('/expenses?month=' + selectedMonth)`.

Assign each key its staleness class:

```
/budget/frameworks   ∞     seeded and versioned by the backend
/tags                24h
/lendings            1h
/assets              1h
/fund-sources        5m    carries balances
/expenses?month=     5m
/incomes?month=      5m
/budget              5m
```

Config that is not negotiable, and why:

- `revalidateOnFocus: false` — on mobile, focus fires on every app-switch and would refire all ten.
- `revalidateOnReconnect: true`.
- `errorRetryCount: 0` — `httpClient.ts:74-89` already retries 3× with backoff; SWR's default is
  unlimited and the two compound.
- `revalidateIfStale: false`, with staleness enforced at hydration per ticket `01`.

**Blocked by:** 01

**Status:** done — facade landed; fetchX later removed by 08 once every consumer had moved.

- [x] `AppContext`'s exported interface is unchanged — no consumer component is edited
- [x] All ten fetches go through `useSWR`; no `HttpClient.get` call remains in `AppContext`
- [x] Each key's staleness class is declared in one table, not scattered across call sites
- [x] Changing `selectedMonth` and changing back issues no second request within the class lifetime
- [x] A GET failure still raises the error snackbar it does today
- [x] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
