# Frontend caching and pull-to-refresh

**Status:** ready-for-agent — not started.

## What this is

Client-side caching of every GET via SWR, persisted across reloads, plus a pull-to-refresh
gesture as the deliberate way to force fresh data. See `docs/adr/0001-swr-owns-client-get-caching.md`
for the decision and its rejected alternatives.

## What this is not

Cost reduction. The original motivation was DynamoDB read spend; the numbers do not support it
(`PAY_PER_REQUEST`, all `Query`s on per-user partitions, reads ≈3% of a request's cost, one user,
under a dollar a month total). Do not justify any ticket here by savings.

The work is worth doing for three things that are real:

1. **A crashing dashboard.** `useDashboardData` fans out 32 parallel requests on YTD (48 in
   December) against a usage plan of `RateLimit: 5, BurstLimit: 10`, and its `Promise.all` has
   no `.catch` — one exhausted-retry 429 renders an empty dashboard with an unhandled rejection.
2. **A silently stale budget screen.** Deleting an expense refunds its Bucket
   (`ExpensesService.ts:234`) but no screen refetches `/budget`.
3. **~22 billed requests per page load.** Ten AppContext GETs plus the API-key bootstrap, each
   preceded by a CORS preflight that reaches Lambda, because `@middy/http-cors` sends no
   `Access-Control-Max-Age`.

## Order

`01` is a spike and gates the SWR work — if it fails, the persistence design is wrong and
tickets `05`–`09` need rethinking. `02`, `03` and `04` are independent and shippable immediately.

## Deferred

`10` (month-range endpoint) and `11` (page-scoped fetching) were considered and deliberately
deferred, not rejected. Both have reasoning worth reading before anyone proposes them again.
