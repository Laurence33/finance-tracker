/**
 * Whether the configured API is a development server rather than a deployed one.
 *
 * Usage plans and API keys aren't enforced by `sam local`, and bootstrapping a
 * key would reach for real AWS from a dev machine — so the whole `/me/api-key`
 * step is skipped against a local API.
 *
 * Private LAN addresses count as local. Testing on a phone means pointing the
 * frontend at the machine's LAN address, and treating that as remote sends every
 * page load chasing an API key that `sam local` cannot issue. The failure is not
 * quiet: the bootstrap promise resets on failure, so *every* subsequent request
 * retries it, doubling the request count and stalling each one behind a timeout.
 */
export function isLocalApiUrl(url: string | undefined): boolean {
  if (!url) return false;
  const host = url.replace(/^https?:\/\//, '').split(/[/:]/)[0];

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[') {
    return true;
  }
  // RFC 1918 private ranges, plus link-local.
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  const match = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(host);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  // `.local` is what mDNS hands out for machine names on a LAN.
  return host.endsWith('.local');
}
