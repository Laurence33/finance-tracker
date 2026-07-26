# 02 — Shared chart number formatters

**What to build:** The two number shapes that only charts need live in `utils/money` alongside the
others, instead of being re-derived per chart.

Recharts callbacks (`tickFormatter`, `formatter`) must return a **string**, so they can't use the
`Money` component. Two shapes are currently hand-rolled:

- **A signed figure.** `CashFlowForecastChart` has a local `formatAxisTick` because §3 forbids
  `₱-105,000` — the sign goes before the glyph, and `Money`'s `sign` handling doesn't reach a string
  callback. Every chart with a signable axis will re-derive this.
- **An abbreviated figure.** `SpendOverTimeChart` hand-rolls `(v / 1000).toFixed(0) + 'k'`. With no
  shared home, the `12k` treatment can't be consistent across charts even where it's the right call.

Note the §3 rule the abbreviation must respect: **abbreviate on measurement, never for symmetry.** An
axis tick abbreviates when it would overflow its gutter, not because another chart abbreviates. Two
charts formatting ticks differently is not drift. This ticket provides the formatter; it does not
change which charts use it.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent — not started. Filed after the UI conformance epic (`3507cc0..f293f9c`), which is complete and merged.

- [ ] A signed money formatter lives in `utils/money`, putting the sign before the glyph
- [ ] It handles negative zero — `-0 >= 0` is `true` in JS, which is exactly how a zero renders as `+₱0` today (see ticket 03)
- [ ] A compact/abbreviated formatter lives in `utils/money`, with its rounding behaviour documented
- [ ] `CashFlowForecastChart` and `SpendOverTimeChart` use them instead of local copies
- [ ] Neither chart's rendered output changes — verify with a render, including a tooltip and an axis at the widest value each chart can hold
- [ ] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
