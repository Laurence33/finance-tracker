import AppContextProvider from '@/context/AppContext';
import Layout from '@/components/layout/Layout';
import '@/utils/amplify-config';
import '@/styles/globals.css';
import '@aws-amplify/ui-react/styles.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Authenticator } from '@aws-amplify/ui-react';
import theme from '@/theme';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Authenticator signUpAttributes={['email']}>
        {() => (
          <AppContextProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </AppContextProvider>
        )}
      </Authenticator>
    </ThemeProvider>
  );
}
