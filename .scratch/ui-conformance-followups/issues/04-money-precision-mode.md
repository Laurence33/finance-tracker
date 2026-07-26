# 04 — Let Money keep cents where cents matter

**What to build:** A way for a surface that must show exact cents to do so, without re-creating a
second money formatter.

`Money` currently emits either no decimals or exactly two, deciding automatically from whether the
value has a fractional part. That is right for most surfaces and it fixed a real defect (a `4820.50`
payment used to render `₱4,820.5`). But it can't express "always show cents", and one surface needs it:

On the budget page, "Total to seed **₱48,606**" sits directly above inputs still showing `26733.14`.
The total is rounded at the call site per §3, so the heading and the fields it sums visibly disagree.
The previous page-local `peso()` helper pinned two decimals; it was deleted, and hand-rolling a
replacement there would just re-create it.

Decide whether this is a `precision` prop, a variant, or a separate formatter — and where the boundary
sits, because most surfaces should keep rounding. §3's "rounding is the caller's job" stays true; this
is about *display* precision, not about `Money` starting to round.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent — not started. Filed after the UI conformance epic (`3507cc0..f293f9c`), which is complete and merged.

- [ ] A surface can opt into always-two-decimals without writing its own formatter
- [ ] The default behaviour is unchanged everywhere it is not opted into — verify the recurring, lendings and dashboard figures are byte-identical
- [ ] The budget seed total and its input fields agree
- [ ] §3 gains a line on when a surface should keep cents rather than round
- [ ] `npm run check:ui`, `npx tsc --noEmit` and `npm run build` clean
