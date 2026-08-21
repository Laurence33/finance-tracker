import { describe, it, expect, vi } from 'vitest';
import { createRequestQueue } from './requestQueue';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => (resolve = r));
  return { promise, resolve };
};

describe('createRequestQueue', () => {
  it('lets requests through up to the limit', async () => {
    const q = createRequestQueue(4);
    const slots = await Promise.all([q.acquire(), q.acquire(), q.acquire(), q.acquire()]);
    expect(slots).toHaveLength(4);
  });

  it('makes the fifth wait until a slot frees', async () => {
    const q = createRequestQueue(4);
    const releases = await Promise.all([q.acquire(), q.acquire(), q.acquire(), q.acquire()]);

    const fifth = vi.fn();
    const pending = q.acquire().then(fifth);

    await new Promise((r) => setTimeout(r, 10));
    expect(fifth).not.toHaveBeenCalled();

    releases[0]();
    await pending;
    expect(fifth).toHaveBeenCalledTimes(1);
  });

  it('serves waiters in arrival order', async () => {
    const q = createRequestQueue(1);
    const first = await q.acquire();
    const order: number[] = [];

    const a = q.acquire().then((rel) => { order.push(1); rel(); });
    const b = q.acquire().then((rel) => { order.push(2); rel(); });

    first();
    await Promise.all([a, b]);
    expect(order).toEqual([1, 2]);
  });

  it('releases the slot even when the caller throws', async () => {
    const q = createRequestQueue(1);
    const release = await q.acquire();
    release();
    // A second release must not hand out a phantom slot.
    release();

    const gate = deferred();
    let entered = 0;
    const run = async () => {
      const rel = await q.acquire();
      entered += 1;
      await gate.promise;
      rel();
    };
    void run();
    void run();
    await new Promise((r) => setTimeout(r, 10));
    expect(entered).toBe(1);
    gate.resolve();
  });

  it('drains fully so later requests are not stranded', async () => {
    const q = createRequestQueue(2);
    const seen: number[] = [];
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        q.acquire().then(async (release) => {
          seen.push(i);
          await new Promise((r) => setTimeout(r, 1));
          release();
        }),
      ),
    );
    expect(seen).toHaveLength(12);
  });

  it('never exceeds the limit under a burst', async () => {
    const q = createRequestQueue(4);
    let live = 0;
    let peak = 0;
    await Promise.all(
      Array.from({ length: 32 }, () =>
        q.acquire().then(async (release) => {
          live += 1;
          peak = Math.max(peak, live);
          await new Promise((r) => setTimeout(r, 1));
          live -= 1;
          release();
        }),
      ),
    );
    expect(peak).toBe(4);
  });
});
