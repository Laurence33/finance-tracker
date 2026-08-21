# 11 — Deferred: make AppContext's eager fetch page-scoped

**What this would build:** Some way for `AppContext` to fetch only what the current page reads,
rather than all ten endpoints on every mount.

Today the provider fetches eight collections plus two month-scoped ones regardless of destination.
`dashboard.tsx` reads exactly three of them (`fundSources`, `recurringExpenses`, `lendings`).

**Why it is deferred.** Once ticket `06` lands, those ten keys are in localStorage and inside their
staleness class, so the eager mount costs nothing on any load after the first. Page-scoping would
save requests on precisely one load, ever — and the two ways to do it are both bad trades:

- **Lazy keys with a `shouldFetch` gate** means every page gains an explicit data declaration that
  can silently go stale as the page changes.
- **Per-entity hooks** (`useFundSources()`, `useAssets()`) is a cleaner end state but rewrites 26
  components — the "replace AppContext outright" option that was already declined.

**When to reopen this.** If the app grows past ~15 endpoints, or if a page appears that needs data
the other pages never touch, the cold-load cost stops being a one-off. It is also worth revisiting
if `AppContext` ever stops being a facade — the argument above depends on the cache absorbing the
eager fetch.

**Blocked by:** 06 — the reasoning above assumes persistence exists.

**Status:** needs-triage — deferred by decision, not by capacity.
