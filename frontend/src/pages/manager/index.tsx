// @ts-nocheck comment
"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Key,
  Play,
  StopCircle,
  Trophy,
  Loader2,
  XCircle,
  BarChart,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { ethers } from "ethers";
import PredictionMarketABI from "@/utils/abis/PredictionMarketABI.json";

// --- ABIs and Addresses ---
// Using addresses from your provided files
const NFT_ARTWORK_ADDRESS = "0x5B78fbCB2d94e3B1c7Da8eFaA85eB5a2839F905E";
const PREDICTION_MARKET_ADDRESS = "0x4216a9c6EB59FcA323169Ef3194783d3dC9b7F23";

// --- MANAGER ADDRESS ---
const MANAGER_ADDRESS = "0xc35fc43ae078961bfc34ffb6c2148571b6f87920";

// --- Types ---
interface MarketInfo {
  id: ethers.BigNumber;
  vault: string;
  predictionWindowEnd: ethers.BigNumber;
  minStakeAmount: ethers.BigNumber;
  isOpen: boolean;
  isSettled: boolean;
  winningArtworkId: ethers.BigNumber;
  totalSharesInMarket: ethers.BigNumber;
  predictorPoolAmount: ethers.BigNumber;
}

export default function AdminPage() {
  const { address } = useWallet();
  const [isManager, setIsManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Market State
  const [marketStatus, setMarketStatus] = useState("Loading...");
  const [currentMarketId, setCurrentMarketId] = useState<string | null>(null);
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(null);

  // Form Inputs
  const [durationDays, setDurationDays] = useState("7");
  const [minStake, setMinStake] = useState("100"); // Assuming 100 USDC
  const [winningArtworkId, setWinningArtworkId] = useState("");

  useEffect(() => {
    const checkManagerAndFetchStatus = async () => {
      setIsLoading(true);
      setError(null);
      if (!address) {
        setIsManager(false);
        setIsLoading(false);
        return;
      }

      if (address.toLowerCase() !== MANAGER_ADDRESS.toLowerCase()) {
        setIsManager(false);
        setIsLoading(false);
        return;
      }

      setIsManager(true);

      // User is the manager, fetch market status
      try {
        if (typeof (window as any).ethereum === "undefined") {
          throw new Error("MetaMask not found.");
        }
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );
        const marketContract = new ethers.Contract(
          PREDICTION_MARKET_ADDRESS,
          PredictionMarketABI,
          provider
        );

        const marketId = await marketContract.currentMarketId();
        setCurrentMarketId(marketId.toString());

        if (marketId.isZero()) {
          setMarketStatus("No Market Active");
          setMarketInfo(null);
        } else {
          const info: MarketInfo = await marketContract.markets(marketId);
          setMarketInfo(info);

          if (info.isSettled) {
            setMarketStatus(
              `Market #${info.id.toString()} Settled. Winner: Token ${info.winningArtworkId.toString()}`
            );
          } else if (!info.isOpen) {
            setMarketStatus(
              `Market #${info.id.toString()} Closed. Awaiting Winner...`
            );
          } else {
            const endDate = new Date(
              info.predictionWindowEnd.toNumber() * 1000
            );
            setMarketStatus(
              `Market #${info.id.toString()} is OPEN. Closes: ${endDate.toLocaleString()}`
            );
          }
        }
      } catch (err: any) {
        console.error(err);
        setError((err as any).message || "Failed to fetch market status.");
      } finally {
        setIsLoading(false);
      }
    };

    checkManagerAndFetchStatus();
  }, [address]);

  // --- Transaction Handlers ---

  const getSignerContract = async () => {
    if (typeof (window as any).ethereum === "undefined") {
      throw new Error("MetaMask not found.");
    }
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    const signer = provider.getSigner();
    const marketContractSigner = new ethers.Contract(
      PREDICTION_MARKET_ADDRESS,
      PredictionMarketABI,
      signer
    );
    return marketContractSigner;
  };

  const handleOpenMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const contract = await getSignerContract();
      // Assuming mock USDC has 18 decimals, like the default ERC20
      const stakeAmount = ethers.utils.parseUnits(minStake, 18);

      const tx = await contract.openMarket(durationDays, stakeAmount);
      await tx.wait();

      alert("Market opened successfully!");
      window.location.reload(); // Easiest way to refetch state
    } catch (err: any) {
      // <-- Fixed missing brace here
      console.error(err);
      setError((err as any).message || "Failed to open market.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseMarket = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const contract = await getSignerContract();
      const tx = await contract.closeMarket();
      await tx.wait();

      alert("Market closed successfully!");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError((err as any).message || "Failed to close market.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!winningArtworkId) {
      setError("Please enter a winning Token ID.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const contract = await getSignerContract();
      const tx = await contract.setWinner(winningArtworkId);
      await tx.wait();

      alert(`Winner set to Token ID ${winningArtworkId}!`);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setError((err as any).message || "Failed to set winner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground mt-4">Verifying access...</p>
      </div>
    );
  }

  if (!isManager) {
    return (
      <section className="py-16 px-4 md:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Access Denied
          </h1>
          <p className="text-lg text-muted-foreground">
            This page is for the Platform Manager only.
          </p>
          <p className="text-muted-foreground mt-2">
            We appreciate your curiosity, but this area contains sensitive
            controls.
          </p>
        </div>
      </section>
    );
  }

  // --- Manager Is Logged In ---
  return (
    <section className="py-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Manager Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage the prediction market.
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-12 bg-card border border-border rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                Market Status
              </h3>
              <p className="text-muted-foreground">{marketStatus}</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 max-w-2xl mx-auto p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Open Market */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg flex flex-col">
            <form
              onSubmit={handleOpenMarket}
              className="flex flex-col flex-grow"
            >
              <div className="flex-grow">
                <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Key className="w-6 h-6 text-primary" />
                  1. Open New Market
                </h2>
                <div className="mb-4">
                  <label
                    htmlFor="duration"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="minStake"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Min Stake (USDC)
                  </label>
                  <input
                    type="number"
                    id="minStake"
                    value={minStake}
                    onChange={(e) => setMinStake(e.target.value)}
                    min="1"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || (marketInfo?.isOpen ?? false)}
                  className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  Open Market
                </button>
                {marketInfo?.isOpen && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    A market is already active.
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Card 2: Close Market */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg flex flex-col">
            <div className="flex flex-col flex-grow">
              <div className="flex-grow">
                <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <StopCircle className="w-6 h-6 text-primary" />
                  2. Close Market
                </h2>
                <p className="text-muted-foreground mb-6">
                  Closes the current open market and stops new predictions.
                </p>
              </div>
              <div>
                <button
                  onClick={handleCloseMarket}
                  disabled={isSubmitting || !(marketInfo?.isOpen ?? false)}
                  className="w-full bg-yellow-500 text-black font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <StopCircle className="w-5 h-5" />
                  )}
                  Close Current Market
                </button>
                {!(marketInfo?.isOpen ?? false) && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    No market is currently open.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Set Winner */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg flex flex-col">
            <form
              onSubmit={handleSetWinner}
              className="flex flex-col flex-grow"
            >
              <div className="flex-grow">
                <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  3. Set Winner
                </h2>
                <p className="text-muted-foreground mb-4">
                  Enter the winning Token ID to settle the market and enable
                  payouts.
                </p>
                <div className="mb-6">
                  <label
                    htmlFor="winnerId"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Winning Token ID
                  </label>
                  <input
                    type="number"
                    id="winnerId"
                    value={winningArtworkId}
                    onChange={(e) => setWinningArtworkId(e.target.value)}
                    min="1"
                    placeholder="e.g. 1"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (marketInfo?.isOpen ?? true) ||
                    (marketInfo?.isSettled ?? false)
                  }
                  className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trophy className="w-5 h-5" />
                  )}
                  Set Winner & Settle
                </button>
                {(marketInfo?.isOpen ?? true) && !marketInfo?.isSettled && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Market must be closed first.
                  </p>
                )}
                {marketInfo?.isSettled && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Market is already settled.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
