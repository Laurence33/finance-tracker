import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { act } from 'react';
import { usePullToRefresh } from './usePullToRefresh';

function Probe({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const { distance } = usePullToRefresh({ onRefresh });
  return <div data-testid="d">{distance}</div>;
}

/** Dispatches a cancelable touch event and reports whether scrolling was blocked. */
function touch(type: string, x: number, y: number): boolean {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: type === 'touchend' ? [] : [{ clientX: x, clientY: y }],
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event.defaultPrevented;
}

/** Simulates the viewport scroll offset. */
function setScroll({ windowY = 0, bodyTop = 0 }: { windowY?: number; bodyTop?: number }) {
  Object.defineProperty(window, 'scrollY', { value: windowY, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollTop', {
    value: 0,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(document.body, 'scrollTop', {
    value: bodyTop,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => setScroll({}));
afterEach(() => vi.clearAllMocks());

describe('scrolling must keep working', () => {
  it('does not block an upward swipe at the top of the page', () => {
    render(<Probe onRefresh={vi.fn()} />);
    touch('touchstart', 100, 400);
    // Swiping up = scrolling down.
    const blocked = touch('touchmove', 100, 340);
    expect(blocked).toBe(false);
    touch('touchend', 100, 340);
  });

  it('releases the gesture when the finger reverses direction', () => {
    render(<Probe onRefresh={vi.fn()} />);
    touch('touchstart', 100, 400);
    // A small downward dip arms the pull...
    touch('touchmove', 100, 415);
    // ...then the user swipes up to scroll. That must not stay blocked.
    const blocked = touch('touchmove', 100, 330);
    expect(blocked).toBe(false);
    touch('touchend', 100, 330);
  });

  it('does not arm mid-page when body is the scroll container', () => {
    // globals.css sets overflow-x:hidden on html AND body, which in some engines
    // makes body the scroller and leaves window.scrollY pinned at 0.
    setScroll({ windowY: 0, bodyTop: 800 });
    render(<Probe onRefresh={vi.fn()} />);
    touch('touchstart', 100, 400);
    const blocked = touch('touchmove', 100, 460);
    expect(blocked).toBe(false);
    touch('touchend', 100, 460);
  });

  it('does not arm mid-page when the document element is the scroller', () => {
    render(<Probe onRefresh={vi.fn()} />);
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 800,
      configurable: true,
    });
    touch('touchstart', 100, 400);
    const blocked = touch('touchmove', 100, 460);
    expect(blocked).toBe(false);
    touch('touchend', 100, 460);
  });

  it('ignores a multi-touch gesture such as pinch-zoom', () => {
    render(<Probe onRefresh={vi.fn()} />);
    const event = new Event('touchstart', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', {
      value: [{ clientX: 100, clientY: 400 }, { clientX: 200, clientY: 400 }],
    });
    act(() => window.dispatchEvent(event));
    expect(touch('touchmove', 100, 470)).toBe(false);
  });
});

describe('the pull itself still works', () => {
  it('blocks scrolling and grows while pulling down at the top', () => {
    const { getByTestId } = render(<Probe onRefresh={vi.fn()} />);
    touch('touchstart', 100, 200);
    const blocked = touch('touchmove', 100, 260);
    expect(blocked).toBe(true);
    expect(Number(getByTestId('d').textContent)).toBeGreaterThan(0);
    touch('touchend', 100, 260);
  });

  it('fires the refresh past the threshold', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<Probe onRefresh={onRefresh} />);
    touch('touchstart', 100, 200);
    touch('touchmove', 100, 340);
    touch('touchend', 100, 340);
    await act(async () => {});
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not fire for a short pull', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<Probe onRefresh={onRefresh} />);
    touch('touchstart', 100, 200);
    touch('touchmove', 100, 215);
    touch('touchend', 100, 215);
    await act(async () => {});
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('ignores a mostly-horizontal drag', () => {
    render(<Probe onRefresh={vi.fn()} />);
    touch('touchstart', 100, 200);
    expect(touch('touchmove', 300, 215)).toBe(false);
    touch('touchend', 300, 215);
  });
});
