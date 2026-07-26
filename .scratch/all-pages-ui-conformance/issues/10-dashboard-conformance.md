# 10 — Dashboard conformance

**What to build:** The hero adopts §5 and every figure across the dashboard widgets conforms to §3. The
widgets themselves stay cards — they're heterogeneous summaries of different domains, not a list of one
record type, so §2 doesn't apply.

The widgets do contain mini-lists (the recurring-status widget shows three items, the lending summary
shows balances). Those adopt the row spec's name-left / value-right alignment and tabular figures without
becoming full ledger groups with headers and counts.

**Blocked by:** 01, 03.

**Status:** done

- [x] Hero adopts SummaryHeroCard
- [x] Every figure across the widgets uses `Money` — including the recurring status, lending summary, runway and forecast widgets
- [x] Widget mini-lists adopt the §2 row alignment and tabular figures, without group headers or counts
- [x] No widget shows a badge on a majority state, per §4
- [x] Widget empty states are left intact and still read correctly
- [x] Verified with a render at 390px with data present and with the empty states showing

## Outcome

Shipped in `4f0a8c7`. Merged to `main` and pushed.

**Implemented under a session limit.** The agent was cut off mid-verification with all
ten assigned files already edited but nothing committed. The work was recovered from its abandoned
worktree, checked (tsc, build, zero raw currency interpolation on any dashboard surface), and then
render-verified separately at 390px — including the mixed-icon hero stat case this ticket asked
about, whose baselines do align after the central fix in `a7e73d3`.

Widgets stayed cards. Mini-lists took the row alignment without becoming groups with headers and
counts. Empty states survive.
