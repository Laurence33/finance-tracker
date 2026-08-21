# 03 — Fix the crashing dashboard, the stale budget, and two redundant fetches

**What to build:** Four small independent fixes. None of them need SWR and all of them are wrong
today, so they should ship ahead of the caching work rather than be folded into it.

**The dashboard can render empty and silent.** `useDashboardData` builds
`Promise.all(allMonths.map(fetchMonth))` with `.then()` and `.finally()` and no `.catch()`.
`HttpClient.get` throws via `handleHttpException`, so one request that exhausts its retries rejects
the whole thing: `setData` is skipped, `loading` flips false anyway, and the user sees a dashboard
of zeros plus an unhandled rejection. Add a `.catch` that surfaces the failure — an error state the
screen can render, not a swallowed one.

**Deleting a record leaves the budget wrong — in two places, not one.** Both entities write Buckets
on all three operations:

```
ExpensesService  create :68   update :185  delete :235
IncomesService   create :58   update :170  delete :213   (via allocationDiffItems)
```

The two form components already refetch `/budget`. The two *delete* paths did not:
`ExpenseItem.tsx` and `IncomeItem.tsx` refetched only their own collection and fund sources. Add the
budget refetch to both, gated on `budgetEnabled` the way `ExpenseForm.tsx:101` already does.

**One fetch that does nothing.** `index.tsx:141` calls `fetchExpenses()` in a mount effect, but
`AppContext` already fetches expenses on mount and on every `selectedMonth` change — the home page
fetched expenses twice on every load.

> **Correction.** This ticket originally also called `IncomeForm.tsx:141`'s `fetchBudget()`
> redundant, on the grounds that income touches no Bucket. That was wrong. `IncomesService` reaches
> buckets through `allocationDiffItems`, which wraps `bucketIncrementItem` — a grep for the wrapper
> name alone misses it. Income allocations are a first-class feature (`IncomeForm.tsx:206`). The
> call is correct and stays.

**Blocked by:** None — can start immediately.

**Status:** done — both delete paths, the dashboard .catch, and the duplicate home-page fetch.

- [x] A failed month request leaves the dashboard in a visible error state, never a silent empty one
- [x] No unhandled rejection reaches the console when a dashboard request fails
- [x] Deleting an expense with a Bucket updates the budget screen without a manual reload
- [x] Deleting an income with allocations updates the budget screen without a manual reload
- [x] The home page issues one `/expenses?month=` request per load, not two
- [x] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
