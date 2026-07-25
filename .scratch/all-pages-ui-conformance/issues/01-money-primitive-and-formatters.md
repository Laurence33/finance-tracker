# 01 — Money primitive and formatters

**What to build:** Every figure in the app renders with tabular numerals and a de-emphasised currency
glyph, from one component instead of the ~15 hand-rolled `₱{x.toLocaleString()}` sites scattered
through pages, item components and widgets. A `Money` component takes an amount or a min/max range and
renders it per §3 of `frontend/docs/ui-patterns.md`, with a variant for coloured surfaces (opacity-based
glyph instead of a theme text colour) and an optional leading sign for income. The formatters move out
of the recurring-expense helpers into a shared money util so no other feature has to reach into a
feature module for them.

This is the expand half of a wide refactor: `Money` lands beside the existing inline usages without
breaking them, then tickets 04–11 migrate their own surfaces, then ticket 12 closes the door.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `Money` renders fixed amounts per §3: `tabular-nums`, `letterSpacing: -0.01em`, glyph at `0.8em` / weight 500 / `text.secondary` / `mr: 2px`
- [ ] `Money` renders ranges compactly — one glyph, en dash, no spaces (`₱2,000–6,000`)
- [ ] A coloured-surface variant renders the glyph with opacity rather than a theme text colour, per §5
- [ ] An optional leading sign is supported for income, with the caller choosing the colour
- [ ] The long form (both glyphs, spaced dash) stays available for dialogs and forms where width is not contested; existing callers of the current long-form helper are unaffected
- [ ] Money formatting helpers live in a shared util, not in a per-feature helpers file
- [ ] The recurring row and hero adopt `Money` and render identically to today at 390px
- [ ] `npx tsc --noEmit` and `npm run build` are clean
