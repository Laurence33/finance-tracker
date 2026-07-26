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
| Edit + delete `IconButton size="small"` | ~55px (measured: ~27.5px each — `react-icons` ignores `fontSize="1.1rem"` and renders at 1em) |
| Two `Stack` gaps (`spacing={1.5}`) | 24px |
| `Active` chip, inline with the name inside the flexible block | ~66px + 8px gap |
| **Left for the name** | **~30px** |

30px is two characters and an ellipsis — hence `Do…`, `el…`, `Ga…`. After dropping the chip and the
icon buttons and compacting the range to `₱2,000–6,000` (~100px), the name column went to ~214px.

**Rule:** when names truncate, do this sum first and cut the biggest non-essential spender. Do not
reach for a smaller font or a wider container.

**Measure, don't estimate.** Every figure above was originally guessed, and two were wrong by enough
to matter — the icon rail by 13px and the amount block by 46px. When this page was rebuilt the name
column was said to have ~20px; measuring `getBoundingClientRect` on the real render gave ~85px. The
conclusion held (85px is eight characters, hence `Bartolo…`), but a guessed budget can flip a
keep-or-move decision. Measure the row you are actually changing.

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

### Use the primitives, don't rebuild them

`LedgerGroupCard` (molecule) and `LedgerRow` (atom) implement everything in this section, including
values the spec table below never captured — amount typography, the secondary value line, the
`leading` / `trailing` / `footer` slots and the inert (non-tappable) row. Compose those; the tables
below are why they look the way they do, not a licence to hand-roll a second copy.

A page-specific item component should be a thin adapter that maps its domain onto `LedgerRow` and
holds all the vocabulary — statuses, categories, frequencies. `RecurringExpenseItem` is the model.

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

When the grouped field is **free text** rather than a closed enum, there is no domain order to key
off: order groups by aggregate descending with the group name as a deterministic tiebreak, and pin
the empty-value group last under an explicit label (`Uncategorised`). Trim before grouping — a
non-optional string field arrives as `''`, and a whitespace-only value otherwise produces a group
with a blank eyebrow.

Grouping is not always right. **Nothing repeats on a tags row**, so that page uses a single group
card whose header names the month — the one field its rows genuinely did repeat, once per row as
`₱340 spent this month`. A header that hoists no field out of the row is chrome; a header that
restates a count the hero already shows is worse (§8.8). "Over budget / on track" would be worse
still: that is a §4 exception state, and it makes the list reorder as the month progresses.

### When cards beat ledger rows

A ledger list is for records the user **creates and compares** in a list that grows. Not every set of
records is that. A **closed partition of a whole** — fixed membership, defined elsewhere, each member a
standing purpose with its own target share — keeps a card each, however many members it has.

The budget page's buckets are the example. A framework defines between two and six of them, and the
user never adds one, so there is no scan-and-compare job and no risk of the viewport flooding that
anti-pattern 1 describes. Each bucket's full-width progress meter *is* the content, not an accessory
to a value, and a card gives it width a row cannot.

Because those meters are not in a `LedgerRow`, the **Meter rows** geometry above does not govern them:
`height: 4` exists to fit a bar inside a 62px row's slack. The budget cards' taller bar is a different
context, not drift.

Dashboard widgets are the other case: heterogeneous summaries of different domains, not a list of one
record type. Their mini-lists still adopt the row spec's name-left / value-right alignment and tabular
figures, without becoming groups with headers and counts.

Card sets still owe §3, §5 and §6 in full. Staying a card exempts a screen from §2, nothing else.

### Meter rows

A row may carry a progress meter — spend against a budget, funding against a target. It goes in
`LedgerRow`'s `footer` slot: full content width, below both the name and the value, never inline with
either (an inline meter is a fixed-width sibling, so it starves the name — §1).

| Part | Value |
|---|---|
| Element | `LinearProgress variant="determinate"`, value clamped to 100 |
| Height / radius | `height: 4, borderRadius: 2` on bar and track |
| Track | `alpha(theme.palette.text.primary, 0.09)` |
| Gap above | owned by `LedgerRow`'s footer slot — don't add your own |
| Bar colour | `primary` normally, `error` in the over state |

**The meter must not make the row taller.** 4px of bar plus the footer gap is 14px, which fits inside
the slack `minHeight: 62` already reserves for a single-line row — measured on the tags page, metered
and unmetered rows are both exactly 62px. So keep the value to **one line** when a meter is present
(`₱1,200 / 2,000` via the `value` slot with `glyph={false}` on the second figure, not `amount` plus
`secondaryValue`). Two value lines plus a meter pushes the row to ~78px and it stops reading as a
ledger row.

