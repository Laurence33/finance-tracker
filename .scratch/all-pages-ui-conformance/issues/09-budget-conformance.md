# 09 — Budget page conformance

**What to build:** Every figure on the budget page conforms to §3 and the hero adopts §5.

Bucket cards deliberately **stay cards**. They carry progress meters and per-bucket actions, so the §2
ledger pattern does not apply — and this ticket records that decision in the doc so a later session
sweeping for conformance doesn't "fix" them into ledger rows and make the page worse.

**Blocked by:** 01, 03.

**Status:** ready-for-agent

- [ ] Hero adopts SummaryHeroCard, with a caption stating what the framework figures represent (cumulative bucket balances diverge from cash by design — say so)
- [ ] All bucket, framework and allocation figures use `Money`
- [ ] Bucket cards keep their card form
- [ ] `ui-patterns.md` gains a short note on when cards beat ledger rows — records carrying meters plus per-record actions — citing this page as the example
- [ ] Framework picker figures conform to §3
- [ ] Verified with a render at 390px with budgeting enabled and with it disabled
