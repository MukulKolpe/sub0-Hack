"use client";

import Link from "next/link";
import { WalletConnect } from "@/components/wallet-connect";
import { useWallet } from "@/context/WalletContext"; // <-- Imported useWallet

// --- MANAGER ADDRESS (from Admin.tsx) ---
const MANAGER_ADDRESS = "0xc35fc43ae078961bfc34ffb6c2148571b6f87920";

export function Header() {
  const { address } = useWallet(); // <-- Get the connected address

  // Check if the connected user is the manager
  const isManager =
    address && address.toLowerCase() === MANAGER_ADDRESS.toLowerCase();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-l font-bold text-primary-foreground">S0</span>
          </div>
          <span className="text-2xl font-bold text-foreground">Artcast</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/list"
            className="text-xl text-muted-foreground hover:text-foreground transition-colors text-base font-semibold"
          >
            List
          </Link>
          <Link
            href="/gallery"
            className="text-xl text-muted-foreground hover:text-foreground transition-colors text-base font-semibold"
          >
            Vote
          </Link>

          {/* --- Conditionally render the Manager link --- */}
          {isManager && (
            <Link
              href="/manager"
              className="text-xl text-muted-foreground hover:text-foreground transition-colors text-base font-semibold"
            >
              Market Manager
            </Link>
          )}
        </nav>

        <WalletConnect />
      </div>
    </header>
  );
}
