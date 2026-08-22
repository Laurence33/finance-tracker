import AppContextProvider from '@/context/AppContext';
import Layout from '@/components/layout/Layout';
import '@/utils/amplify-config';
import '@/styles/globals.css';
import '@aws-amplify/ui-react/styles.css';
// After Amplify's own stylesheet — it supersedes rules in both that file and
// globals.css. See the header of auth.css.
import '@/styles/auth.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Authenticator } from '@aws-amplify/ui-react';
import { SWRConfig } from 'swr';
import { useEffect, useMemo } from 'react';
import theme from '@/theme';
import { cacheNamespaceFor, createCacheProvider } from '@/utils/swr-cache';
import { authServices } from '@/utils/auth-services';
import { authComponents, authFormFields } from '@/components/layout/AuthLayout';

/**
 * Holds the persisted cache for exactly one identity.
 *
 * Mounted inside the `<Authenticator services={authServices}>` render callback because the cache
 * namespace needs the Cognito sub *synchronously* — `fetchAuthSession()` is
 * async, so a module-scope provider could not partition itself, and an
 * unpartitioned cache would paint the previous user's balances to whoever signs
 * in next on this device.
 */
function CachedApp({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  // No identity means no namespace to partition by, and a shared fallback
  // namespace would be exactly the hole the partitioning exists to close. Fall
  // back to an in-memory cache instead: the session still dedupes, nothing is
  // written to the device.
  const provider = useMemo(
    () => (userId ? createCacheProvider(cacheNamespaceFor(userId)) : () => new Map()),
    [userId],
  );

  // Detach the provider's persistence listeners when the identity changes, so a
  // previous user's cache cannot be written back by a later `pagehide`.
  useEffect(() => {
    return () => {
      if ('dispose' in provider) provider.dispose();
    };
  }, [provider]);

  return (
    <SWRConfig
      value={{
        provider,
        // Staleness is decided once, when the provider hydrates from
        // localStorage. See `docs/adr/0001-swr-owns-client-get-caching.md`.
        revalidateIfStale: false,
        // Focus fires on every app-switch on mobile; leaving this on would
        // refire every key each time the user glances at another app.
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        // httpClient already retries 3x with backoff. SWR's default is
        // unlimited, and the two would compound.
        errorRetryCount: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Authenticator
        services={authServices}
        components={authComponents}
        formFields={authFormFields}
      >
        {({ user }) => (
          // Keyed on the identity so a different user gets a fresh provider
          // rather than inheriting the previous one's hydrated cache.
          <CachedApp key={user?.userId ?? 'anonymous'} userId={user?.userId}>
            <AppContextProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </AppContextProvider>
          </CachedApp>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}
