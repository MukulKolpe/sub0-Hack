import type { AppProps } from "next/app";
import { WalletProvider } from "@/context/WalletContext";
import "@/styles/globals.css"; // your global styles
import { Header } from "@/components/header";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Header />
      <Component {...pageProps} />
    </WalletProvider>
  );
}
