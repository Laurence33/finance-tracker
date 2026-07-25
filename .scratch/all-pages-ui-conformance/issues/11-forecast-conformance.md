# 11 — Forecast conformance

**What to build:** Forecast figures conform to §3. This page has no hero, so it needs nothing but the
`Money` primitive — which is why it can start as soon as ticket 01 lands.

Include the chart axis and tooltip figures. They're the most-compared numbers on the page, so
proportional digits hurt more here than anywhere else.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Breakdown figures use `Money`
- [ ] Chart tooltips and axis labels use tabular figures and the compact glyph treatment
- [ ] Breakdown cards follow the §2 row spec for name-left / value-right alignment
- [ ] Abbreviated axis figures (e.g. `12k`) stay abbreviated — this ticket doesn't make axes verbose in the name of consistency
- [ ] Verified with a render at 390px across the available time ranges
