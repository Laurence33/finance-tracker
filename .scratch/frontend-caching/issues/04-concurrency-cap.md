# 04 — Cap in-flight GETs so fan-outs stop tripping the usage plan

**What to build:** A semaphore in `HttpClient` limiting concurrent GETs to 4.

The per-user usage plan is `RateLimit: 5, BurstLimit: 10` (`template.yaml:105-107`). The dashboard
fans out 32 parallel requests on YTD and 48 in December, so the burst bucket is exhausted before
most of them are served. `httpClient`'s retry interceptor already backs off on 429, which converts
the problem into latency and — per ticket `03` — sometimes into a blank screen.

Capping at 4 keeps the app inside the plan without touching the backend. Be honest about the cost:
YTD first load becomes roughly eight sequential waves, and all 32 requests are still billed. The
fan-out itself is only removed by ticket `10`, which is deferred.

**Mutations must not queue.** The cap applies to GETs only. A POST stuck behind four slow GETs
makes every form in the app feel broken.

**Put the semaphore in the axios request interceptor, not in `HttpClient.get`.** Two things in
`httpClient.ts` force this and both are easy to miss:

- The retry path calls `httpClient.request(config)` directly, bypassing the `HttpClient.get`
  static wrapper entirely. A cap that lives in the wrapper cannot see retries, which are exactly
  the requests that appear when the plan is already saturated.
- `getApiKey()` is awaited *inside* the request interceptor of every keyed request. If four GETs
  each hold a slot while awaiting a bootstrap call that itself needs a slot, the app deadlocks.
  The bootstrap already carries `skipApiKey: true` — use that same flag to bypass the cap.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent — not started.

- [ ] No more than 4 GETs are in flight at once, app-wide
- [ ] POST, PATCH, PUT and DELETE bypass the cap entirely
- [ ] Requests flagged `skipApiKey` bypass the cap, so the `/me/api-key` bootstrap cannot deadlock
      behind four GETs that are each waiting on it
- [ ] A YTD dashboard load completes with zero 429s
- [ ] Retries issued by the response interceptor pass through the cap — verify by saturating it and
      confirming a retry waits rather than jumping the queue
