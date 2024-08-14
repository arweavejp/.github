import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>Arweave Japan</title>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Arweave Japan" />
        <meta name="twitter:image" content="https://arweave.jp/cover.png" />
        <meta property="og:title" content="Arweave Japan" />
        <meta name="og:description" content="Arweave / AO 日本エコシステム" />
        <meta name="og:image" content="https://arweave.jp/cover.png" />
        <link rel="icon" type="image/svg+xml" href="/logo.png" />
        <link
          href="https://fonts.googleapis.com/css?family=Sawarabi+Gothic"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@600&display=swap"
          rel="stylesheet"
        />
        <link
          key="fontawesome"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
