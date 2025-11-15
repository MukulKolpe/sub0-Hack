import { useWallet } from "@/context/WalletContext";

export default function Home() {
  const { address, connectWallet, disconnectWallet, client } = useWallet();
  console.log("Wallet client in Home:", client);

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
