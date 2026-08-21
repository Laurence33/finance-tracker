---
status: accepted
---

> The *decision* below is accepted. The hydration mechanism it depends on is not yet verified —
> see `.scratch/frontend-caching/issues/01-spike-ttl-at-hydration.md`. If that spike disproves it,
> the first consequence below is wrong and this ADR needs amending, not the code working around it.

# SWR owns all client-side GET caching; HTTP caching is deliberately off

Every GET in the frontend is cached by SWR, persisted to a per-identity localStorage
namespace, and expired against a per-endpoint staleness class. The API deliberately sends
`Cache-Control: private, no-store` on GET responses so the browser's HTTP cache never holds
a second, independently-clocked copy.

## Why not the browser's HTTP cache

`max-age` on the GET responses looks cheaper — an HTTP cache hit costs no JavaScript and no
request. But with SWR also holding a copy, the two caches expire on independent clocks: SWR
decides a key is stale and revalidates, the browser serves that request from its own cache,
and SWR believes it refreshed when it did not. The failure is silent and it lands hardest on
pull-to-refresh, which would appear to work while fetching nothing. One cache with one clock
is worth more than the marginal saving.

`no-cache` + ETag was also rejected: API Gateway does not compute ETags, so the Lambda would
have to run the DynamoDB query before it could answer 304. It saves bytes, not reads.

## Why not the stated reason

This work was originally motivated by DynamoDB read cost. That motivation does not survive
the numbers: the table is `PAY_PER_REQUEST`, every read is a `Query` against a per-user
partition, and reads are roughly 3% of what a request costs once API Gateway and Lambda are
counted. At one user the entire bill is under a dollar a month. The work is justified by a
crashing dashboard, a silently stale budget screen, and ~22 billed requests per page load on
mobile — not by savings.

## Consequences

- **Staleness is evaluated once per page load, at cache hydration.** SWR's `dedupingInterval`
  only suppresses refetches within a session, and its bookkeeping is not persisted by a cache
  provider — so it cannot govern the case this design exists for. Instead, expired entries are
  dropped while reading localStorage and `revalidateIfStale` is false. A consequence worth not
  "fixing": a tab left open all day never refreshes itself. That is intended, and it is why
  `revalidateOnFocus` is false and pull-to-refresh exists.
- **Financial records sit in plaintext on the device.** Accepted knowingly. The mitigation is
  the cache namespace (keyed by Cognito sub, so one user cannot read another's entries) plus a
  wipe on every sign-out path. The namespace is the guarantee; the wipe is hygiene.
- **`no-store` goes on GET responses only.** `createSuccessResponse` is shared with the OPTIONS
  branch of every handler, and landing the header there would undermine the `Access-Control-Max-Age`
  that halves the app's request count.
- **`AppContext` stays as a facade.** Its public shape is unchanged and its 26 consumers and 36
  `fetchX()` call sites are untouched; each field is backed by `useSWR` internally. This keeps the
  blast radius small at the cost of a context that is now a cache in disguise.
- **SWR's error retries are pinned off.** `httpClient` already retries 3× with backoff; SWR's
  default is unlimited, and the two would compound.
