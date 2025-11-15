import type { AppProps } from "next/app";
import { WalletProvider } from "@/context/WalletContext";
import "@/styles/globals.css"; // your global styles

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
