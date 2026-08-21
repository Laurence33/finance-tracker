# 07 — Move the four GET sites that bypass AppContext onto SWR keys

**What to build:** SWR keys for the call sites the facade does not cover. Without this they get no
cache, no persistence, and — the part that matters — no dedupe with the keys `AppContext` already
holds.

- `useDashboardData.ts:11-12` — `/expenses?month=`, `/incomes?month=`
- `forecast.tsx:44-45` — `/incomes?month=` for the prior two months
- `LendingDetailDialog.tsx:67` — `/lendings/payments?lendingTimestamp=`
- `RecurringExpenseDetailDialog.tsx:61`

**The dashboard needs a specific shape.** It fetches a variable number of months — 2 for 1M, 12 for
6M, 16 for YTD in August — and `useSWR` cannot be called in a loop whose length changes, because
React requires a stable hook count. Use one aggregate key per range whose fetcher checks the cache
for each month first, fetches only the misses through the ticket `04` cap, and writes each month
back as its own canonical `/expenses?month=` key. That gives dedupe in both directions: the
dashboard reuses what `AppContext` fetched, and `AppContext` reuses what the dashboard fetched.

The two detail dialogs become per-record keys, which also means reopening the same lending or
recurring expense costs nothing.

**Blocked by:** 05

**Status:** done — all four sites on SWR keys; dashboard uses one aggregate key that shares per-month keys.

- [x] No `HttpClient.get` call remains outside the SWR fetcher — all 16 GET sites are keys
- [x] Loading the dashboard on a month `AppContext` already fetched issues no request for it
- [x] Loading the home page after the dashboard issues no request for the selected month
- [x] Per-month keys written by the dashboard fetcher are indistinguishable from ones `AppContext`
      wrote — same key string, same value shape
- [x] Reopening the same lending detail dialog issues no second request
- [x] The forecast page reuses the current month's income from cache rather than refetching
