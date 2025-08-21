// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPToken is ERC20, Ownable {
    address public dexContract;
    
    constructor(
        string memory name,
        string memory symbol,
        address _dexContract
    ) ERC20(name, symbol) {
        dexContract = _dexContract;
    }
    
    modifier onlyDEX() {
        require(msg.sender == dexContract, "Only DEX can mint/burn");
        _;
    }
    
    function mint(address to, uint256 amount) external onlyDEX {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyDEX {
        _burn(from, amount);
    }
    
    function updateDEXContract(address _newDex) external onlyOwner {
        dexContract = _newDex;
    }
}