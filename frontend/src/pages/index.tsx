"use client";

import { useState } from "react";
import { createWalletClient, custom } from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";

export default function Home() {
  const [address, setAddress] = useState("");
  const [client, setClient] = useState<any>(null);

  const connectWallet = async () => {
    if (typeof (window as any).ethereum === "undefined") {
      alert("Please install MetaMask!");
      return;
    }

    console.log("Connecting wallet...");

    try {
      const client = createWalletClient({
        chain: mendoza,
        // @ts-ignore
        transport: custom(window.ethereum!),
      });

      // @ts-ignore
      const accounts = await client.getAddresses();
      console.log("Connected account:", accounts[0]);
      setAddress(accounts[0]);

      const newAccountClient = createWalletClient({
        chain: mendoza,
        account: accounts[0],
        // @ts-ignore
        transport: custom(window.ethereum!),
      });
      setClient(newAccountClient);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setClient(null);
    console.log("Wallet disconnected");
  };

  return (
    <div>
      {!address ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <div>Address: {address}</div>
          <button onClick={disconnectWallet}>Disconnect Wallet</button>
        </div>
      )}
      <h2>Home Page</h2>
    </div>
  );
}
