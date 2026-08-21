# 09 — Pull-down-to-refresh, with the native gesture suppressed

**What to build:** A pull-down gesture on the document that revalidates the current page's keys,
bypassing their staleness class.

This is the deliberate escape hatch that makes the rest of the caching safe: with
`revalidateOnFocus: false` and staleness evaluated only at page load, a tab left open has no other
way to get fresh data.

**Chrome on Android already has this gesture, and it will lie.** Its native pull-to-refresh reloads
the page — and with the persisted cache, a reload paints from localStorage and revalidates only
expired keys. The user would perform a refresh and fetch nothing. Set `overscroll-behavior-y: contain`
on the body to suppress it before adding the real one.

The document body owns the scroll — `globals.css` sets no fixed-height container and `Layout.tsx:172`
merely pads for the fixed bottom nav — so a document-level handler is the natural fit. There is no
manifest in `public/`, so this runs as a browser tab, not an installed PWA.

Refresh scope is the current page's keys only, not the whole cache: 2–4 requests per pull, bounded
and predictable.

```
wallet     /fund-sources, /transfers
budget     /budget
index      /expenses?month=, /incomes?month=, /fund-sources
lendings   /lendings, /fund-sources
```

**Blocked by:** 05, 06

**Status:** done — native gesture suppressed, page-scoped refresh, dashboard evicts months first.

- [x] Pulling down at the top of any page revalidates that page's keys regardless of staleness
- [x] Chrome Android's native pull-to-refresh no longer fires
- [x] The gesture does not trigger when the page is scrolled away from the top
- [x] A horizontal swipe or a scroll that starts mid-page never triggers it
- [x] The affordance shows an in-progress state and settles on both success and failure
- [x] Pulling twice in quick succession does not double-fire
- [x] Works on iOS Safari, where there is no native gesture to suppress
- [x] `npm run check:ui` clean
