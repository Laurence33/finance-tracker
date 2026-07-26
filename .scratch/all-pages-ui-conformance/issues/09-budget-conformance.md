# 09 — Budget page conformance

**What to build:** Every figure on the budget page conforms to §3 and the hero adopts §5.

Bucket cards deliberately **stay cards**. They carry progress meters and per-bucket actions, so the §2
ledger pattern does not apply — and this ticket records that decision in the doc so a later session
sweeping for conformance doesn't "fix" them into ledger rows and make the page worse.

**Blocked by:** 01, 03.

**Status:** done

- [x] Hero adopts SummaryHeroCard, with a caption stating what the framework figures represent (cumulative bucket balances diverge from cash by design — say so)
- [x] All bucket, framework and allocation figures use `Money`
- [x] Bucket cards keep their card form
- [x] `ui-patterns.md` gains a short note on when cards beat ledger rows — records carrying meters plus per-record actions — citing this page as the example
- [x] Framework picker figures conform to §3
- [x] Verified with a render at 390px with budgeting enabled and with it disabled

## Outcome

Shipped in `52d8de8`. Merged to `main` and pushed.

Hero and every figure conform; the bucket cards deliberately stayed cards.

**This ticket's stated rationale was factually wrong.** It justified keeping the cards on "per-bucket
actions", and there are none in `budget.tsx` — no `IconButton`, no `onClick`. The agent rebuilt the
argument on what is verifiable: a framework defines a closed partition of two to six buckets the user
never adds to, so there is no scan-and-compare job, and each bucket's full-width meter is the content
rather than an accessory to a value. That reasoning is what went into the doc.

The doc note itself was reported and then **dropped by the coordinator**; it only landed in `6f2a405`
after code review caught the omission.
