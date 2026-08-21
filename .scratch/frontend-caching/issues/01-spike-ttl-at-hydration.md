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

**Status:** ready-for-agent — not started.

- [ ] A minimal SWR + localStorage-provider setup exists on a throwaway branch
- [ ] Reload with a known-fresh cached key shows **zero** network requests for that key — verified
      in the network panel, not inferred from SWR's `isValidating`
- [ ] Reload with a known-expired key shows exactly one request for it
- [ ] The timestamp source is written down: whether it lives inside the cached value or alongside it
- [ ] A one-paragraph answer is appended under `## Answer`, and `docs/adr/0001-...` is corrected
      if the mechanism differs from what it currently describes
