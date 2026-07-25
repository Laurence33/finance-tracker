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

**Status:** ready-for-agent

- [ ] Borrower names render in full at 390px; a genuinely long name clamps to two lines rather than truncating
- [ ] Grouped by status in a fixed domain order (overdue → active → partially paid → paid) with counts, preserving source order within each group
- [ ] `Active` renders no badge at all; overdue uses `error.main`, partially paid and paid render as muted exception labels per §4
- [ ] Pay, edit and delete live in the detail dialog's title bar, before Close
- [ ] Each of those actions closes the detail dialog before opening the next dialog, so a form never renders on top of the detail view
- [ ] The `₱X paid` figure keeps its success colour as the row's secondary value line
- [ ] Due date and fund source collapse into the single meta line and ellipsise rather than wrapping
- [ ] Content clears the FAB when scrolled to the end, per §6
- [ ] Hero adopts SummaryHeroCard; every figure on the page uses `Money`
- [ ] Verified with a render at 390px including an overdue record, a partially paid record and a long borrower name
- [ ] Any new rule this page forced is written back into `ui-patterns.md`
