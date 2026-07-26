# 03 — SummaryHeroCard molecule

**What to build:** The summary hero from §5 of `frontend/docs/ui-patterns.md` as one component: gradient
hue passed in by the caller, the oversized off-canvas highlight circle, an eyebrow with icon, the big
figure, an optional honesty caption, and up to three right-hand secondary stats separated by vertical
dividers. The recurring page adopts it.

Five pages (wallet, assets, lendings, budget, dashboard) currently hand-roll an older centred-icon
variant of this card, each with its own hue. This is the component they migrate onto in tickets 04, 05,
08, 09 and 10 — so its API has to accommodate all five hues and stat counts without any of them needing
a bespoke override.

**Blocked by:** 02 — only because both tickets touch the recurring page and would otherwise conflict.
There is no API dependency; cut this edge if you're comfortable resolving a small merge.

**Status:** done

- [x] Takes a hue, icon, eyebrow text, the figure, an optional caption and 0–3 secondary stats
- [x] Renders the gradient with `border: none` and the highlight circle inside `overflow: hidden`, per §5
- [x] Figure uses the coloured-surface `Money` variant at the responsive size from §5
- [x] Eyebrow carries the screen title, so an adopting page can delete its separate page heading
- [x] Secondary stats render with vertical dividers at `alpha('#ffffff', 0.25)`; more than three is either refused or explicitly documented as unsupported
- [x] The component's docblock states the §3 rule — a derived aggregate must be labelled (`upper bound`, `excludes X`) — so adopters don't drop the caption silently
- [x] `/recurring` hero renders identically to before at 390px
- [x] `npx tsc --noEmit` and `npm run build` are clean

## Outcome

Shipped in `ca51f35`. Merged to `main` and pushed.

API fit-tested against all five remaining callers before landing. The discriminating case
was lendings, whose conditional overdue stat needs a plain array rather than a tuple union, plus a
per-stat icon; budget needed the non-money `figure` escape hatch for its `Off` state. Verified by a
144-node geometry/style diff: zero differences.

Stats were later bottom-aligned (`a7e73d3`) because a stat with an icon and one without sat on
different baselines.
