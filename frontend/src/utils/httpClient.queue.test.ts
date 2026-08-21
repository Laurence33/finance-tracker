import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosRequestConfig } from 'axios';

// Amplify would try to reach Cognito; the interceptor swallows its failure, but
// stubbing keeps the test off the network and fast.
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({ tokens: undefined }),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

type Handler = (config: AxiosRequestConfig) => Promise<any>;

/**
 * Installs a controllable adapter as the axios default *before* httpClient is
 * imported, so the instance it creates inherits it. That keeps the real
 * interceptor chain under test rather than a stub of it.
 */
async function loadClientWith(handler: Handler) {
  vi.resetModules();
  const axios = (await import('axios')).default;
  axios.defaults.adapter = (config) => handler(config);
  return await import('./httpClient');
}

beforeEach(() => {
  vi.clearAllMocks();
});

const ok = (config: AxiosRequestConfig) => ({
  data: { data: {} },
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

describe('httpClient concurrency cap', () => {
  it('never has more than 4 GETs in flight', async () => {
    let live = 0;
    let peak = 0;
    const { HttpClient } = await loadClientWith(async (config) => {
      if (config.url === '/me/api-key') return { ...ok(config), data: { apiKey: 'k' } };
      live += 1;
      peak = Math.max(peak, live);
      await new Promise((r) => setTimeout(r, 5));
      live -= 1;
      return ok(config);
    });

    await Promise.all(
      Array.from({ length: 32 }, (_, i) => HttpClient.get(`/expenses?month=${i}`)),
    );

    expect(peak).toBe(4);
  });

  it('does not queue mutations behind slow GETs', async () => {
    const gate = { resolve: () => {} };
    const blocked = new Promise<void>((r) => (gate.resolve = r));
    const seen: string[] = [];

    const { HttpClient } = await loadClientWith(async (config) => {
      // The bootstrap is itself a GET and every other request awaits it, so it
      // must always be served rather than blocked.
      if (config.url === '/me/api-key') return { ...ok(config), data: { apiKey: 'k' } };
      seen.push(`${config.method}`);
      if (config.method === 'get') await blocked;
      return ok(config);
    });

    // Saturate the cap with GETs that will not resolve yet.
    const gets = Array.from({ length: 8 }, (_, i) => HttpClient.get(`/g${i}`));
    await new Promise((r) => setTimeout(r, 10));

    // A POST must go straight through rather than wait for a slot.
    await HttpClient.post('/expenses', {});
    expect(seen).toContain('post');

    gate.resolve();
    await Promise.all(gets);
  });

  it('lets the api-key bootstrap through a saturated queue', async () => {
    const gate = { resolve: () => {} };
    const blocked = new Promise<void>((r) => (gate.resolve = r));
    let bootstrapServed = false;

    const { HttpClient } = await loadClientWith(async (config) => {
      if (config.url === '/me/api-key') {
        bootstrapServed = true;
        return { ...ok(config), data: { apiKey: 'k' } };
      }
      await blocked;
      return ok(config);
    });

    const gets = Array.from({ length: 8 }, (_, i) => HttpClient.get(`/g${i}`));
    await new Promise((r) => setTimeout(r, 20));

    // If the bootstrap were queued it would deadlock: the four GETs holding the
    // slots are each awaiting it inside the request interceptor.
    expect(bootstrapServed).toBe(true);

    gate.resolve();
    await Promise.all(gets);
  });

  it('drains a burst completely rather than stranding the tail', async () => {
    let served = 0;
    const { HttpClient } = await loadClientWith(async (config) => {
      if (config.url === '/me/api-key') return { ...ok(config), data: { apiKey: 'k' } };
      served += 1;
      await new Promise((r) => setTimeout(r, 1));
      return ok(config);
    });

    await Promise.all(Array.from({ length: 20 }, (_, i) => HttpClient.get(`/g${i}`)));
    expect(served).toBe(20);
  });
});
