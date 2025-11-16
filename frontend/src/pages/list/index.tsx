// @ts-nocheck comment
"use client";

import { useState } from "react";
import { Upload, ImagePlus, CheckCircle, XCircle } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
// import { mendoza } from "@arkiv-network/sdk/chains"; // Not used in this snippet
// import { createWalletClient, http } from "@arkiv-network/sdk"; // Not used in this snippet

// --- Smart Contract Integration ---
import { ethers } from "ethers";
import lighthouse from "@lighthouse-web3/sdk";
import NFTArtworkABI from "@/utils/abis/NFTArtworkABI.json";
import PredictionMarketABI from "@/utils/abis/PredictionMarketABI.json";

const NFT_ARTWORK_ADDRESS = "0x5B78fbCB2d94e3B1c7Da8eFaA85eB5a2839F905E";
const PREDICTION_MARKET_ADDRESS = "0x4216a9c6EB59FcA323169Ef3194783d3dC9b7F23";

const LIGHTHOUSE_API_KEY = "72e884cb.a97daa1a5c8b474ca32bbec9d238d603";

export default function List() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string>("");

  const { client, address } = useWallet();

  const handleImageChange = async (file: any) => {
    setImage(file);

    const previewFile = file[0];
    if (previewFile && previewFile.type.startsWith("image/")) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(previewFile);
      setIsSuccess(false);
    }
    const output = await lighthouse.upload(file, LIGHTHOUSE_API_KEY);
    console.log("File Status:", output);

    console.log(
      "Visit at https://gateway.lighthouse.storage/ipfs/" + output.data.Hash
    );

    setImageUri("https://gateway.lighthouse.storage/ipfs/" + output.data.Hash);
  };

  async function switchToChain(chainIdHex: string) {
    // Try switching
    // @ts-ignore
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image || !title || !description) {
      setError("Please fill out all fields and select an image.");
      return;
    }
    if (typeof (window as any).ethereum === "undefined") {
      setError("Please install MetaMask!");
      return;
    }

    setIsUploading(true);
    setIsSuccess(false);
    setError(null);

    let provider;
    let signer;

    try {
      // --- 0. Connect to Wallet ---
      setUploadStep("Connecting to wallet...");
      provider = new ethers.providers.Web3Provider((window as any).ethereum);
      signer = provider.getSigner();

      // --- 2. Mint NFT ---
      setUploadStep("Minting your NFT...");
      const nftContract = new ethers.Contract(
        NFT_ARTWORK_ADDRESS,
        NFTArtworkABI,
        signer
      );

      const mintTx = await nftContract.mintArtwork(imageUri);
      console.log("Minting transaction", mintTx);
      const mintReceipt = await mintTx.wait();

      const transferTopic = ethers.utils.id(
        "Transfer(address,address,uint256)"
      );

      const transferEvent = mintReceipt.logs.find(
        (log: any) => log.topics[0] === transferTopic
      );

      const tokenId = BigInt(transferEvent.topics[3]).toString();
      console.log("NFT Minted with tokenId:", tokenId);

      // --- 3. Submit to Market ---
      setUploadStep("Submitting to market...");
      const marketContract = new ethers.Contract(
        PREDICTION_MARKET_ADDRESS,
        PredictionMarketABI,
        signer
      );

      const submitTx = await marketContract.submitArtwork(tokenId);
      await submitTx.wait();
      console.log("Artwork submitted to market!");

      await switchToChain("0xe0087f840"); // Switch to Mendoza chain

      // --- 4. Create Arkiv Entity (Your crucial step) ---
      setUploadStep("Finalizing entity...");
      console.log("Uploading as account:", address);

      const { entityKey, txHash } = await client.createEntity({
        payload: jsonToPayload({
          entity: {
            nftId: tokenId, // Use the actual tokenId from the smart contract
            entityId: tokenId, // Use the same
            likes: 0,
            creator: address,
            title: title,
            description: description,
            imageURI: imageUri,
          },
        }),
        contentType: "application/json",
        attributes: [
          { key: "category", value: "artwork" },
          { key: "version", value: "1.0" },
        ],
        expiresIn: ExpirationTime.fromDays(30), // Entity expires in 30 days
      });

      console.log("Entity created with key:", entityKey, "Tx Hash:", txHash);

      // --- 5. Success ---
      setIsSuccess(true);
      setUploadStep("Artwork listed successfully!");
      setIsUploading(false);
      // Reset form
      setTitle("");
      setDescription("");
      setImage(null);
      setPreview("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unknown error occurred.");
      setIsUploading(false);
      setUploadStep("");
    }
  };

  const isFormValid = title && description && image && !isUploading;

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            List Your Artwork
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your art, mint it as an NFT, and enter the prediction market
            in one go.
          </p>
        </div>

        {/* Upload Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-8 shadow-lg"
        >
          {/* Preview Section */}
          <div className="mb-8">
            {preview ? (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <ImagePlus className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No image selected</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Input */}
          <div className="mb-6">
            <label className="flex items-center justify-center w-full">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files)}
                disabled={isUploading}
                className="hidden"
              />
              <div
                className={`w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-lg font-semibold transition-colors ${
                  isUploading
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:bg-primary/90"
                }`}
              >
                <Upload className="w-5 h-5 mr-2" />
                {preview ? "Change Image" : "Select Image"}
              </div>
            </label>
          </div>

          {/* Title Input */}
          <div className="mb-6">
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Artwork Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              placeholder='e.g. "Sunset over the digital sea"'
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description Input */}
          <div className="mb-8">
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-foreground mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={4}
              placeholder="A brief description of your artwork..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && !error && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 text-green-600 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{uploadStep}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {uploadStep || "Listing..."}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                List Artwork
              </>
            )}
          </button>
        </form>

        {/* Benefits Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">1</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Upload Artwork
            </h3>
            <p className="text-sm text-muted-foreground">
              Submit your painting, digital art, or music NFT
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">2</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Enter Market</h3>
            <p className="text-sm text-muted-foreground">
              Your artwork enters the prediction market
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary font-bold">3</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">Earn Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Get 50% of the vault if you win the most likes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
