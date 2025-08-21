// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockWKAIA
 * @dev Mock Wrapped KAIA token for Kairos testnet testing
 * @author Shinrai Protocol
 */
contract MockWKAIA is ERC20, Ownable {
    
    constructor() ERC20("Mock Wrapped KAIA", "mWKAIA") {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**decimals()); // 1M tokens
    }
    
    /**
     * @dev Mint tokens (for testing purposes)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from specific address
     */
    function burnFrom(address account, uint256 amount) external {
        uint256 currentAllowance = allowance(account, msg.sender);
        require(currentAllowance >= amount, "MockWKAIA: burn amount exceeds allowance");
        unchecked {
            _approve(account, msg.sender, currentAllowance - amount);
        }
        _burn(account, amount);
    }
}

