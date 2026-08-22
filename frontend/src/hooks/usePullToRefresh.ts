import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Where the page is actually scrolled to.
 *
 * `window.scrollY` alone is not enough: `globals.css` sets `overflow-x: hidden`
 * on both `html` and `body`, which in some engines makes `body` the scroll
 * container and leaves `window.scrollY` pinned at 0. Trusting it there made
 * every downward drag anywhere on the page look like a pull-to-refresh, and the
 * `preventDefault` that follows killed scrolling outright.
 */
function scrollOffset(): number {
  return Math.max(
    window.scrollY || 0,
    document.documentElement?.scrollTop || 0,
    document.body?.scrollTop || 0,
  );
}

const TRIGGER_DISTANCE = 70;
// How far the finger must travel before the pull counts. Deliberately half the
// nominal trigger: the resistance below moves the indicator at half speed.
const ARM_DISTANCE = TRIGGER_DISTANCE * 0.5;
const MAX_PULL = 110;
// Below this the gesture is almost certainly a tap or a horizontal swipe.
const START_SLOP = 8;

type Options = {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
};

/**
 * Pull down at the top of the document to refresh.
 *
 * The document body owns the scroll here (nothing sets a fixed-height scroll
 * container), so the listeners go on the window. Chrome on Android has its own
 * pull-to-refresh that reloads the page — and with a persisted cache a reload
 * paints from localStorage and revalidates only expired keys, so the native
 * gesture would look like a refresh and fetch nothing. `overscroll-behavior-y:
 * contain` in globals.css suppresses it; this replaces it with one that means
 * something.
 */
export function usePullToRefresh({ onRefresh, disabled = false }: Options) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef<number | null>(null);
  const startX = useRef(0);
  const active = useRef(false);
  // Guards against a second pull firing while the first is still in flight.
  const busy = useRef(false);

  const reset = useCallback(() => {
    startY.current = null;
    active.current = false;
    setDistance(0);
  }, []);

  useEffect(() => {
    if (disabled) return;

    const onTouchStart = (event: TouchEvent) => {
      if (busy.current || event.touches.length !== 1) return;
      // Only arm the gesture at the very top; a pull that begins mid-page is a
      // scroll, not a refresh.
      if (scrollOffset() > 0) return;
      startY.current = event.touches[0].clientY;
      startX.current = event.touches[0].clientX;
      active.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY.current === null || busy.current) return;

      const dy = event.touches[0].clientY - startY.current;
      const dx = Math.abs(event.touches[0].clientX - startX.current);

      if (!active.current) {
        if (dy < START_SLOP) return;
        // A drag that is more sideways than down belongs to something else.
        if (dx > dy) {
          startY.current = null;
          return;
        }
        active.current = true;
      } else if (dy < START_SLOP) {
        // The finger reversed. Hand the gesture back to the browser instead of
        // holding it for the rest of the touch — otherwise a small downward dip
        // before an upward flick would block the scroll it turned into.
        active.current = false;
        setDistance(0);
        return;
      }

      if (scrollOffset() > 0) {
        reset();
        return;
      }

      if (event.cancelable) event.preventDefault();
      // Resistance, so the sheet never tracks the finger one-to-one.
      setDistance(Math.min(MAX_PULL, dy * 0.5));
    };

    const onTouchEnd = async () => {
      if (startY.current === null || !active.current) {
        reset();
        return;
      }
      const pulled = distanceRef.current;
      reset();

      if (pulled < ARM_DISTANCE) return;

      busy.current = true;
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        busy.current = false;
        setRefreshing(false);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    // Not passive: the pull must be able to cancel the browser's own scrolling.
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', reset);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', reset);
    };
  }, [disabled, onRefresh, reset]);

  // Read the live distance inside the touchend closure without re-binding
  // every listener on each pixel of movement.
  const distanceRef = useRef(0);
  distanceRef.current = distance;

  return {
    distance,
    refreshing,
    armed: distance >= ARM_DISTANCE,
    // 0 to 1 as the gesture arms, so a caller can drive an indicator without
    // knowing the thresholds.
    progress: Math.min(1, distance / ARM_DISTANCE),
  };
}
