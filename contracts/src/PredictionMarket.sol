// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./Vault.sol";

/**
 * @title PredictionMarket
 * @dev This is the main prediction market contract.
 */
contract PredictionMarket is Ownable {
    // === STATE VARIABLES ===

    IERC721 public immutable nftArtwork;
    IERC20 public immutable usdc;

    uint256 public currentMarketId;

    struct Market {
        uint256 id;
        Vault vault; // A dedicated vault for this market
        uint256 predictionWindowEnd;
        uint256 minStakeAmount;
        bool isOpen;
        bool isSettled;
        uint256 winningArtworkId;
        uint256 totalSharesInMarket;
        uint256 predictorPoolAmount; // 50% of total, set on settlement
    }

    struct ArtworkInfo {
        address artist;
        uint256 totalSharesPredicted; // Total shares staked on this artwork
    }

    // not sure if required for now
    struct Prediction {
        uint256 shares; // User's shares on a specific artwork
        bool hasClaimed;
    }

    mapping(uint256 => Market) public markets;

    mapping(uint256 => mapping(uint256 => ArtworkInfo)) public artworks;

    mapping(uint256 => mapping(uint256 => mapping(address => Prediction)))
        public predictions;

    // === EVENTS ===

    event MarketOpened(
        uint256 indexed marketId,
        address indexed vaultAddress,
        uint256 endTime
    );
    event ArtworkSubmitted(
        uint256 indexed marketId,
        uint256 indexed artworkId,
        address indexed artist
    );
    event Predicted(
        uint256 indexed marketId,
        uint256 indexed artworkId,
        address indexed predictor,
        uint256 amount,
        uint256 shares
    );
    event MarketClosed(uint256 indexed marketId);
    event MarketSettled(
        uint256 indexed marketId,
        uint256 indexed winningArtworkId,
        address indexed winningArtist,
        uint256 artistPayout,
        uint256 predictorPool
    );
    event RewardClaimed(
        uint256 indexed marketId,
        address indexed predictor,
        uint256 rewardAmount
    );

    // === FUNCTIONS ===

    /**
     * @dev Deploys the main contract.
     * @param _nftArtwork Address of the deployed NFTArtwork contract.
     * @param _usdc Address of the deployed usdc contract.
     */
    constructor(address _nftArtwork, address _usdc) Ownable(msg.sender) {
        nftArtwork = IERC721(_nftArtwork);
        usdc = IERC20(_usdc);
        currentMarketId = 0;
    }

    /**
     * @notice (Manager Only) Opens a new prediction market.
     * @dev Deploys a new Vault for this market.
     * @param _durationDays The length of the prediction window in days.
     * @param _minStake The minimum amount of usdc for a single prediction.
     */
    function openMarket(
        uint256 _durationDays,
        uint256 _minStake
    ) public onlyOwner {
        if (currentMarketId > 0) {
            require(
                !markets[currentMarketId].isOpen,
                "Current market still open"
            );
        }

        currentMarketId++;
        uint256 marketId = currentMarketId;

        // Deploy a new, dedicated vault for this market
        Vault newVault = new Vault(usdc);

        markets[marketId] = Market({
            id: marketId,
            vault: newVault,
            predictionWindowEnd: block.timestamp + (_durationDays * 1 days),
            minStakeAmount: _minStake,
            isOpen: true,
            isSettled: false,
            winningArtworkId: 0,
            totalSharesInMarket: 0,
            predictorPoolAmount: 0
        });

        emit MarketOpened(
            marketId,
            address(newVault),
            markets[marketId].predictionWindowEnd
        );
    }

    /**
     * @notice (Artist) Submits an artwork to the *current* open market.
     * @dev Artist must be the owner of the NFT.
     * @param _artworkId The tokenId of the NFT from the NFTArtwork contract.
     */
    function submitArtwork(uint256 _artworkId) public {
        uint256 marketId = currentMarketId;
        Market storage market = markets[marketId];
        require(market.isOpen, "Market not open");
        require(
            block.timestamp < market.predictionWindowEnd,
            "Predictions closed"
        );

        // Check that this artwork hasn't already been submitted
        require(
            artworks[marketId][_artworkId].artist == address(0),
            "Artwork already submitted"
        );

        // Verify the caller is the owner of the NFT
        address artist = nftArtwork.ownerOf(_artworkId);
        require(artist == msg.sender, "Caller is not the artist");

        artworks[marketId][_artworkId] = ArtworkInfo({
            artist: artist,
            totalSharesPredicted: 0
        });

        emit ArtworkSubmitted(marketId, _artworkId, artist);
    }

    /**
     * @notice (Predictor) Predicts on an artwork by staking tokens.
     * @dev User MUST have first approved this contract to spend their usdc.
     * @param _artworkId The ID of the artwork to predict on.
     * @param _amount The amount of usdc to stake.
     */
    function predict(uint256 _artworkId, uint256 _amount) public {
        uint256 marketId = currentMarketId;
        Market storage market = markets[marketId];
        require(market.isOpen, "Market not open");
        require(
            block.timestamp < market.predictionWindowEnd,
            "Predictions closed"
        );
        require(_amount >= market.minStakeAmount, "Stake below minimum");

        // Check that artwork is part of the market
        require(
            artworks[marketId][_artworkId].artist != address(0),
            "Artwork not in market"
        );

        Vault vault = market.vault;

        // 1. Pull tokens from user (user must have approved this contract)
        usdc.transferFrom(msg.sender, address(this), _amount);

        // 2. Approve the vault to spend these tokens
        usdc.approve(address(vault), _amount);

        // 3. Deposit tokens into the vault, minting shares TO THE USER
        // This is the key: vault.deposit() pulls from this contract (which we
        // just funded and approved) but mints shares to the `receiver` (msg.sender).
        uint256 shares = vault.deposit(_amount, msg.sender);

        // 4. Record the prediction
        Prediction storage p = predictions[marketId][_artworkId][msg.sender];
        p.shares += shares;
        artworks[marketId][_artworkId].totalSharesPredicted += shares;
        market.totalSharesInMarket += shares;

        emit Predicted(marketId, _artworkId, msg.sender, _amount, shares);
    }

    /**
     * @notice (Manager Only) Closes the prediction window for the current market.
     */
    function closeMarket() public onlyOwner {
        uint256 marketId = currentMarketId;
        Market storage market = markets[marketId];
        require(market.isOpen, "Market not open");
        require(
            block.timestamp >= market.predictionWindowEnd,
            "Prediction window not closed"
        );

        market.isOpen = false;
        emit MarketClosed(marketId);
    }

    /**
     * @notice (Manager Only) Sets the winner after the market is closed.
     * @dev This triggers the settlement and payout logic.
     * @param _winningArtworkId The ID of the winning artwork.
     */
    function setWinner(uint256 _winningArtworkId) public onlyOwner {
        uint256 marketId = currentMarketId;
        Market storage market = markets[marketId];
        require(!market.isOpen, "Market still open");
        require(!market.isSettled, "Market already settled");
        require(
            artworks[marketId][_winningArtworkId].artist != address(0),
            "Winner not in market"
        );

        market.winningArtworkId = _winningArtworkId;
        market.isSettled = true;

        // --- Settlement Logic ---
        Vault vault = market.vault;

        // 1. Redeem all assets from the vault to this contract
        // We redeem by shares (totalSupply) and send assets to `address(this)`
        uint256 totalAssets = vault.totalAssets();
        vault.redeem(vault.totalSupply(), address(this), address(this));

        // 2. Split the total assets 50/50
        uint256 artistAmount = totalAssets / 2;
        uint256 predictorPool = totalAssets - artistAmount; // Avoids rounding errors

        // 3. Store the predictor pool amount for claims
        market.predictorPoolAmount = predictorPool;

        // 4. Pay the winning artist
        address winningArtist = artworks[marketId][_winningArtworkId].artist;
        usdc.transfer(winningArtist, artistAmount);

        emit MarketSettled(
            marketId,
            _winningArtworkId,
            winningArtist,
            artistAmount,
            predictorPool
        );
    }

    /**
     * @notice (Winning Predictor) Claims their reward from a settled market.
     * @param _marketId The ID of the market to claim from.
     */
    function claimReward(uint256 _marketId) public {
        Market storage market = markets[_marketId];
        require(market.isSettled, "Market not settled");

        uint256 winnerId = market.winningArtworkId;
        Prediction storage p = predictions[_marketId][winnerId][msg.sender];

        require(p.shares > 0, "Not a winner");
        require(!p.hasClaimed, "Already claimed");

        p.hasClaimed = true;

        // Calculate reward:
        // (User's Winning Shares / Total Winning Shares) * Predictor Pool
        uint256 totalWinningShares = artworks[_marketId][winnerId]
            .totalSharesPredicted;

        // This check prevents division by zero, though it shouldn't happen
        // if a winner was set and there were predictors.
        if (totalWinningShares == 0) {
            return;
        }

        uint256 reward = (market.predictorPoolAmount * p.shares) /
            totalWinningShares;

        if (reward > 0) {
            usdc.transfer(msg.sender, reward);
        }

        emit RewardClaimed(_marketId, msg.sender, reward);
    }
}
