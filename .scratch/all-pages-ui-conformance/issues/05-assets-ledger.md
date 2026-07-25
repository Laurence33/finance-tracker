# 05 — Assets ledger

**What to build:** Assets render as a ledger list grouped by category. Grouping is what makes this page
work: hoisting the category out of the row returns roughly 74px to the name column, which means the two
row action icons can **stay** — this page has no detail dialog and doesn't need one. That is the
conditional rule in §2 applied deliberately rather than copying what the lendings page does.

Notes and fund-source provenance, currently two stacked captions, collapse into the single meta line.

**Blocked by:** 01, 02, 03.

**Status:** ready-for-agent

- [ ] Grouped by category with counts; assets with no category fall into a clearly-labelled final group rather than disappearing
- [ ] The category chip is gone from the rows
- [ ] Notes and "Funded from X" collapse into one meta line that ellipsises instead of stacking two captions and growing the row
- [ ] Edit and delete stay on the row; the ticket notes (in the doc, per §2) that the name column stopped being starved once the chip left, so a future session understands why this page differs from lendings
- [ ] Existing descending-by-value sort is preserved within each group
- [ ] Hero adopts SummaryHeroCard with a caption stating what the total value covers
- [ ] Every figure uses `Money`
- [ ] Content clears the FAB when scrolled to the end, per §6
- [ ] Verified with a render at 390px including a long asset name, an uncategorised asset and an asset with no notes
