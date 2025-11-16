// @ts-nocheck comment
import type { AppProps } from "next/app";
import { WalletProvider } from "@/context/WalletContext";
import "@/styles/globals.css"; // your global styles
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Artcast</title>
        <meta name="description" content="The Prediction Market for Art NFTs" />
      </Head>
      <WalletProvider>
        <Header />
        <Component {...pageProps} />
        <Footer />
      </WalletProvider>
    </>
  );
}
