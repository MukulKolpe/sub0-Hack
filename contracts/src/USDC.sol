// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Mock USDC Token
 * @dev This is a mock ERC20 token (like DAI, USDC, or WETH) that users
 * will stake in the prediction market.
 */
contract USDC is ERC20 {
    constructor() ERC20("USDC", "USDC") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }
}
