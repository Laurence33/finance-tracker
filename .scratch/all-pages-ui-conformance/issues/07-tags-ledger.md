# 07 — Tags ledger

**What to build:** Tag rows show the tag name, spend against budget, and the over-budget state in ledger
form. Unlike the other list pages, this one carries a progress meter per row — and
`frontend/docs/ui-patterns.md` has no guidance for that yet.

So this ticket's real deliverable is a **decision**: where the meter sits relative to the name and value,
how much taller the row is allowed to get, and what a tag with no budget renders instead. Make the call,
implement it, and write it back into the doc as a new §2 subsection so the next meter-bearing list
doesn't re-litigate it.

**Blocked by:** 01, 02, 03.

**Status:** ready-for-agent

- [ ] Rows render the tag name with `spent / budget` through `Money`, tabular-aligned down the column
- [ ] The over-budget state reads as an exception per §4 — no badge or colour on the normal state
- [ ] Tags with no budget render without a meter and without leaving dead space where one would be
- [ ] A meter-row rule is added to `ui-patterns.md` under §2, with the chosen spec and the reasoning in one or two lines
- [ ] Content clears the FAB when scrolled to the end, per §6
- [ ] Verified with a render at 390px including an over-budget tag, a tag with no budget, a tag with no spend, and a long tag name
