// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Local stand-in for tUSD8 (6 decimals). Not deployed to Aevum.
contract TestToken is ERC20 {
    constructor() ERC20("Test tUSD8", "tUSD8") { }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
