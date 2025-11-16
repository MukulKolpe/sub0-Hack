// @ts-nocheck comment
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createWalletClient, custom } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";

interface WalletContextType {
  address: string;
  client: any;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [client, setClient] = useState<any>(null);

  // Load address from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setAddress(savedAddress);
      // Recreate client if address exists
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const walletClient = createWalletClient({
          chain: mendoza,
          account: savedAddress as `0x${string}`,
          // @ts-ignore
          transport: custom((window as any).ethereum),
        });
        setClient(walletClient);
      }
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          disconnectWallet();
        } else if (accounts[0] !== address) {
          // User switched accounts
          const newAddress = accounts[0];
          setAddress(newAddress);
          localStorage.setItem("walletAddress", newAddress);

          const walletClient = createWalletClient({
            chain: mendoza,
            account: newAddress as `0x${string}`,
            // @ts-ignore
            transport: custom((window as any).ethereum),
          });
          setClient(walletClient);
        }
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        (window as any).ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, [address]);

  const connectWallet = async () => {
    if (typeof (window as any).ethereum === "undefined") {
      alert("Please install MetaMask!");
      return;
    }

    console.log("Connecting wallet...");

    try {
      // Request account access using eth_requestAccounts
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const account = accounts[0];
      console.log("Connected account:", account);

      setAddress(account);
      localStorage.setItem("walletAddress", account);

      const walletClient = createWalletClient({
        chain: mendoza,
        account: account as `0x${string}`,
        // @ts-ignore
        transport: custom((window as any).ethereum),
      });

      setClient(walletClient);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if ((error as any).code === 4001) {
        // User rejected the request
        alert("Please connect to MetaMask.");
      } else {
        alert("An error occurred while connecting to MetaMask.");
      }
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setClient(null);
    localStorage.removeItem("walletAddress");
    console.log("Wallet disconnected");
  };

  return (
    <WalletContext.Provider
      value={{ address, client, connectWallet, disconnectWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
