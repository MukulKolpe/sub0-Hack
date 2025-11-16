"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2, XCircle, ImageOff, PiggyBank } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { ethers } from "ethers";
// We don't need Arkiv here yet, but useWallet is kept for "like" logic
// import { ExpirationTime, jsonPayload } from "@arkiv-network/sdk/utils";

// --- ABIs and Addresses (Copied from List.tsx) ---
const NFT_ARTWORK_ADDRESS = "0x7aD0A9dB054101be9428fa89bB1194506586D1aD";
const PREDICTION_MARKET_ADDRESS = "0x66E1e28A6E6BD3a4c30a53C964e65ADa11Cf9EB8";

// --- Embedded ABI Definitions ---

import NFTArtworkABI from "@/utils/abis/NFTArtworkABI.json";
import PredictionMarketABI from "@/utils/abis/PredictionMarketABI.json";

// --- Minimal ABI for USDC Token ---
const USDCABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];
// ---------------------

// --- Types ---
interface Artwork {
  id: string;
  artist: string;
  imageURI: string;
}

export default function Gallery() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMarketId, setCurrentMarketId] = useState<string | null>(null);

  // --- New State for Staking ---
  const [minStake, setMinStake] = useState<string>("0");
  const [usdcAddress, setUsdcAddress] = useState<string>("");
  const [stakedArtworks, setStakedArtworks] = useState<Record<string, boolean>>(
    {}
  );
  const [isStaking, setIsStaking] = useState<Record<string, boolean>>({});
  // -----------------------------

  // --- ADDED STATE FOR CHAIN ID ---
  const [chainId, setChainId] = useState<string | null>(null);
  // ---------------------------------

  // useWallet is ready for when you implement the 'like' logic
  const { client, address } = useWallet();

  async function switchToChain(chainIdHex: string) {
    // Try switching
    // @ts-ignore
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  }

  useEffect(() => {
    // --- ADDED: Event handler for chain changes ---
    const handleChainChanged = (newChainId: string) => {
      // Ensure the newChainId is processed as a hex string
      setChainId(ethers.BigNumber.from(newChainId).toString());
    };

    // --- ADDED: Set up listeners ---
    if (typeof (window as any).ethereum !== "undefined") {
      // Set initial chainId
      (async () => {
        try {
          const provider = new ethers.providers.Web3Provider(
            (window as any).ethereum
          );
          const network = await provider.getNetwork();
          setChainId(network.chainId.toString());
        } catch (e) {
          console.error("Could not get initial chainId", e);
        }
      })();

      // Listen for future changes
      (window as any).ethereum.on("chainChanged", handleChainChanged);
    }
    // -----------------------------

    // --- Checks if user has already staked ---
    const checkUserStakes = async (
      artworksToCheck: Artwork[],
      marketId: string,
      marketContract: ethers.Contract,
      userAddress: string
    ) => {
      if (!userAddress) return; // Don't check if user is not connected

      const stakes: Record<string, boolean> = {};
      for (const art of artworksToCheck) {
        try {
          const prediction = await marketContract.predictions(
            marketId,
            art.id,
            userAddress
          );
          // Check if shares property is greater than 0
          if (prediction.shares.gt(0)) {
            stakes[art.id] = true;
          }
        } catch (err) {
          console.error(`Failed to check stake for ${art.id}`, err);
        }
      }
      setStakedArtworks(stakes);
    };

    const fetchArtworks = async () => {
      if (typeof (window as any).ethereum === "undefined") {
        setError("Please install MetaMask!");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await switchToChain("0x190F1B46"); // Switch to Polkadot Hub Testnet
        const provider = new ethers.providers.Web3Provider(
          (window as any).ethereum
        );

        const marketContract = new ethers.Contract(
          PREDICTION_MARKET_ADDRESS,
          PredictionMarketABI,
          provider
        );

        const nftContract = new ethers.Contract(
          NFT_ARTWORK_ADDRESS,
          NFTArtworkABI,
          provider
        );

        // 1. Get Market ID, USDC Address, and Min Stake
        const marketId = (await marketContract.currentMarketId()).toString();
        setCurrentMarketId(marketId);

        const usdcAddr = await marketContract.usdc();
        setUsdcAddress(usdcAddr);

        const marketData = await marketContract.markets(marketId);
        const minStakeAmount = marketData.minStakeAmount.toString();
        setMinStake(minStakeAmount);

        // 2. Create a filter to find all 'ArtworkSubmitted' events for this market
        const filter = marketContract.filters.ArtworkSubmitted(
          BigInt(marketId)
        );

        // 3. Query the blockchain for those events
        const logs = await marketContract.queryFilter(filter);

        // 4. For each event, get the artwork's metadata
        const artworkPromises = logs.map(async (log: any) => {
          try {
            const tokenId = BigInt(log.topics[2]).toString(); // artworkId is the 2nd indexed topic
            const artist = ethers.utils.getAddress(
              ethers.utils.hexDataSlice(log.topics[3], 12) // artist is the 3rd indexed topic
            );

            // 5. Get the image URI from the NFT contract
            const imageURI = await nftContract.tokenURI(tokenId);

            return {
              id: tokenId,
              artist,
              imageURI,
            };
          } catch (err) {
            // No need to switch chain here, already handled by main try/catch
            console.error("Error processing one artwork:", err);
            return null; // Skip any artworks that fail to load
          }
        });

        const settledArtworks = (await Promise.all(artworkPromises)).filter(
          (a) => a !== null
        ) as Artwork[];

        setArtworks(settledArtworks);

        // 4. Check which artworks the user has already staked on
        if (address) {
          await checkUserStakes(
            settledArtworks,
            marketId,
            marketContract,
            address
          );
        }
      } catch (err: any) {
        console.error(err);
        if ((err as any).code === 4001) {
          setError(
            "Please connect to the Polkadot Hub Testnet (0x190F1B46) to use the app."
          );
        } else if ((err as any).code === 4902) {
          setError(
            "Polkadot Hub Testnet (0x190F1B46) is not added to your wallet. Please add it."
          );
          // TODO: Add a button to trigger adding the chain
        } else {
          setError((err as any).message || "An unknown error occurred.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtworks();

    // --- ADDED: Cleanup for listener ---
    return () => {
      if (typeof (window as any).ethereum !== "undefined") {
        (window as any).ethereum.removeListener(
          "chainChanged",
          handleChainChanged
        );
      }
    };
    // --- END ADDED ---
  }, [address, chainId]); // --- MODIFIED DEPENDENCY ARRAY ---

  // --- Handle Staking ---
  const handleStake = async (artworkId: string) => {
    if (!address || !usdcAddress || !currentMarketId) {
      setError("Please connect your wallet to stake.");
      return;
    }

    setIsStaking((prev) => ({ ...prev, [artworkId]: true }));
    setError(null);

    try {
      const provider = new ethers.providers.Web3Provider(
        (window as any).ethereum
      );
      const signer = provider.getSigner();

      const marketContractSigner = new ethers.Contract(
        PREDICTION_MARKET_ADDRESS,
        PredictionMarketABI,
        signer
      );

      const usdcContract = new ethers.Contract(usdcAddress, USDCABI, signer);

      // 1. Approve USDC
      const approveTx = await usdcContract.approve(
        PREDICTION_MARKET_ADDRESS,
        minStake
      );
      await approveTx.wait();

      // 2. Call 'predict' on the market contract
      const predictTx = await marketContractSigner.predict(artworkId, minStake);
      await predictTx.wait();

      // 3. Update state to show the 'Like' button
      setStakedArtworks((prev) => ({ ...prev, [artworkId]: true }));
    } catch (err: any) {
      console.error("Staking failed:", err);
      setError((err as any).message || "Staking transaction failed.");
    } finally {
      setIsStaking((prev) => ({ ...prev, [artworkId]: false }));
    }
  };

  // --- Handle Liking (After Staking) ---
  const handleLike = (tokenId: string) => {
    console.log("Like button clicked for token:", tokenId);
    // TODO: Implement your Arkiv SDK logic here
    // You will likely need to:
    // 1. Query Arkiv to find the entity associated with this `tokenId`
    // 2. Get that entity's `entityKey`
    // 3. Use `client.updateEntity()` or a similar function to update its 'likes'
    alert(`Liking Token ID: ${tokenId}\n(Implement Arkiv logic in handleLike)`);
  };

  const renderButton = (art: Artwork) => {
    const hasStaked = stakedArtworks[art.id];
    const isButtonLoading = isStaking[art.id];

    if (hasStaked) {
      return (
        <button
          onClick={() => handleLike(art.id)}
          className="w-full mt-4 bg-primary/10 text-primary font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 hover:bg-primary/20 flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4" />
          Like
        </button>
      );
    }

    return (
      <button
        onClick={() => handleStake(art.id)}
        disabled={isButtonLoading}
        className="w-full mt-4 bg-accent text-accent-foreground font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 hover:bg-accent/90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isButtonLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <PiggyBank className="w-4 h-4" />
        )}
        Stake
      </button>
    );
  };

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Artwork Gallery
          </h1>
          <p className="text-lg text-muted-foreground">
            {currentMarketId
              ? `Showing submissions for Market #${currentMarketId}`
              : "Loading current market..."}
          </p>
          <p className="text-lg text-muted-foreground">
            Stake on your favorite artwork for a chance to win!
          </p>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground mt-4">
              Loading artworks from the blockchain...
            </p>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Gallery Grid */}
        {!isLoading && !error && artworks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64">
            <ImageOff className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground mt-4">
              No artworks have been submitted to this market yet.
            </p>
          </div>
        )}

        {!isLoading && !error && artworks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((art) => (
              <div
                key={art.id}
                className="bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col"
              >
                {/* Image */}
                <div className="w-full aspect-square bg-muted overflow-hidden">
                  <img
                    src={art.imageURI}
                    alt={`Artwork ${art.id}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/600x600/222/888?text=Image+Failed";
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex-grow">
                    <p className="text-sm font-semibold text-foreground">
                      Token ID: {art.id}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      Artist: {art.artist}
                    </p>
                  </div>

                  {/* Stake or Like Button */}
                  <div className="mt-4">{renderButton(art)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
