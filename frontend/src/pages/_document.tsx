import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/*
         * Inter is what `theme.ts` and `globals.css` have always asked for
         * first — nothing was loading it, so the whole app was falling through
         * to Roboto and then to Arial. Loading it here settles that for every
         * screen, not just the signed-out ones.
         *
         * Newsreader is the display face for the auth screens' headline (see
         * `src/styles/auth.css`); it is a screen-first text serif, so it sits
         * beside Inter without the two looking like they came from different
         * eras.
         *
         * A plain stylesheet rather than `next/font`: that would inline and
         * self-host at build time, which is a build-time network dependency for
         * a face only one screen uses.
         */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;1,400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
