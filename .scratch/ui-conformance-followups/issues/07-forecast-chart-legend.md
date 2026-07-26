# 07 — The cash flow forecast chart needs a legend

**What to build:** A reader can tell the forecast chart's three bands apart without hovering.

`CashFlowForecastChart` plots expected (solid, primary), best case (dashed, success) and worst case
(dashed, error). Those series are **only ever named inside the tooltip**, so a user who doesn't hover
sees three unlabelled lines and cannot tell which band is which — and on touch, hovering is not a
natural gesture at all.

This was found during the numeric conformance pass and deliberately left alone: it is a chart
comprehension change, not a formatting one.

Two things to weigh rather than defaulting: a legend costs vertical space on a 390px screen where the
chart is already ~250px, and the best/worst pair may read better as a labelled band than as two
separate legend entries. Consider direct labelling at the line ends as an alternative to a legend
block — it costs no vertical space and is usually easier to read.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent — not started. Filed after the UI conformance epic (`3507cc0..f293f9c`), which is complete and merged.

- [ ] All three series are identifiable at 390px without interaction
- [ ] The chart's plot area does not lose meaningful height to the labelling
- [ ] The solution works on touch, where there is no hover
- [ ] Colours still carry meaning for a reader who cannot distinguish red from green — the dash pattern or a direct label must do the work
- [ ] Verified with a render at 390px across the available time ranges
- [ ] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
