// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/USDC.sol";
import "../src/NFTArtwork.sol";
import "../src/PredictionMarket.sol";

/**
 * @title PredictionMarket Integration Test
 */
contract PredictionMarketTest is Test {
    // === Contracts ===
    USDC public usdc;
    NFTArtwork public nftArtwork;
    PredictionMarket public market;

    // === Users ===
    address public manager;
    address public artist;
    address public p1_winner; // Predictor 1 (Winner)
    address public p2_winner; // Predictor 2 (Winner)
    address public p3_loser; // Predictor 3 (Loser)

    // === Constants ===
    uint256 public constant USDC_DECIMALS = 6;
    uint256 public constant INITIAL_FUNDING = 1_000_000 * (10 ** USDC_DECIMALS); // 1M USDC

    function setUp() public {
        // === Setup Users ===
        manager = address(this);
        artist = vm.addr(0x1);
        p1_winner = vm.addr(0x2);
        p2_winner = vm.addr(0x3);
        p3_loser = vm.addr(0x4);

        // === Deploy Contracts ===
        // Deploy USDC (Manager gets 1M)
        usdc = new USDC();

        // Deploy NFT (Manager is owner)
        nftArtwork = new NFTArtwork();

        // Deploy Market
        market = new PredictionMarket(address(nftArtwork), address(usdc));

        // === Fund Users ===
        // Fund predictors from the manager's initial mint
        usdc.transfer(p1_winner, INITIAL_FUNDING);
        usdc.transfer(p2_winner, INITIAL_FUNDING);
        usdc.transfer(p3_loser, INITIAL_FUNDING);
    }

    /**
     * @notice Full integration test for a complete market lifecycle
     */
    function test_Integration_FullMarketCycle() public {
        // === Test Constants ===
        uint256 minStake = 100 * (10 ** USDC_DECIMALS);
        uint256 durationDays = 1;
        uint256 art1_ID = 1; // Winning Art
        uint256 art2_ID = 2; // Losing Art

        // Stakes
        uint256 p1_Stake = 300 * (10 ** USDC_DECIMALS); // 300 USDC on Art 1
        uint256 p2_Stake = 100 * (10 ** USDC_DECIMALS); // 100 USDC on Art 1
        uint256 p3_Stake = 200 * (10 ** USDC_DECIMALS); // 200 USDC on Art 2

        // Total pool = 300 + 100 + 200 = 600 USDC
        uint256 totalPool = p1_Stake + p2_Stake + p3_Stake;

        // === 1. Open Market (Manager) ===
        vm.prank(manager);
        market.openMarket(durationDays, minStake);
        assertEq(market.currentMarketId(), 1);
        (uint256 id, , , , bool isOpen, , , , ) = market.markets(1);
        assertTrue(isOpen);
        assertEq(id, 1);

        // === 2. Submit Artworks (Artist) ===
        // Artist mints and submits Art 1
        vm.prank(artist);
        nftArtwork.mintArtwork("ipfs://art1");
        vm.prank(artist);
        market.submitArtwork(art1_ID);
        assertEq(nftArtwork.ownerOf(art1_ID), artist);

        // Artist mints and submits Art 2
        vm.prank(artist);
        nftArtwork.mintArtwork("ipfs://art2");
        vm.prank(artist);
        market.submitArtwork(art2_ID);
        assertEq(nftArtwork.ownerOf(art2_ID), artist);

        // === 3. Predictors Stake ===
        // P1 stakes 300 on Art 1 (Winner)
        vm.prank(p1_winner);
        usdc.approve(address(market), p1_Stake);
        vm.prank(p1_winner);
        market.predict(art1_ID, p1_Stake);
        assertEq(usdc.balanceOf(p1_winner), INITIAL_FUNDING - p1_Stake);

        // P2 stakes 100 on Art 1 (Winner)
        vm.prank(p2_winner);
        usdc.approve(address(market), p2_Stake);
        vm.prank(p2_winner);
        market.predict(art1_ID, p2_Stake);
        assertEq(usdc.balanceOf(p2_winner), INITIAL_FUNDING - p2_Stake);

        // P3 stakes 200 on Art 2 (Loser)
        vm.prank(p3_loser);
        usdc.approve(address(market), p3_Stake);
        vm.prank(p3_loser);
        market.predict(art2_ID, p3_Stake);
        assertEq(usdc.balanceOf(p3_loser), INITIAL_FUNDING - p3_Stake);

        // === 4. Close Market (Manager) ===
        // Advance time past the end date
        vm.warp(block.timestamp + durationDays * 1 days + 1);
        vm.prank(manager);
        market.closeMarket();
        (, , , , isOpen, , , , ) = market.markets(1);
        assertFalse(isOpen);

        // === 5. Set Winner (Manager) ===
        uint256 artistPayout = totalPool / 2; // 600 / 2 = 300 USDC
        uint256 predictorPool = totalPool - artistPayout; // 600 - 300 = 300 USDC

        uint256 artistBal_before = usdc.balanceOf(artist);
        uint256 marketBal_before = usdc.balanceOf(address(market)); // Should be 0

        (, Vault marketVault, , , , , , , ) = market.markets(1);

        address vaultAddress = address(marketVault);

        uint256 vaultBal = usdc.balanceOf(vaultAddress);

        assertEq(marketBal_before, 0);
        assertEq(vaultBal, totalPool); // Vault holds all 600 USDC

        vm.prank(manager);
        market.setWinner(art1_ID);

        // === 6. Verify Payouts ===
        // Check if artist was paid
        assertEq(usdc.balanceOf(artist), artistBal_before + artistPayout);

        // Check if market contract now holds the predictor pool
        assertEq(usdc.balanceOf(address(market)), predictorPool);
        assertEq(usdc.balanceOf(vaultAddress), 0); // Vault should be empty

        // Check market state
        (, , , , , bool isSettled, uint256 winner, , uint256 poolAmt) = market
            .markets(1);
        assertTrue(isSettled);
        assertEq(winner, art1_ID);
        assertEq(poolAmt, predictorPool);

        // === 7. Claim Rewards (Winners) ===
        // P1 & P2 both bet on Art 1.
        // Total winning stake (shares) = 300 (P1) + 100 (P2) = 400
        // P1 Reward = (300 / 400) * predictorPool = 0.75 * 300 = 225 USDC
        // P2 Reward = (100 / 400) * predictorPool = 0.25 * 300 = 75 USDC

        uint256 p1_Reward = (p1_Stake * predictorPool) / (p1_Stake + p2_Stake);
        uint256 p2_Reward = (p2_Stake * predictorPool) / (p1_Stake + p2_Stake);

        assertEq(p1_Reward, 225 * (10 ** USDC_DECIMALS));
        assertEq(p2_Reward, 75 * (10 ** USDC_DECIMALS));

        // P1 Claims
        vm.prank(p1_winner);
        market.claimReward(1);
        assertEq(
            usdc.balanceOf(p1_winner),
            (INITIAL_FUNDING - p1_Stake) + p1_Reward
        );

        // P2 Claims
        vm.prank(p2_winner);
        market.claimReward(1);
        assertEq(
            usdc.balanceOf(p2_winner),
            (INITIAL_FUNDING - p2_Stake) + p2_Reward
        );

        // Market balance should now be 0
        assertEq(usdc.balanceOf(address(market)), 0);

        // === 8. Verify Loser Cannot Claim ===
        vm.prank(p3_loser);
        vm.expectRevert("Not a winner");
        market.claimReward(1);
        // Loser's balance is unchanged
        assertEq(usdc.balanceOf(p3_loser), INITIAL_FUNDING - p3_Stake);
    }
}
