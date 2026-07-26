# 03 — Unify how direction is signed across surfaces

**What to build:** One rule for when a figure carries a `+` or a `-`, applied everywhere, and written
into §4 of `frontend/docs/ui-patterns.md`.

The UI conformance epic left two surfaces disagreeing, each defensible in isolation:

- **Transactions** signs only the minority direction — income gets `+` and `success.main`, expenses get
  neither. That follows §4 as written.
- **Forecast** signs both directions. Its agent argued §4's "minority takes a sign" presupposes a
  known, stable majority, and on a forecast the mix is data-dependent: a 90-day horizon with several
  lendings inside it can invert which direction dominates. A convention that flips based on data is
  not a convention. It deliberately did not touch the transactions page.

That argument looks right, which is why this is a decision ticket rather than a bug fix. Decide
whether §4's rule gains an exception for data-dependent mixes, or whether explicit both-way signing
becomes the general rule.

**A second, smaller defect belongs in the same decision.** The dashboard Net tile renders `+₱0` while
the transactions net card renders `₱0`. The cause is that `-0 >= 0` is `true` in JavaScript, so a
"sign if non-negative" test signs a zero. Zero has no direction and should never carry a sign;
whichever convention wins, fix this in the shared formatter rather than at each call site.

**Blocked by:** 02 — the zero-sign fix belongs inside the shared signed formatter, not scattered
across callers.

**Status:** ready-for-agent — not started. Filed after the UI conformance epic (`3507cc0..f293f9c`), which is complete and merged.

- [ ] A single documented rule for when a figure is signed, added to §4 of `ui-patterns.md` with the reasoning
- [ ] Transactions, forecast, dashboard and any other signing surface all follow it
- [ ] Zero never carries a sign, on any surface, including negative zero
- [ ] The rule states what colour does alongside the sign, so the two can't drift apart again
- [ ] Verified with a render of each affected surface, including a zero value
- [ ] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
