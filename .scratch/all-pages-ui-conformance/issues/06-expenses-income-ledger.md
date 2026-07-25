# 06 — Expenses and income ledger

**What to build:** The transactions list on the main page groups by date, so the date that currently
repeats on every single row becomes a section header — the §2 grouping test in its clearest form. Tag
chips collapse into the dot-separated meta line, and each record drops from a ~120px multi-line card to a
ledger row.

Expenses and income share this list, so income has to stay distinguishable without reintroducing a
per-row badge: sign and colour carry it. This is the fattest ticket in the set; if it doesn't fit one
context window, split the list grouping from the two row components and land them in that order.

**Blocked by:** 01, 02, 03.

**Status:** ready-for-agent

- [ ] Grouped by date, newest first, with a count per group; headers read "Today" / "Yesterday" where applicable and a plain date otherwise
- [ ] The per-row date is gone; the time survives in the meta line
- [ ] Tags render as dot-separated meta text, not chips
- [ ] Income is distinguishable from an expense by sign and colour alone, with no badge on either
- [ ] Notes stay visible but can never push a row beyond two lines of name plus one meta line
- [ ] Search filtering still works, and the net-total footer figure uses `Money` and keeps its sign colouring
- [ ] The three summary stat cards at the top conform to §3 numerals; their layout is left alone (they are not a hero)
- [ ] Content clears the SpeedDial when scrolled to the end — check the clearance against the SpeedDial's own footprint, which differs from a plain FAB
- [ ] Verified with a render at 390px in the all / expenses / income filters, with a search active, and with a record that has no tags and no notes
