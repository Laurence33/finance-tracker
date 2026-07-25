# UI patterns

Design rules for this app's screens. Mobile-first (design at 360–390px, let it breathe on desktop),
MUI v7 + `sx`, no extra styling libraries. `src/theme.ts` is the source of truth for colour, radius
and font — these rules never hardcode a palette hex, they reference theme keys.

The first pattern below (**Ledger list**) was extracted from the recurring-expenses rebuild. Reference
implementation: `src/components/atoms/RecurringExpenseItem.tsx` and `src/pages/recurring.tsx`.

---

## 1. The width budget — run this before styling any list row

Most mobile list-row ugliness is not a styling problem, it's an arithmetic problem: something with
`flexShrink: 0` is spending width the name needed. Compute the budget before you touch anything else.

At a 390px viewport with `<Container maxWidth="sm">`:

```
390  viewport
-32  Container gutters (16 each side at xs)
=358 card width
-32  row padding (px: 2)
=326 content width  ← the entire budget
```

At 360px the budget is ~296px. Every fixed-width sibling subtracts from it, and whatever remains is
what the flexible name column gets. The pre-rebuild recurring row spent it like this:

| Element | Cost |
|---|---|
| Amount, `₱2,000 – ₱6,000` (repeated currency sign, spaced dash) | ~130px |
| Edit + delete `IconButton size="small"` | ~68px |
| Two `Stack` gaps (`spacing={1.5}`) | 24px |
| `Active` chip, inline with the name inside the flexible block | ~66px + 8px gap |
| **Left for the name** | **~30px** |

30px is two characters and an ellipsis — hence `Do…`, `el…`, `Ga…`. After dropping the chip and the
icon buttons and compacting the range to `₱2,000–6,000` (~100px), the name column went to ~214px.

**Rule:** when names truncate, do this sum first and cut the biggest non-essential spender. Do not
reach for a smaller font or a wider container.

---

## 2. Ledger list

For a screen that is mostly one kind of record with a number attached — recurring expenses, lendings,
assets, transfers.

**Use it when** there are 5+ homogeneous records and the user's job is to scan and compare values.
**Don't** use it for heterogeneous feeds, for records whose primary content is prose (notes,
activity), or for 1–3 items where a card each is fine.

### Anatomy

```
┌─ MONTHLY ─────────────────────── 7 items ─┐   group header: uppercase eyebrow + count
│  Boarding                          ₱1,500 │   row: name (flexible) / amount (fixed, right)
│  Bills                                    │   meta line: tags, dot-separated
│  ─────────────────────────────────────────│   full-bleed divider, owned by the group
│  electricity                 ₱2,000–6,000 │
│  Bills                                    │
│  ─────────────────────────────────────────│
│  Claude Code Max             ₱1,200–1,500 │   non-active row: muted name + amount
│  tech                            COMPLETED│   status label, only because it's an exception
└───────────────────────────────────────────┘
```

One `Card` per group, `overflow: 'hidden'`, rows separated by `<Stack divider={<Divider />}>`. Rows
are **not** cards — `RecurringExpenseItem` deliberately has no border or elevation of its own, so a
row can never be styled independently of the group that owns it.

### Row spec

| Part | Value |
|---|---|
| Container | `ButtonBase`, `display: flex`, `alignItems: center`, `width: 100%`, `textAlign: left` |
| Padding / height | `px: 2, py: 1.5, minHeight: 62` |
| Press affordance | `'&:hover': { bgcolor: 'action.hover' }`, `transition: 'background-color 0.18s ease'` |
| Inner stack | `direction="row" alignItems="flex-start" spacing={1.5}` + `width: '100%'` |
| Name | `0.9375rem / 600 / lineHeight 1.3`, 2-line clamp, `overflowWrap: 'anywhere'` |
| Meta | `0.75rem`, `text.secondary`, single line with ellipsis, omitted entirely when empty |
| Amount block | `flexShrink: 0`, right-aligned |

`alignItems: 'center'` on the `ButtonBase` plus `width: '100%'` on the inner `Stack` is what makes a
row with no meta line sit centred instead of top-pinned against 19px of dead space. Verify the
no-meta case — optional fields make it reachable.

### Grouping

Group **only when a field repeats on nearly every row.** Hoisting that field into the section header
is what buys the name column its width; grouping for its own sake just adds chrome. Here, `Monthly ·`
appeared on all 10 rows and became four section headers.

Header spec: `px: 2, py: 1.25`, `bgcolor: alpha(theme.palette.primary.main, 0.05)`, bottom divider,
label at `0.6875rem / 700 / letterSpacing 0.14em / uppercase / primary.dark`, count on the right at
`0.6875rem / 600 / text.secondary`.

Sort groups in a fixed domain order (`monthly → weekly → yearly → as_needed`), not alphabetically.
Within a group, put active records first and otherwise **preserve source order** — silently
re-sorting by value hides the order the user created things in.

### Row actions

Row-level action icons cost ~68px of the name's budget. **Remove them only when the name column is
starved** — and if you do, the detail dialog must gain them, in its title bar, before `Close`.

When an action moves into a dialog, close the current dialog before opening the next or they stack:

```tsx
const handleEditFromDetail = (re: RecurringExpense) => {
  setDetailExpense(null);   // always first
  handleEdit(re);
};
```

---

## 3. Numbers

These rules apply everywhere numbers appear, not just in ledger rows.

- **`fontVariantNumeric: 'tabular-nums'`** on every figure in a repeating column, so digits form a
  true right-aligned column instead of jittering. Pair with `letterSpacing: '-0.01em'` at body sizes.
