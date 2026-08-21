# 06 — Persist the cache to localStorage, partitioned by identity

**What to build:** An SWR cache provider that hydrates from and writes back to localStorage under
a per-identity cache namespace.

This is the ticket that delivers "fewer requests" — a reload is what refires all ten AppContext
fetches today, and nothing before this survives one.

**The namespace is a safety requirement, not tidiness.** `httpClient.ts:118-121` signs the user out
on any 401 precisely because a different person can sign in next on the same browser. Without
partitioning, user B's first paint is user A's expenses, balances and lendings — rendered from cache
before any revalidation returns. Key the store on the Cognito sub so B cannot read A's entries even
if teardown fails, and wipe on sign-out as hygiene on top.

Three mechanics that are easy to get wrong:

- **The sub is needed synchronously.** `fetchAuthSession()` is async, so a module-scope provider
  cannot namespace itself. Build the provider inside the existing `<Authenticator>` render callback
  in `_app.tsx`, where the user is already in hand — the same place `AppContextProvider` mounts.
- **There are two sign-out exits**, not one: `httpClient.ts:121` and `Layout.tsx:91`. Both wipe.
- **Persist on `pagehide` / `visibilitychange`, not `beforeunload`.** Mobile Safari does not fire
  `beforeunload` reliably, and mobile is the target. A debounced write-through is safer still.

Financial records in plaintext on the device is an accepted trade-off — see
`docs/adr/0001-swr-owns-client-get-caching.md`.

**Blocked by:** 01, 05

**Status:** ready-for-agent — not started.

- [ ] Reload with a fresh cache issues zero requests for keys inside their staleness class
- [ ] Reload paints from cache before any network response arrives
- [ ] The storage key contains the Cognito sub
- [ ] Signing out via the nav menu and via a 401 both clear the namespace
- [ ] Signing in as a second user on the same browser never paints the first user's figures —
      test this explicitly with two accounts
- [ ] Backgrounding the tab on mobile Safari and returning still finds the cache written
- [ ] A corrupt or unparseable localStorage entry degrades to an empty cache, not a crash
