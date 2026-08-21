# 10 — Deferred: a month-range parameter for expenses and incomes

**What this would build:** `GET /expenses?from=YYYY-MM&to=YYYY-MM` and the same for incomes,
collapsing the dashboard's fan-out from 32 requests to 2.

**Why it is deferred, not rejected.** It was considered during the grilling session that produced
this epic and deliberately postponed to keep that work inside the frontend. Ticket `04`'s
concurrency cap paces the fan-out so it stops failing; it does not remove it. The dashboard still
issues 32 requests and 32 Lambda invocations on a cold YTD load.

**Why it is cheap when someone does pick it up.** The schema already supports it. Expense and income
`SK` *is* the ISO timestamp (`models/Expense.ts:29`), and `getAll` already does
`begins_with(SK, :month)`. A range is one line:

```
KeyConditionExpression: 'PK = :pk AND SK BETWEEN :from AND :to'
```

No GSI, no migration, no change to how items are written. 16 DynamoDB `Query`s become one, and 16
potential cold starts become one.

**What it would interact with.** Ticket `07` makes the dashboard write canonical per-month keys into
the cache. A range endpoint returns a span, so it would need to keep doing that decomposition —
otherwise the dedupe with `AppContext` is lost and the cache holds two overlapping representations
of the same months.

**Blocked by:** None — but do `04` and `07` first, or this lands on a moving target.

**Status:** needs-triage — deferred by decision, not by capacity.