**A record with no budget renders no meter and no placeholder track.** Omit `footer` and the row falls
back to its centred single-child layout, so there is no dead space where a bar would be. Because both
shapes are the same height, metered and unmetered rows interleave in one group — that equal height is
exactly why splitting them into "budgeted" / "no budget" sections isn't needed.

**Colour encodes state, length encodes magnitude — never both.** No amber "nearing budget" tier: the
bar's length already says how close it is, and because it clamps at 100%, colour is the only channel
left to distinguish at-budget from far over. Pair the over state with a §4 micro-label under the value
and do **not** mute the row — §4's muting is for records that should recede, and an over-budget record
is the opposite.

### Row actions

Row-level action icons cost ~55px of the name's budget for two, ~83px for three. **Remove them only
when the name column is starved** — and if you do, the detail dialog must gain them, in its title bar,
before `Close`.

Grouping can refund enough width that the icons stay. On the assets page, hoisting the category out of
the row returned the chip's ~65px plus its 8px gap, taking the name from ~106px on one `noWrap` line to
183px across the two-line clamp — so the icons stayed, and that page needs no detail dialog at all.
Run the §1 sum *after* grouping before deciding: a page whose value rail is a bare amount usually keeps
its icons, while a page whose rail also carries a secondary value line and a status label (lendings)
does not.

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
- **Negative amounts take a sign, not a negative number.** `Money` formats with `toLocaleString()`,
  so `amount={-7350}` renders `₱-7,350` with the glyph ahead of the minus. Pass
  `amount={Math.abs(x)} sign="-"` and let the caller colour it.
- **Rounding is the caller's job.** `Money` does not round; a derived total needs `Math.round` at the
  call site. What the formatter *does* guarantee is **no decimals or exactly two, never one** — a
  `4820.50` payment would otherwise render `₱4,820.5`, which reads as a truncated number rather than
  an amount. Whole values stay whole.
- **Label derived aggregates honestly.** A total that resolves ranges to `amountMax` and skips
  as-needed items is not "the" total — say so in a `0.6875rem` caption: `upper bound · excludes
  as-needed`. Never put a derived total in a group header where it sits directly above the rows it
  approximates; the mismatch reads as a bug.

### Figures inside charts

A chart holds two kinds of figure with different jobs, and they do not get the same treatment.

- **An axis tick is a scale reference**, read approximately, repeated down a gutter. It may abbreviate
  (`12k`) and it may drop the currency glyph — the card title already says what the axis measures.
- **A tooltip figure is a value read exactly.** It carries the full figure and the de-emphasised glyph,
  like any other figure in the app.

**Abbreviate a tick on measurement, never for symmetry.** Run the §1 sum on the axis gutter: abbreviate
when a tick would overflow it, not because another chart abbreviates. Two charts formatting ticks
differently is not drift.

**`fontVariantNumeric` is not a valid SVG presentation attribute.** Passing it through Recharts'
`tick={{ … }}` silently renders nothing. Set it once on the `Box` wrapping the chart — the property is
inherited and applies to SVG `<text>`.

**Recharts' `formatter` returns a string, so it cannot carry a separately styled glyph.** A tooltip
whose figures need the §3 treatment has to use a custom `content` renderer and compose `<Money>`. Reach
for the string formatters only where the API genuinely demands a string.

**Sign before glyph applies to chart strings too.** `₱-105,000` is as wrong on an axis as in a row, and
`Money`'s `sign` handling does not reach a string callback.

---

## 4. Status economy

**Badge the exceptions, never the majority state.** An `Active` chip on 8 of 10 rows carries no
information while spending ~66px and drawing the eye with a saturated fill.

- Majority/expected state: render nothing.
- Exception states: mute the record (`text.secondary` name, `text.disabled` amount) and add a
  micro-label under the amount at `0.65rem / 700 / letterSpacing 0.08em / uppercase` —
  `error.main` for destructive/cancelled, `text.disabled` for benign/completed.
- Full `Chip` components belong in detail dialogs and forms, where one instance is on screen.
- **Keep exception labels to one short word.** The value block is `flexShrink: 0`, so its widest child
  — often the label, not the amount — sets the rail's width. `PARTIALLY PAID` costs ~87px against
  `PARTIAL`'s ~48px, taken straight out of the name column.
