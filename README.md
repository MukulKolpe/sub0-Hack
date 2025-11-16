# 🎨 Artcast

**Artcast** is a decentralized prediction market that unifies **NFT art creation** with **community-driven financial incentives**. It creates a *“hype market”* where artists and predictors both earn rewards based on an artwork’s popularity.

The framework uses:

* **ERC721** — minting unique artwork NFTs
* **ERC4626** — isolated, per-market staking vaults and share distribution
* **Arkiv** — for NFT metadata & social metrics (“likes”)
* **50/50 reward split** — between the winning artist and successful predictors

Artcast lets artists directly monetize the popularity of their work while giving the community a way to financially benefit from curating and identifying rising talent.

---

## 📜 Contract Addresses

### Paseo Passet Hub (Polkadot Hub Testnet):

**USDC:** [0xE2E3899AcAD6c4F6F1db0702D49d8dA75AE813bb](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xE2E3899AcAD6c4F6F1db0702D49d8dA75AE813bb)

**NFTArtwork:** [0x5B78fbCB2d94e3B1c7Da8eFaA85eB5a2839F905E](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x5B78fbCB2d94e3B1c7Da8eFaA85eB5a2839F905E)

**PredictionMarket:** [0x4216a9c6EB59FcA323169Ef3194783d3dC9b7F23](https://blockscout-passet-hub.parity-testnet.parity.io/address/0x4216a9c6EB59FcA323169Ef3194783d3dC9b7F23)

---

# 🔁 How Artcast Works (End-to-End Flow)

## 1. Manager Opens Market

The Platform Manager calls `openMarket()`, specifying:

* Market duration (e.g., 7 days)
* Minimum stake amount

A new **ERC4626 Vault** is deployed for this market to securely hold stakes.

---

## 2. Artists Mint & Submit Art

* Artists upload artwork by minting the NFT, and submit their artwork
* A unique, securely queryable entity is created on Arkiv Network


---

## 3. Predictors Stake on Artworks

Predictors browse the gallery and stake USDC on any artwork they believe will get the most *likes*.

* They call **`predict()`**, which:

  * Transfers USDC into the market’s Vault and in return gets the shares fromthe  vault
  * Records their selected NFT prediction

---

## 4. The prediction market is closed

After the prediction duration ends, the predictions are locked

---

## 5. The Winner is set

Using Arkiv’s off-chain “likes” data **`setWinner(tokenId)`** is called.

This triggers:

* Full redemption of the market Vault
* Automated 50/50 payout split:

  * **50% → winning artist**
  * **50% → reward pool for predictors**

---

## 6. Winners get Rewards

* Winners are sent their due prize amount

---

# 🧠 Why Artcast Matters

### ❌ Problems in Traditional NFT Launches

* **Artists only earn on sales**, not popularity.
* **Speculation is disconnected** from real engagement.

### ✅ Artcasts’s Solution

* **Direct Artist Rewards** — the most-liked artist earns 50% of all stakes.
* **Rewards for Curators** — predictors profit for identifying the best art.

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

ERC20 token used for predictions.

---

## 2. Off-Chain Services

### **Arkiv Network**

* Holds metadata about the NFTs.
* Tracks “likes” and acts as the source of truth for determining winners.

---


---

# ⚙️ Tech Stack

| Technology        | Purpose                          |
| ----------------- | -------------------------------- |
| **Solidity**      | Smart contract development       |
| **OpenZeppelin**  | ERC20, ERC721, ERC4626 standards |
| **Foundry**       | Smart contract testing           |
| **Next.js**       | Frontend framework               |
| **ethers.js**     | contract interactions   |
| **Lighthouse**    | Decentralized IPFS storage       |
| **Arkiv Network** | Storing & Querying metadata, Likes, etc       |
| **TailwindCSS**   | UI styling                       |


# Architecture Diagram

<img width="781" height="566" alt="Artcast drawio" src="https://github.com/user-attachments/assets/172ae44b-8f44-4ec2-abd3-409985725311" />

# 🚀 Summary

**Artcast creates an economic flywheel for art + community engagement:**

* **Artists** create and promote engaging art → earn 50% of stakes.
* **Predictors** identify trending art → earn the other 50%.
* **Protocol** bridges social metrics + financial incentives using on-chain/off-chain design.






