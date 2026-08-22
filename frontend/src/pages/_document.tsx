import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/*
         * Loaded as a plain stylesheet rather than through `next/font` because
         * these two faces are used by the signed-out auth screens only — see
         * `src/styles/auth.css`. `next/font` inlines and self-hosts at build
         * time, which would put both families in the critical path of every
         * authenticated page that never renders them.
         */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
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
