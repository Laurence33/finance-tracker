# 01 — Remove the date-fns v1 types stub

**What to build:** `date-fns` parsing typechecks again. The repo depends on `@types/date-fns@2.5.3`,
which is a **v1-era stub** from before date-fns shipped its own types. It shadows the bundled types of
the installed date-fns v4, so `parse(str, fmt, ref)` fails with "Expected 1 arguments, but got 3" —
a correct call rejected by a wrong type definition.

This cost an agent a real detour during the UI conformance epic; it worked around the compile error by
building a date from parts rather than parsing. Expect to find one or two such workarounds and be able
to simplify them once the stub is gone.

date-fns v4 ships its own types, so the fix is removing the dependency — but it is a package change,
which is why it wasn't done inline.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent — not started. Filed after the UI conformance epic (`3507cc0..f293f9c`), which is complete and merged.

- [ ] `@types/date-fns` is removed from `package.json` and the lockfile
- [ ] `npx tsc --noEmit` is clean with no new errors anywhere in the frontend
- [ ] A three-argument `parse(str, fmt, ref)` call typechecks
- [ ] Any workaround written to dodge the broken types is simplified back to a direct call, or the ticket says explicitly that none were found
- [ ] `npm run build` clean
