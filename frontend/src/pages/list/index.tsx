"use client";

import { useState } from "react";
import { Upload, ImagePlus, CheckCircle } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { mendoza } from "@arkiv-network/sdk/chains";
import { createWalletClient, http } from "@arkiv-network/sdk";

export default function List() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { client, address } = useWallet();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setIsSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!image) return;

    if (typeof (window as any).ethereum === "undefined") {
      alert("Please install MetaMask!");
      return;
    }

    setIsUploading(true);

    console.log(client);

    const accounts = await client.getAddresses();
    console.log("Uploading as account:", accounts[0]);

    // @to-do: Integrate with nft id of smart contract
    const nftId = Date.now(); // Simple unique ID based on timestamp

    const { entityKey, txHash } = await client.createEntity({
      payload: jsonToPayload({
        entity: {
          nftId: nftId,
          entityId: nftId,
          likes: 0,
          creator: address,
        },
      }),
      contentType: "application/json",
      attributes: [
        { key: "category", value: "documentation" },
        { key: "version", value: "1.0" },
      ],
      expiresIn: ExpirationTime.fromDays(30), // Entity expires in 30 days
    });

    console.log("Entity created with key:", entityKey, "Tx Hash:", txHash);

    if (txHash) {
      setIsSuccess(true);
      setIsUploading(false);
    }
  };

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            List Your Artwork
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your painting, digital art, or music NFT to participate in
            the prediction market
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* Preview Section */}
          {preview ? (
            <div className="mb-8">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-border">
                <img
                  src={preview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-border flex items-center justify-center">
                <div className="text-center">
                  <ImagePlus className="w-16 h-16 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No image selected</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Input */}
          <div className="mb-8">
            <label className="flex items-center justify-center w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploading}
                className="hidden"
              />
              <div className="w-full flex items-center justify-center px-6 py-4 bg-primary text-primary-foreground rounded-lg font-semibold cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-5 h-5 mr-2" />
                {preview ? "Change Image" : "Select Image"}
              </div>
            </label>
          </div>

          {/* Upload Button */}
          {image && (
            <button
              onClick={handleUpload}
              disabled={isUploading || isSuccess}
              className="w-full bg-accent text-accent-foreground font-semibold py-3 rounded-lg transition-all duration-300 hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Uploaded Successfully!
                </>
              ) : isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Artwork
                </>
              )}
            </button>
          )}

          {/* Info Text */}
          {!image && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Supported formats: JPG, PNG, GIF, WebP • Max size: 50MB
            </p>
          )}
        </div>

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
