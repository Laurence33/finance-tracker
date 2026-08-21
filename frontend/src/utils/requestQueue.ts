/**
 * A FIFO semaphore over in-flight requests.
 *
 * The per-user API Gateway usage plan allows 5 rps with a burst of 10, and the
 * dashboard fans out 32 requests at once (48 in December). Capping concurrency
 * keeps the app inside the plan without a backend change — see
 * `.scratch/frontend-caching/issues/04-concurrency-cap.md` for why the fan-out
 * itself is a separate, deferred fix.
 */
export function createRequestQueue(limit: number) {
  let active = 0;
  const waiting: Array<() => void> = [];

  const next = () => {
    if (active >= limit) return;
    const resume = waiting.shift();
    if (!resume) return;
    active += 1;
    resume();
  };

  return {
    acquire(): Promise<() => void> {
      // Guard against a caller releasing twice and handing out a phantom slot.
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        active -= 1;
        next();
      };

      if (active < limit) {
        active += 1;
        return Promise.resolve(release);
      }
      return new Promise((resolve) => {
        waiting.push(() => resolve(release));
      });
    },
  };
}
