# 05 — Assets ledger

**What to build:** Assets render as a ledger list grouped by category. Grouping is what makes this page
work: hoisting the category out of the row returns roughly 74px to the name column, which means the two
row action icons can **stay** — this page has no detail dialog and doesn't need one. That is the
conditional rule in §2 applied deliberately rather than copying what the lendings page does.

Notes and fund-source provenance, currently two stacked captions, collapse into the single meta line.

**Blocked by:** 01, 02, 03.

**Status:** done

- [x] Grouped by category with counts; assets with no category fall into a clearly-labelled final group rather than disappearing
- [x] The category chip is gone from the rows
- [x] Notes and "Funded from X" collapse into one meta line that ellipsises instead of stacking two captions and growing the row
- [x] Edit and delete stay on the row; the ticket notes (in the doc, per §2) that the name column stopped being starved once the chip left, so a future session understands why this page differs from lendings
- [x] Existing descending-by-value sort is preserved within each group
- [x] Hero adopts SummaryHeroCard with a caption stating what the total value covers
- [x] Every figure uses `Money`
- [x] Content clears the FAB when scrolled to the end, per §6
- [x] Verified with a render at 390px including a long asset name, an uncategorised asset and an asset with no notes

## Outcome

Shipped in `9fd34a7`. Merged to `main` and pushed.

Grouping refunded the category chip's ~73px, taking the name from ~106px on one
`noWrap` line to 183px across the two-line clamp — so the row icons stayed and this page needed no
detail dialog, which is §2's conditional rule applied rather than copied from lendings.

Two rules came back into the doc from here: grouping can refund enough width to keep the icons, and
how to order groups when the grouped field is free text (aggregate descending, empty group pinned
last under an explicit label, trim before grouping).
