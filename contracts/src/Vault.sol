// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Vault
 * @dev This is the ERC4626 Vault contract.
 * It is a standard implementation that wraps the StakingToken.
 * A new instance of this vault will be deployed by the PredictionMarket
 * for each new market.
 */
contract Vault is ERC4626 {
    /**
     * @param _asset The ERC20 token (StakingToken - USDC) this vault will hold.
     */
    constructor(
        IERC20 _asset
    ) ERC4626(_asset) ERC20("Vault Shares", "shares") {}
}
