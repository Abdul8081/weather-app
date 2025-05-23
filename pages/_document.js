import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap"
        />
        <link rel="icon" href="./cloud_app.avif" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}