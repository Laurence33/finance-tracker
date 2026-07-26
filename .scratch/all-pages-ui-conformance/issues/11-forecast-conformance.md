# 11 — Forecast conformance

**What to build:** Forecast figures conform to §3. This page has no hero, so it needs nothing but the
`Money` primitive — which is why it can start as soon as ticket 01 lands.

Include the chart axis and tooltip figures. They're the most-compared numbers on the page, so
proportional digits hurt more here than anywhere else.

**Blocked by:** 01.

**Status:** done

- [x] Breakdown figures use `Money`
- [x] Chart tooltips and axis labels use tabular figures and the compact glyph treatment
- [x] Breakdown cards follow the §2 row spec for name-left / value-right alignment
- [x] Abbreviated axis figures (e.g. `12k`) stay abbreviated — this ticket doesn't make axes verbose in the name of consistency
- [x] Verified with a render at 390px across the available time ranges

## Outcome

Shipped in `a4dfa1f`. Merged to `main` and pushed.

The narrowest ticket, and §2's grouping test correctly did **not** fire: no field
repeats across breakdown rows, and the breakdown is secondary detail under the chart rather than the
screen's spine, so the cards stayed and only the row spec's alignment was applied.

Two projections presented as fact were fixed: a caption claiming a "3-month average" when the helper
averages only non-zero months (it now reports the true count), and "Upcoming Events" implying
scheduled facts when a range expense's amount is a midpoint (now "Projected Events" with `projected ·
range amounts shown at midpoint`).

One caveat the agent recorded honestly: the axis `tabular-nums` is verified in code, not in a
screenshot — Recharts right-anchors tick text either way, so no screenshot can distinguish it. The
chart-figure rules from this page were reported and then **dropped by the coordinator**, landing in
`6f2a405`.
