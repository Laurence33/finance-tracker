# 06 — Transactions search matches what the row shows

**What to build:** Searching the transactions list finds a record by any text visible on its row.

Search currently matches notes, amount, tags and (for income) source. The ledger migration changed what
a row displays: an expense with no notes is now named by its fund source `displayText`, so a row
reading **"GCash"** cannot be found by typing "GCash". The mismatch is newly visible, though the search
predicate itself is unchanged — the rule it was written against is what moved.

The principle worth encoding: **a list's search should match its rendered text.** Anything the row
shows, the query should reach; anything it doesn't show is a judgement call. Fund source is now shown,
so it must be searchable.

Check the same mismatch on the other lists that gained ledger rows — lendings, assets, tags and wallet
— and say in the ticket which of them have a search at all.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent — not started. Filed after the UI conformance epic (`3507cc0..f293f9c`), which is complete and merged.

- [ ] Typing a fund source's display text finds expenses and income funded from it
- [ ] Every field rendered on a transaction row is reachable by search
- [ ] Matching stays case-insensitive and keeps working with the existing filter chips
- [ ] The net-total footer reflects the filtered set, as it does today
- [ ] Other ledger lists audited for the same mismatch; findings recorded even if no change is needed
- [ ] Verified with a render: search a fund source, a tag, a note and an amount
- [ ] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
