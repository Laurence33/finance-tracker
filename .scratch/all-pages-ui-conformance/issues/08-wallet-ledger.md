# 08 — Wallet ledger

**What to build:** Fund sources stop being cards laid out inline in the page body and become a proper
grouped ledger list, so balances line up in one scannable column instead of drifting card to card. Credit
cards group separately from cash accounts — a kind that repeats on nearly every row is exactly what §2
says to hoist into a header. The hero and the transfer history rows conform too.

**Blocked by:** 01, 02, 03.

**Status:** ready-for-agent

- [ ] Fund sources render as a ledger list grouped by kind (cash accounts vs credit cards) with counts
- [ ] Balances are tabular-aligned; a negative or credit balance has a deliberate treatment rather than a bare minus sign inheriting body colour
- [ ] Hero adopts SummaryHeroCard, with a caption stating what the total balance includes — in particular how credit-card balances are counted
- [ ] Transfer history rows follow the §2 row spec and use `Money`
- [ ] Every figure on the page uses `Money`
- [ ] Verified with a render at 390px including a credit card, a zero-balance account and a long fund-source display name
- [ ] Any new rule this page forced (negative-balance treatment is the likely one) is written back into `ui-patterns.md`
