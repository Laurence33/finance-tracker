# 08 — Wallet ledger

**What to build:** Fund sources stop being cards laid out inline in the page body and become a proper
grouped ledger list, so balances line up in one scannable column instead of drifting card to card. Credit
cards group separately from cash accounts — a kind that repeats on nearly every row is exactly what §2
says to hoist into a header. The hero and the transfer history rows conform too.

**Blocked by:** 01, 02, 03.

**Status:** done

- [x] Fund sources render as a ledger list grouped by kind (cash accounts vs credit cards) with counts
- [x] Balances are tabular-aligned; a negative or credit balance has a deliberate treatment rather than a bare minus sign inheriting body colour
- [x] Hero adopts SummaryHeroCard, with a caption stating what the total balance includes — in particular how credit-card balances are counted
- [x] Transfer history rows follow the §2 row spec and use `Money`
- [x] Every figure on the page uses `Money`
- [x] Verified with a render at 390px including a credit card, a zero-balance account and a long fund-source display name
- [x] Any new rule this page forced (negative-balance treatment is the likely one) is written back into `ui-patterns.md`

## Outcome

Shipped in `49c3868`. Merged to `main` and pushed.

Fund sources grouped into cash accounts vs credit cards; negatives render as
`Math.abs` + `sign="-"` + `amountColor`.

The judgement call this ticket flagged was resolved honestly: the headline figure is now **cash
only**, because the previous `fundSources.reduce(...)` netted a liability off an asset and produced a
number that was neither what you hold nor what you owe. Card debt became a separate conditional stat
that sums what is owed rather than netting the card group. The caption reads `cash accounts only ·
card balances not deducted`.
