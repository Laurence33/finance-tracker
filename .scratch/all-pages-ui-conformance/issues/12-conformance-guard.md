# 12 — Conformance guard

**What to build:** A check that fails when new code reintroduces the anti-patterns this set of tickets
removed, so the next feature can't quietly regress the design back to where it started. This is the
contract half of the wide refactor: by the time it lands, no raw currency interpolation remains, so the
guard can be strict rather than advisory.

Grep-level is enough — don't build an AST-based lint plugin for this.

**Blocked by:** 04, 05, 06, 07, 08, 09, 10, 11 — the guard can only be strict once every surface has
migrated.

**Status:** ready-for-agent

- [ ] `npm run check:ui` fails on a raw `₱` interpolation anywhere in components or pages, with a message pointing at §3 of the design doc and naming the `Money` component
- [ ] It fails on an item component wrapping a single list record in a `Card` — or, if that isn't reliably detectable by grep, it checks what is and the ticket says plainly what it can't catch
- [ ] It passes cleanly against the whole codebase at the time this ticket lands
- [ ] It runs in the build or CI path, not only as a manual command
- [ ] `ui-patterns.md` gains a line telling a future session that this check exists and how to run it
- [ ] False positives are impossible to ignore silently — the check exits non-zero rather than printing a warning
