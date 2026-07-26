# 04 — Lendings ledger

**What to build:** Borrower names render in full. This is the worst-starved list in the app: at 390px the
row has ~326px of content budget and spends it on three icon buttons (~102px), the amount plus a
`₱X paid` sub-amount (~110px), two stack gaps (24px) and an always-on status chip (~62px) — leaving
roughly **20px for the borrower's name**. Run the §1 width budget yourself to confirm before changing
anything.

Rows become ledger rows grouped by status, the majority `Active` badge disappears, overdue / partial /
paid become exception labels, and the pay / edit / delete icons move into the lending detail dialog that
already exists on this page.

**Blocked by:** 01, 02, 03.

**Status:** done

- [x] Borrower names render in full at 390px; a genuinely long name clamps to two lines rather than truncating
- [x] Grouped by status in a fixed domain order (overdue → active → partially paid → paid) with counts, preserving source order within each group
- [x] `Active` renders no badge at all — **but not by the mechanism written here.** The per-row exception labels this line asked for were removed in `f293f9c`; muting plus a coloured overdue amount carries the distinction instead. See Outcome.
- [x] Pay, edit and delete live in the detail dialog's title bar, before Close
- [x] Each of those actions closes the detail dialog before opening the next dialog, so a form never renders on top of the detail view
- [x] The `₱X paid` figure keeps its success colour as the row's secondary value line
- [x] Due date and fund source collapse into the single meta line and ellipsise rather than wrapping
- [x] Content clears the FAB when scrolled to the end, per §6
- [x] Hero adopts SummaryHeroCard; every figure on the page uses `Money`
- [x] Verified with a render at 390px including an overdue record, a partially paid record and a long borrower name
- [x] Any new rule this page forced is written back into `ui-patterns.md`

## Outcome

Shipped in `c52d5e6`. Merged to `main` and pushed.

The borrower name went from **84.7px to 235.3px** — measured with
`getBoundingClientRect`, not estimated. Also consolidated `isLendingOverdue`, which had been
copy-pasted into four files, into `lending-helpers`.

**One criterion here was later superseded.** This ticket asked for muted exception labels on
partially-paid and paid rows. Code review found every such row sits under a group header that already
names its state — exactly the case the §4 rule this branch wrote says to drop the label. All three
labels were removed in `f293f9c`; overdue keeps its urgency in the amount's colour instead, which
costs no width where a label cost up to ~87px of the name. The criterion's *intent* holds —
exceptions are still distinguished, the majority state still carries no badge — but not by the
mechanism written here.

**This ticket's own arithmetic was wrong.** It claimed ~20px for the name column; the real figure was
~85px. The over-count was the icon rail (`react-icons` ignores `fontSize` and renders at 1em) and the
amount block. §1 now carries the correction and a rule to measure rather than estimate.
