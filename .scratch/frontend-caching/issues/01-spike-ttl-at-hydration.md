# 01 — Spike: prove a fresh persisted key costs zero requests on reload

**What to build:** Nothing shippable. A throwaway branch that answers one question before the
rest of the epic is built on top of it.

The whole "fewer requests" goal rests on a claim that has not been run: that a persisted SWR
cache can be made to *not* revalidate on mount for entries still inside their staleness class.
SWR's `revalidateOnMount` defaults to true, and `dedupingInterval` — the obvious TTL knob —
tracks its bookkeeping in module-scope state that a cache provider does not persist. If that
is right, `dedupingInterval` governs only the within-session case, which is the case nobody
cares about.

The design assumed in the ADR is **TTL enforced at hydration**: when the provider reads
localStorage, drop entries whose stored timestamp exceeds their staleness class, then run with
`revalidateIfStale: false`. A surviving entry paints and costs nothing; a dropped one is simply
absent and fetches normally.

Prove or disprove that. If it is disproved, stop and re-open the design — do not work around it
in `05`.

**Blocked by:** None — can start immediately.

**Status:** resolved — mechanism confirmed, see `## Answer`.

- [ ] A minimal SWR + localStorage-provider setup exists on a throwaway branch
- [ ] Reload with a known-fresh cached key shows **zero** network requests for that key — verified
      in the network panel, not inferred from SWR's `isValidating`
- [ ] Reload with a known-expired key shows exactly one request for it
- [ ] The timestamp source is written down: whether it lives inside the cached value or alongside it
- [ ] A one-paragraph answer is appended under `## Answer`, and `docs/adr/0001-...` is corrected
      if the mechanism differs from what it currently describes

## Answer

**Confirmed. TTL enforced at hydration works, and `dedupingInterval` was indeed the wrong knob.**

The mechanism in `frontend/src/utils/swr-cache.ts` is: drop entries whose stored `ts` has outlived
their staleness class while reading localStorage, then run the app with `revalidateIfStale: false`.
A surviving entry is present in the cache at mount and SWR does not revalidate it; an expired one is
simply absent and fetches normally.

Verified by `frontend/src/utils/swr-cache.test.tsx` (12 tests), rather than by a manual browser
session, so the result stays as a regression test. The discriminating assertions:

- a `/tags` entry 60s old renders from cache and the fetcher is **never called** — asserted after a
  deliberate 50ms wait so a deferred revalidation would have fired
- the cached value paints synchronously, before any fetch could have resolved
- a `/tags` entry 25h old (its class is 24h) fetches exactly once
- a `/budget/frameworks` entry a year old never fetches, because its class is `Infinity`

**Timestamps live alongside the data**, as `{ data, ts }` per key, not inside SWR's own state — SWR's
cache values carry no age. The provider re-stamps a key only when its `data` reference actually
changes, so hydrated entries keep their original age instead of being reset to "fresh" by the first
render that reads them. That detail is load-bearing: stamping on every `set` would make every entry
immortal.

No correction to `docs/adr/0001-swr-owns-client-get-caching.md` is needed — the mechanism it
describes is the one that works. Its provisional caveat can be dropped.
