# 07 — Tags ledger

**What to build:** Tag rows show the tag name, spend against budget, and the over-budget state in ledger
form. Unlike the other list pages, this one carries a progress meter per row — and
`frontend/docs/ui-patterns.md` has no guidance for that yet.

So this ticket's real deliverable is a **decision**: where the meter sits relative to the name and value,
how much taller the row is allowed to get, and what a tag with no budget renders instead. Make the call,
implement it, and write it back into the doc as a new §2 subsection so the next meter-bearing list
doesn't re-litigate it.

**Blocked by:** 01, 02, 03.

**Status:** done

- [x] Rows render the tag name with `spent / budget` through `Money`, tabular-aligned down the column
- [x] The over-budget state reads as an exception per §4 — no badge or colour on the normal state
- [x] Tags with no budget render without a meter and without leaving dead space where one would be
- [x] A meter-row rule is added to `ui-patterns.md` under §2, with the chosen spec and the reasoning in one or two lines
- [x] Content clears the FAB when scrolled to the end, per §6
- [x] Verified with a render at 390px including an over-budget tag, a tag with no budget, a tag with no spend, and a long tag name

## Outcome

Shipped in `8d31f18`. Merged to `main` and pushed.

The meter-row rule was the real deliverable and it landed in §2. The load-bearing
finding: **a meter costs zero height** — 4px of bar plus its gap is 14px, which fits inside the slack
`minHeight: 62` already reserves, so metered and unmetered rows are both exactly 62px. That equality
is why they interleave in one group rather than being split into "budgeted" / "no budget" sections.

This page is also deliberately **not grouped**: nothing repeats on a tags row, so the single header
names the month instead. The `Over budget` label was shortened to `Over` in `f293f9c` for §4's
one-word rule.
