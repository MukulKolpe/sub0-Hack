# 🌉 ArtStake

**ArtStake** is a decentralized prediction market that unifies **NFT art creation** with **community-driven financial incentives**. It creates a *“hype market”* where artists and predictors both earn rewards based on an artwork’s popularity.

The framework uses:

* **ERC721** — minting unique artwork NFTs
* **ERC4626** — isolated, per-market staking vaults and share distribution
* **Arkiv** — for NFT metadata & social metrics (“likes”)
* **50/50 reward split** — between the winning artist and successful predictors

ArtStake lets artists directly monetize the popularity of their work while giving the community a way to financially benefit from curating and identifying rising talent.

---

## 📜 Contract Addresses

> **Astar zkEVM Testnet (420420422)** — primary testnet deployment.

| Contract                 | Address                                      |
| ------------------------ | -------------------------------------------- |
| **PredictionMarket.sol** | `0x4216a9c6EB59FcA323169Ef3194783d3dC9b7F23` |
| **NFTArtwork.sol**       | `0x5B78fbCB2d94e3B1c7Da8eFaA85eB5a2839F905E` |
| **USDC (Mock)**          | `0xE2E3899AcAD6c4F6F1db0702D49d8dA75AE813bb`       |

---

# 🔁 How ArtStake Works (End-to-End Flow)

## 1. Manager Opens Market

The Platform Manager calls `openMarket()`, specifying:

* Market duration (e.g., 7 days)
* Minimum stake amount

A new **ERC4626 Vault** is deployed for this market to securely hold stakes.

---

## 2. Artists Mint & Submit Art

1. Artists upload artwork to IPFS via Lighthouse to get a `tokenURI`.
2. They call **`mintArtwork()`** on `NFTArtwork.sol`.
3. They call **`submitArtwork()`** on `PredictionMarket.sol` to enter the minted NFT into the market.

---

## 3. Predictors Stake on Artworks

Predictors browse the gallery and stake USDC on any artwork they believe will get the most *likes*.

* They call **`predict()`**, which:

  * Transfers USDC into the market’s Vault
  * Records their selected NFT prediction

---

## 4. Manager Closes Market

After the prediction duration ends, the manager calls **`closeMarket()`**, locking further predictions.

---

## 5. Manager Sets Winner

Using Arkiv’s off-chain “likes” data, the Manager calls **`setWinner(tokenId)`**.

This triggers:

* Full redemption of the market Vault
* Automated 50/50 payout split:

  * **50% → winning artist**
  * **50% → reward pool for predictors**

---

## 6. Winners Claim Rewards

Users who staked on the winning artwork call **`claimReward()`** to receive their **pro-rata share** of the predictor pool.

---

# 🧠 Why ArtStake Matters

### ❌ Problems in Traditional NFT Launches

* **Artists only earn on sales**, not popularity.
* **Speculation is disconnected** from real engagement.
* **Likes are off-chain**, providing no value flow to the ecosystem.

### ✅ ArtStake’s Solution

* **Direct Artist Rewards** — the most-liked artist earns 50% of all stakes.
* **Rewards for Curators** — predictors profit for identifying the best art.
* **Hybrid On-Chain/Off-Chain Design** — secure finance on-chain, scalable social metrics off-chain via Arkiv.

---

# 🧱 Architecture Breakdown

## 1. Core Smart Contracts (Solidity)

### **PredictionMarket.sol** — *The Hub*

Handles market lifecycle: open/close, submissions, predictions, and payouts.

### **NFTArtwork.sol** — *The Asset*

ERC721 NFT contract for minting artwork.

### **Vault.sol** — *The Treasury*

ERC4626 Vault deployed per market to isolate and secure staked funds.

### **USDC.sol** — *The Stake*

Mock ERC20 token used for predictions.

---

## 2. Off-Chain Services

### **Lighthouse**

Uploads artwork to IPFS and generates permanent, decentralized `tokenURI`.

### **Arkiv Network**

Tracks “likes” and acts as the source of truth for determining winners.

---

## 3. Frontend

Built using:

* **Next.js + React**
* **ethers.js**

### Role-Based Pages:

* **List Page:** Artists mint and submit art
* **Gallery Page:** Predictors stake, browse, and like artworks
* **Admin Page:** Manager controls markets, sets winners

---

# ⚙️ Tech Stack

| Technology        | Purpose                          |
| ----------------- | -------------------------------- |
| **Solidity**      | Smart contract development       |
| **OpenZeppelin**  | ERC20, ERC721, ERC4626 standards |
| **Foundry**       | Smart contract testing           |
| **Next.js**       | Frontend framework               |
| **ethers.js**     | Wallet + contract interactions   |
| **Lighthouse**    | Decentralized IPFS storage       |
| **Arkiv Network** | Off-chain social metrics         |
| **TailwindCSS**   | UI styling                       |

---

# 🤝 Key Protocol Integrations

### **ERC4626 (OpenZeppelin)**

Used for secure, standardized staking vaults deployed per market.

### **Arkiv Network**

Provides trustless off-chain social engagement metrics.

### **Lighthouse**

Ensures NFT metadata persists on decentralized IPFS storage.

---

# 🚀 Summary

**ArtStake creates an economic flywheel for art + community engagement:**

* **Artists** create and promote engaging art → earn 50% of stakes.
* **Predictors** identify trending art → earn the other 50%.
* **Protocol** bridges social metrics + financial incentives using on-chain/off-chain design.

Deployed Contract Addresses on Paseo Passet Hub:

USDC: 0xE2E3899AcAD6c4F6F1db0702D49d8dA75AE813bb

NFTArtwork: 0x5B78fbCB2d94e3B1c7Da8eFaA85eB5a2839F905E

PredictionMarket: 0x4216a9c6EB59FcA323169Ef3194783d3dC9b7F23

