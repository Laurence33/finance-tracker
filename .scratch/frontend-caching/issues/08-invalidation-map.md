# 08 — Centralise the invalidation map, derived from what the backend writes

**What to build:** One function per mutation kind in `AppContext`, replacing the hand-maintained
refetch calls currently scattered across 36 call sites in 19 files.

The map must be derived from the backend's `TransactWrite`s, not from what a screen displays. That
distinction already caught two live bugs (ticket `03`): neither delete path refetched `/budget`,
though both unwind bucket balances.

**Trace the helpers, not just their names.** `IncomesService` reaches buckets through
`allocationDiffItems`, which wraps `bucketIncrementItem` internally. Grepping for the wrapper alone
makes income look bucket-free, and it is not — that mistake was made once already while this epic
was being specified.

| Mutation | Actually writes | Must invalidate |
|---|---|---|
| Expense create / update / delete | expense, fund-source balance, bucket | `/expenses?month=`, `/fund-sources`, `/budget` |
| Income create / update / delete | income, fund-source balance, buckets | `/incomes?month=`, `/fund-sources`, `/budget` |
| Transfer (with fee) | transfer, two fund sources, an expense | `/transfers`, `/fund-sources`, `/expenses?month=`, `/tags` |
| Recurring payment | recurring, fund source, an expense | `/recurring-expenses`, `/fund-sources`, `/expenses?month=` |
| Lending / lending payment | lending, fund source | `/lendings`, `/fund-sources` |
| Asset create | asset, fund source | `/assets`, `/fund-sources` |
| Tag / fund source CRUD | itself | itself |

**Month families need care.** `/expenses?month=` is not one key — after a dashboard YTD toggle
there are 16 of them cached, and writing one expense makes exactly one wrong. Revalidate the
affected month immediately so the visible screen is correct, and evict every other month in the
family *without* revalidating, so the next dashboard visit refetches lazily. Revalidating the whole
family would fire 16 requests against a 10-burst limit and recreate the problem this epic exists to
fix.

Note that `TransfersService.ts:83` and `RecurringExpensesService.ts:146` construct expenses directly
rather than through `ExpensesService.create`, so those expenses carry no Bucket and do not invalidate
`/budget`. If that ever changes, this table changes with it.

**Blocked by:** 05

**Status:** ready-for-agent — not started.

- [ ] The map lives in one place; no component names a cache key directly
- [ ] Adding an expense on the dashboard updates that month and
      evicts the rest without fetching them — verify exactly one request is issued, not 16
- [ ] After eviction, revisiting the dashboard refetches the evicted months and nothing else
- [ ] Every row of the table above has a test or a manual verification note
- [ ] An expense dated outside `selectedMonth` still invalidates the month it actually belongs to
