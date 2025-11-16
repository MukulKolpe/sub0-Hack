"use client";

import Link from "next/link";
import { WalletConnect } from "@/components/wallet-connect";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">
              S0
            </span>
          </div>
          <span className="text-lg font-bold text-foreground">Sub0</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/list"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            List
          </Link>
          <Link
            href="/gallery"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Vote
          </Link>
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            Start Staking
          </Link>
        </nav>

        <WalletConnect />
      </div>
    </header>
  );
}
