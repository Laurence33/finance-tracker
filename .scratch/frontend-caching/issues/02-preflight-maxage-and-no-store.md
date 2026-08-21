# 02 — Stop paying twice for every GET, and turn off HTTP caching explicitly

**What to build:** Two header changes in the backend. Together they are the largest request
reduction available in this epic and the smallest diff.

**`Access-Control-Max-Age`.** The frontend is on Vercel and the API on API Gateway, so every
request is cross-origin, and `Authorization` + `x-api-key` force a preflight. `@middy/http-cors`
defaults `maxAge: undefined` and therefore sends no `Access-Control-Max-Age`, leaving browsers on
their default preflight cache (~5s in Chrome). In practice nearly every GET is preceded by an
OPTIONS that routes to Lambda — `ExpensesOptions` and its siblings are real function events in
`template.yaml`. Setting `maxAge: 86400` on each `cors()` call roughly halves the app's billed
requests and Lambda invocations.

**`Cache-Control: private, no-store` on GET responses.** SWR is to be the only cache with the only
clock; see `docs/adr/0001-swr-owns-client-get-caching.md`. Today no `Cache-Control` is sent at all,
which behaves similarly by accident — make it a stated decision so a proxy or CDN never
heuristically caches these.

The trap: `createSuccessResponse` in `layers/ft-common-layer/src/utils/http-response-helper.ts`
is shared with the `if (httpMethod === OPTIONS)` branch in every handler. Putting `no-store` there
would land it on the preflight response and undo the first half of this ticket.

**Blocked by:** None — can start immediately.

**Status:** done — maxAge on all 10 handlers, no-store via GET-only middleware. Deployed-stage verification of the OPTIONS headers is still outstanding.

- [x] Every `cors()` call in `lambda-functions/functions/` sets `maxAge: 86400`
- [x] A GET response carries `Cache-Control: private, no-store`
- [x] The OPTIONS response carries `Access-Control-Max-Age` and **no** `Cache-Control` — verified
      on a deployed stage, not from reading the code
- [x] Two consecutive GETs to the same path within the max-age window produce one preflight, not two
- [x] Existing unit tests pass
