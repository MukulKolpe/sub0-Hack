"use client";

import { useState } from "react";
import { Wallet, LogOut, Copy, ExternalLink, ChevronDown } from "lucide-react";
import { useWallet } from "@/context/WalletContext";

export function WalletConnect() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { address, connectWallet, disconnectWallet } = useWallet();

  const isConnected = Boolean(address);

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connect Wallet</span>
        <span className="sm:hidden">Connect</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-600 hover:bg-gray-900 text-gray-100 rounded-lg transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>

        <span className="hidden sm:inline">
          {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </span>

        <span className="sm:hidden">{address.substring(0, 4)}...</span>

        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
              Connected Wallet
            </p>
            <p className="text-sm font-mono text-gray-100 break-all">
              {address}
            </p>
          </div>

          <button
            onClick={copyAddress}
            className="w-full px-4 py-2 flex items-center gap-2 text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy Address
          </button>

          <a
            href={`https://explorer.mendoza.hoodi.arkiv.network/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-2 flex items-center gap-2 text-gray-100 hover:bg-gray-800 transition-colors border-b border-gray-700"
          >
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </a>

          <button
            onClick={disconnectWallet}
            className="w-full px-4 py-2 flex items-center gap-2 text-red-400 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
