# 06 — Expenses and income ledger

**What to build:** The transactions list on the main page groups by date, so the date that currently
repeats on every single row becomes a section header — the §2 grouping test in its clearest form. Tag
chips collapse into the dot-separated meta line, and each record drops from a ~120px multi-line card to a
ledger row.

Expenses and income share this list, so income has to stay distinguishable without reintroducing a
per-row badge: sign and colour carry it. This is the fattest ticket in the set; if it doesn't fit one
context window, split the list grouping from the two row components and land them in that order.

**Blocked by:** 01, 02, 03.

**Status:** done

- [x] Grouped by date, newest first, with a count per group; headers read "Today" / "Yesterday" where applicable and a plain date otherwise
- [x] The per-row date is gone; the time survives in the meta line
- [x] Tags render as dot-separated meta text, not chips
- [x] Income is distinguishable from an expense by sign and colour alone, with no badge on either
- [x] Notes stay visible but can never push a row beyond two lines of name plus one meta line
- [x] Search filtering still works, and the net-total footer figure uses `Money` and keeps its sign colouring
- [x] The three summary stat cards at the top conform to §3 numerals; their layout is left alone (they are not a hero)
- [x] Content clears the SpeedDial when scrolled to the end — check the clearance against the SpeedDial's own footprint, which differs from a plain FAB
- [x] Verified with a render at 390px in the all / expenses / income filters, with a search active, and with a record that has no tags and no notes

## Outcome

Shipped in `6a60a44`. Merged to `main` and pushed.

Grouped by date, so the date that repeated on every row became section headers. Income
stays distinguishable by sign and colour alone.

SpeedDial clearance was derived by measurement rather than copied: the dial's box is 184px, but while
closed only the 56px Fab is a persistent obstruction, so `pb: 12` is right — verified with 31.8px of
slack at scroll end.

This ticket also found that the 390px preview wrapper does **not** constrain media queries, a hole in
the verification harness that made every responsive render check invalid. Now documented.