- **When a group header already names the state, the per-row label is redundant.** A `PARTIAL` label
  under a `PARTIALLY PAID` header is the same fact twice, paid for in name width. Keep the label only
  where muting alone would be ambiguous, or where rows of that state can appear outside their group.
- **Direction is sign and colour, not a badge.** When one list holds movements in both directions, the
  minority direction takes a leading `+` and `success.main` and the majority takes neither. A per-row
  `Income` chip is a majority-state badge in whichever filter the user is in, and costs ~66px.

---

## 5. Summary hero card

One per screen, above the list. **Compose `SummaryHeroCard` (molecule)** — it implements all of this,
including the exact circle geometry and the figure's `lineHeight: 1.15` / `letterSpacing: -0.02em`,
which overrides `Money`'s default tracking. Building to the prose below alone will drift.

- Gradient `linear-gradient(135deg, …main 0%, …dark 100%)` on a `Card` with `border: 'none'`. The hue
  is the page's existing role colour, passed in — don't re-hue one page in isolation.
- Depth comes from one oversized off-canvas circle at `alpha('#ffffff', 0.09)` inside
  `overflow: 'hidden'`, not from a second gradient.
- Left-aligned, **four** tiers: eyebrow (icon + `0.6875rem / 700 / letterSpacing 0.16em / uppercase`),
  a label tier (`0.75rem / 500 / opacity 0.85`) naming what the figure measures, the figure itself
  (`{ xs: '1.75rem', sm: '2rem' } / 700 / tabular-nums`), then the honesty caption.
- The figure is normally money. A non-money headline (a state like `Off`) is supported and renders at
  figure size.
- Secondary stats go right, as a `Stack direction="row"` with a
  `<Divider orientation="vertical" flexItem>` at `alpha('#ffffff', 0.25)` — value above
  `0.625rem` uppercase label. **0 to 3**: zero is legitimate, and a stat may be conditional (an
  overdue count that only appears when non-zero). Four does not fit at 390px.
- The hero carries the screen's title in its eyebrow, which removes the need for a separate page
  heading above the list.
- The hero owns its own `mb: 2.5`. Pages currently using `mb: 3` will tighten on adoption; that's §6
  conformance, not drift.

---

## 6. Chrome and clearance

- Page container: `<Container maxWidth="sm" sx={{ pt: 3, pb: 12 }}>`.
- A `SpeedDial` needs the same `pb: 12` as a `Fab`, not more. Its box is 184px tall — the actions
  container adds 160px less a `-32px` margin — but while closed MUI gives that container
  `pointer-events: none` and its buttons `opacity: 0`, so only the 56px dial is a persistent
  obstruction. Open, the actions reach ~272px with no backdrop; that is a transient menu and page
  padding does not size for it.
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

## The conformance guard

`npm run check:ui` (also wired into `npm run build`) fails on the two anti-patterns that are
mechanically detectable: a hand-assembled currency figure (`₱` followed by an interpolation) and an
item component wrapping a record in a `Card`. It skips comment lines, so prose quoting a bad pattern
is not a violation.

It cannot catch a hand-rolled group card, a re-implemented row spec, or a badge on a majority state.
Those need this document and a render.

## Verifying a change like this

The app is behind a Cognito `Authenticator`, so a signed-out session cannot reach an authenticated
page. To render one with mock data: add a temporary page under `src/pages/`, give it a static
`Page.disableAuth = true`, branch on `(Component as any).disableAuth` in `_app.tsx` to render
`ThemeProvider → Layout → Component` without the `Authenticator`, and supply an `AppContext.Provider`
with mock data. Gate on the static flag, **not** on `typeof window !== 'undefined'` — that branch
hydration-mismatches and blanks the whole app.

Constrain width for a mobile check with a 390px wrapper plus
`.narrow-preview .MuiContainer-root { max-width: 390px !important; padding: 0 16px !important; }`;
`resize_window` alone does not change the rendered viewport.

**That wrapper constrains layout width but not media queries.** MUI `{ xs, sm }` values resolve against
the real browser viewport (~1400px), so anything responsive renders its `sm` branch. A render check on
a component with breakpoint values is invalid unless you emulate a real narrow viewport. The ledger
primitives use no breakpoint values; the hero figure and the transaction stat cards do. Include a record with no tags, a very
long name, and a non-active status in the mock data. Delete the page and revert `_app.tsx` afterwards,
then confirm with `git status` and a clean `npx tsc --noEmit && npm run build`.