- **De-emphasise a repeating currency glyph.** When `₱` appears on every row it is chrome, not data:

  ```tsx
  <Box component="span" sx={{ fontSize: '0.8em', fontWeight: 500, color: 'text.secondary', mr: '2px' }}>
    ₱
  </Box>
  ```

  On coloured surfaces use `opacity: 0.8` and `fontSize: '0.6em'` instead of `text.secondary`.
- **Compact ranges:** `₱2,000–6,000` — one currency sign, en dash, no spaces. Saves ~30px over
  `₱2,000 – ₱6,000`. Formatter: `getAmountValueDisplay` in `src/utils/recurring-helpers.ts` returns
  the value without the glyph so the glyph can be styled separately. Keep the long form
  (`getAmountDisplay`) for dialogs and forms, where width is not contested.
- **Label derived aggregates honestly.** A total that resolves ranges to `amountMax` and skips
  as-needed items is not "the" total — say so in a `0.6875rem` caption: `upper bound · excludes
  as-needed`. Never put a derived total in a group header where it sits directly above the rows it
  approximates; the mismatch reads as a bug.

---

## 4. Status economy

**Badge the exceptions, never the majority state.** An `Active` chip on 8 of 10 rows carries no
information while spending ~66px and drawing the eye with a saturated fill.

- Majority/expected state: render nothing.
- Exception states: mute the record (`text.secondary` name, `text.disabled` amount) and add a
  micro-label under the amount at `0.65rem / 700 / letterSpacing 0.08em / uppercase` —
  `error.main` for destructive/cancelled, `text.disabled` for benign/completed.
- Full `Chip` components belong in detail dialogs and forms, where one instance is on screen.

---

## 5. Summary hero card

One per screen, above the list.

- Gradient `linear-gradient(135deg, …main 0%, …dark 100%)` on a `Card` with `border: 'none'`. Keep the
  hue consistent with the page's existing role colour — don't re-hue one page in isolation.
- Depth comes from one oversized off-canvas circle at `alpha('#ffffff', 0.09)` inside
  `overflow: 'hidden'`, not from a second gradient.
- Left-aligned, three tiers: eyebrow (icon + `0.6875rem / 700 / letterSpacing 0.16em / uppercase`),
  the figure (`{ xs: '1.75rem', sm: '2rem' } / 700 / tabular-nums`), then the honesty caption.
- Secondary stats go right, as a `Stack direction="row"` with a
  `<Divider orientation="vertical" flexItem>` at `alpha('#ffffff', 0.25)` — value above
  `0.625rem` uppercase label. Two or three, never more.
- The hero carries the screen's title in its eyebrow, which removes the need for a separate page
  heading above the list.

---

## 6. Chrome and clearance

- Page container: `<Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>`.
- `pb: 12` (96px) is FAB clearance, and it is load-bearing. `Layout` adds `pb: '80px'` for the bottom
  nav; the FAB sits at `bottom: 88` and is 56px tall, so it occupies 88–144px up from the viewport
  bottom. Without ~96px of page padding the FAB covers the last row when scrolled to the end.
- Gap between hero and list: `mb: 2.5`. Between group cards: `spacing={2}`.

---

## 7. Motion

One orchestrated entrance beats scattered micro-interactions.

- Stagger the top-level blocks only (group cards), not individual rows:
  `animation: ${riseIn} 0.42s cubic-bezier(0.2, 0.7, 0.3, 1) both` with
  `animationDelay: ${index * 70}ms`.
- Define keyframes with MUI's `keyframes` helper, never as a `'@keyframes name'` key inside `sx`.
  The inline form does not reliably resolve the animation name, and with `both` fill-mode the
  elements stay stuck at `opacity: 0` — a silent blank list that still occupies layout space.
- Always pair an entrance animation with
  `'@media (prefers-reduced-motion: reduce)': { animation: 'none' }`.

---

## 8. Anti-patterns

Each of these was in the recurring-expenses screen before the rebuild. They are the fastest way to
recognise the problem on another screen.

1. **A card per record.** ~200px per row for three lines of content; 6 of 10 items filled the
   viewport. Records that share a shape belong in one grouped card with dividers.
2. **A chip inline with the name.** The name is the flexible element and the chip is fixed, so the
   chip always wins and the name truncates.
3. **A badge on the majority state.** Noise with a width cost. See §4.
4. **A field repeated on every row** (`Monthly ·`) that should be a section header.
5. **Repeating the currency sign inside a range.** `₱1,000 – ₱1,250` where `₱1,000–1,250` reads
   better and fits.
6. **Amounts and icon buttons in the same fixed rail**, so long values collide with the tap targets.
7. **Proportional figures in a numeric column** — no `tabular-nums`, so nothing lines up vertically.
8. **A count in a page heading that the hero card already shows.** Pick one.
9. **Content that runs under the FAB.** See §6.
10. **A derived upper bound presented as an exact total.** See §3.

---

## Verifying a change like this

The app is behind a Cognito `Authenticator`, so a signed-out session cannot reach an authenticated
page. To render one with mock data: add a temporary page under `src/pages/`, give it a static
`Page.disableAuth = true`, branch on `(Component as any).disableAuth` in `_app.tsx` to render
`ThemeProvider → Layout → Component` without the `Authenticator`, and supply an `AppContext.Provider`
with mock data. Gate on the static flag, **not** on `typeof window !== 'undefined'` — that branch
hydration-mismatches and blanks the whole app.

Constrain width for a mobile check with a 390px wrapper plus
`.narrow-preview .MuiContainer-root { max-width: 390px !important; padding: 0 16px !important; }`;
`resize_window` alone does not change the rendered viewport. Include a record with no tags, a very
long name, and a non-active status in the mock data. Delete the page and revert `_app.tsx` afterwards,
then confirm with `git status` and a clean `npx tsc --noEmit && npm run build`.
