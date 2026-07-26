# 05 — Percentages get the same treatment as money

**What to build:** A percentage figure renders with tabular numerals and consistent typography from one
place, the way `Money` does for peso amounts.

`Money` is peso-only, so the budget page hand-rolls a local `PERCENT_SX` for its two percentage columns
(the per-bucket `Target n%` and the framework picker's split column). That's cheap in one file and will
be copied the moment a third page shows a percentage column — which is the exact drift the `Money`
primitive was created to stop.

Percentages need the same §3 treatment as money for the same reason: they sit in a repeating
right-aligned column where proportional digits fail to line up. What they don't need is a currency
glyph, so this is a sibling primitive rather than a `Money` option — unless you conclude otherwise, in
which case say why.

Check for other percentage columns before designing: the tags page and any budget progress labels are
the likely candidates.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Percentage figures render from one shared place with `tabular-nums` and the §3 tracking
- [ ] The budget page's local `PERCENT_SX` is gone
- [ ] Every other percentage column found in the audit uses it
- [ ] §3 gains a short note that the rule is about repeating numeric columns, not about currency specifically
- [ ] Budget page renders identically to before at 390px in both enabled and disabled states
- [ ] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
