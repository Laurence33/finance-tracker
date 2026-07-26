# 02 — Ledger list primitives

**What to build:** The grouped-ledger structure that shipped on the recurring-expenses page becomes two
reusable pieces, so the remaining pages can adopt the pattern without re-deriving it: a **group card**
(uppercase eyebrow label, item count, full-bleed dividers between rows, staggered entrance) and a **row**
(flexible name plus an optional meta line on the left; value and optional exception status right-aligned).

The recurring page is refactored onto both and must render pixel-identically afterwards — it is the
regression oracle every later page ticket verifies against, so getting this right matters more than
getting it done quickly.

Spec: §2 of `frontend/docs/ui-patterns.md`.

**Blocked by:** 01 — rows render values through `Money`.

**Status:** done

- [x] Group card matches the §2 header spec and takes a label, a count and children
- [x] Row matches the §2 row spec, including `minHeight: 62`, the 2-line name clamp with `overflowWrap: anywhere`, and `alignItems: center` so a row with no meta line centres instead of top-pinning against dead space
- [x] Row supports an optional right-hand exception label with a caller-chosen colour, and an optional secondary value line beneath the main value
- [x] Row is a `ButtonBase` with the §2 press affordance, and works when no tap handler is passed
- [x] Rows carry no border or elevation of their own — the group card owns all dividers
- [x] Entrance stagger uses MUI's `keyframes` helper (never a `'@keyframes name'` key inside `sx`) and honours `prefers-reduced-motion`, per §7
- [x] Neither primitive contains page-specific vocabulary — nothing about frequencies, expenses or statuses
- [x] `/recurring` renders identically to before at 390px, verified with an actual render and not only a green build
- [x] `npx tsc --noEmit` and `npm run build` are clean

## Outcome

Shipped in `6e1a80b`. Merged to `main` and pushed.

`LedgerRow` (atom) + `LedgerGroupCard` (molecule). Verified by dumping computed geometry
and typography before and after and diffing in-browser: **zero differences** across container, hero,
4 group cards and all 11 rows.

Slots grew during the migrations: `amountColor` (`1cae8f5`) once two pages needed a coloured figure,
a footer gap the row owns rather than each caller reproducing it, and `role="presentation"` on the
inert path, which had been announcing itself as a control. `countLabel` was added here and later
deleted unused (`f293f9c`). A `RowActions` atom followed in `f293f9c`, because this row *documents*
that trailing handlers must stop propagation but could not provide it, so four item components each
reproduced the rail.
