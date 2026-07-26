# 12 — Conformance guard

**What to build:** A check that fails when new code reintroduces the anti-patterns this set of tickets
removed, so the next feature can't quietly regress the design back to where it started. This is the
contract half of the wide refactor: by the time it lands, no raw currency interpolation remains, so the
guard can be strict rather than advisory.

Grep-level is enough — don't build an AST-based lint plugin for this.

**Blocked by:** 04, 05, 06, 07, 08, 09, 10, 11 — the guard can only be strict once every surface has
migrated.

**Status:** done

- [x] `npm run check:ui` fails on a raw `₱` interpolation anywhere in components or pages, with a message pointing at §3 of the design doc and naming the `Money` component
- [x] It fails on an item component wrapping a single list record in a `Card` — or, if that isn't reliably detectable by grep, it checks what is and the ticket says plainly what it can't catch
- [x] It passes cleanly against the whole codebase at the time this ticket lands
- [x] It runs in the build or CI path, not only as a manual command
- [x] `ui-patterns.md` gains a line telling a future session that this check exists and how to run it
- [x] False positives are impossible to ignore silently — the check exits non-zero rather than printing a warning

## Outcome

Shipped in `d289c0a`. Merged to `main` and pushed.

`npm run check:ui`, wired into `npm run build`, verified failing on a planted violation
of each rule.

Making it strict needed work no page ticket covered: the forms and payment dialogs still
hand-assembled ten currency figures. Migrating those is what caught the `₱4,820.5` decimal defect
(`1ac4fc4`).

**The first version was too weak, and code review caught it.** It matched only a literal `₱` next to
an interpolation, so `'₱' + total` and `` `${CURRENCY_GLYPH}${total}` `` both passed — and since this
branch *exported* `CURRENCY_GLYPH`, the second is the idiomatic way to regress. It also threw `ENOENT`
when run from the repo root. Both fixed in `6f2a405`.

It still cannot catch a hand-rolled group card, a re-implemented row spec, or a badge on a majority
state, and it prints that list on failure so a green run is not mistaken for full conformance.
