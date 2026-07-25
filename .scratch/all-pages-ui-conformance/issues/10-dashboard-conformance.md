# 10 — Dashboard conformance

**What to build:** The hero adopts §5 and every figure across the dashboard widgets conforms to §3. The
widgets themselves stay cards — they're heterogeneous summaries of different domains, not a list of one
record type, so §2 doesn't apply.

The widgets do contain mini-lists (the recurring-status widget shows three items, the lending summary
shows balances). Those adopt the row spec's name-left / value-right alignment and tabular figures without
becoming full ledger groups with headers and counts.

**Blocked by:** 01, 03.

**Status:** ready-for-agent

- [ ] Hero adopts SummaryHeroCard
- [ ] Every figure across the widgets uses `Money` — including the recurring status, lending summary, runway and forecast widgets
- [ ] Widget mini-lists adopt the §2 row alignment and tabular figures, without group headers or counts
- [ ] No widget shows a badge on a majority state, per §4
- [ ] Widget empty states are left intact and still read correctly
- [ ] Verified with a render at 390px with data present and with the empty states showing
