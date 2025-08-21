// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKaiaJoin.sol";
import "./interfaces/IKaiaVault.sol";

/**
 * @title KaiaJoin
 * @dev Join adapter for Shinrai Protocol on Kaia blockchain
 * @author Shinrai Protocol
 */
contract KaiaJoin is IKaiaJoin, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Core contracts
    IKaiaVault public vault;
    
    // Join parameters
    mapping(bytes32 => JoinInfo) public joins;
    mapping(bytes32 => bool) public activeJoins;
    
    // Events are defined in the interface
    
    constructor(address _vault) {
        vault = IKaiaVault(_vault);
        _initializeDefaultJoins();
    }
    
    /**
     * @dev Initialize default joins for Kaia network
     */
    function _initializeDefaultJoins() internal {
        // KAIA join
        bytes32 kaiaJoinId = keccak256("KAIA");
        joins[kaiaJoinId] = JoinInfo({
            token: 0xb9563C346537427aa41876aa4720902268dCdB40, // KAIA on Kairos
            minAmount: 100e18,  // 100 KAIA minimum
            maxAmount: 1000000e18, // 1M KAIA maximum
            active: true
        });
        activeJoins[kaiaJoinId] = true;
        
        // WKAIA join
        bytes32 wkaiaJoinId = keccak256("WKAIA");
        joins[wkaiaJoinId] = JoinInfo({
            token: 0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773, // WKAIA on Kairos
            minAmount: 100e18,  // 100 WKAIA minimum
            maxAmount: 500000e18, // 500K WKAIA maximum
            active: true
        });
        activeJoins[wkaiaJoinId] = true;
        
        emit JoinCreated(kaiaJoinId, joins[kaiaJoinId].token, joins[kaiaJoinId].minAmount, joins[kaiaJoinId].maxAmount);
        emit JoinCreated(wkaiaJoinId, joins[wkaiaJoinId].token, joins[wkaiaJoinId].minAmount, joins[wkaiaJoinId].maxAmount);
    }
    
    /**
     * @dev Join collateral to vault
     */
    function join(bytes32 joinId, uint256 amount) external nonReentrant whenNotPaused {
        require(activeJoins[joinId], "KaiaJoin: Join not active");
        require(joins[joinId].active, "KaiaJoin: Join not active");
        require(amount >= joins[joinId].minAmount, "KaiaJoin: Amount too small");
        require(amount <= joins[joinId].maxAmount, "KaiaJoin: Amount too large");
        
        // Transfer tokens from user to this contract
        IERC20 token = IERC20(joins[joinId].token);
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        // Transfer tokens to vault
        token.safeTransfer(address(vault), amount);
        
        // Deposit collateral to vault
        vault.depositCollateral(joinId, amount);
        
        emit CollateralJoined(joinId, msg.sender, amount);
    }
    
    /**
     * @dev Exit collateral from vault
     */
    function exit(bytes32 joinId, uint256 amount) external nonReentrant whenNotPaused {
        require(activeJoins[joinId], "KaiaJoin: Join not active");
        require(joins[joinId].active, "KaiaJoin: Join not active");
        require(amount > 0, "KaiaJoin: Invalid amount");
        
        // Withdraw collateral from vault
        vault.withdrawCollateral(joinId, amount);
        
        // Transfer tokens back to user
        IERC20 token = IERC20(joins[joinId].token);
        token.safeTransfer(msg.sender, amount);
        
        emit CollateralExited(joinId, msg.sender, amount);
    }
    
    /**
     * @dev Create new join
     */
    function createJoin(
        bytes32 joinId,
        address token,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyOwner {
        require(token != address(0), "KaiaJoin: Invalid token");
        require(minAmount > 0, "KaiaJoin: Invalid min amount");
        require(maxAmount > minAmount, "KaiaJoin: Invalid max amount");
        
        joins[joinId] = JoinInfo({
            token: token,
            minAmount: minAmount,
            maxAmount: maxAmount,
            active: true
        });
        
        activeJoins[joinId] = true;
        
        emit JoinCreated(joinId, token, minAmount, maxAmount);
    }
    
    /**
     * @dev Activate/deactivate join
     */
    function setJoinActive(bytes32 joinId, bool active) external onlyOwner {
        require(activeJoins[joinId], "KaiaJoin: Join not found");
        
        joins[joinId].active = active;
        
        emit JoinActivated(joinId, active);
    }
    
    /**
     * @dev Update join parameters
     */
    function updateJoin(
        bytes32 joinId,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyOwner {
        require(activeJoins[joinId], "KaiaJoin: Join not found");
        require(minAmount > 0, "KaiaJoin: Invalid min amount");
        require(maxAmount > minAmount, "KaiaJoin: Invalid max amount");
        
        joins[joinId].minAmount = minAmount;
        joins[joinId].maxAmount = maxAmount;
    }
    
    /**
     * @dev Get join information
     */
    function getJoin(bytes32 joinId) external view returns (
        address token,
        uint256 minAmount,
        uint256 maxAmount,
        bool active
    ) {
        JoinInfo memory joinInfo = joins[joinId];
        return (joinInfo.token, joinInfo.minAmount, joinInfo.maxAmount, joinInfo.active);
    }
    
    /**
     * @dev Check if join is active
     */
    function isJoinActive(bytes32 joinId) external view returns (bool) {
        return activeJoins[joinId] && joins[joinId].active;
    }
    
    /**
     * @dev Get all active joins
     */
    function getActiveJoins() external view returns (bytes32[] memory) {
        uint256 count = 0;
        bytes32[] memory temp = new bytes32[](100); // Max 100 joins
        
        for (uint256 i = 0; i < 100; i++) {
            bytes32 joinId = keccak256(abi.encodePacked("KAIA"));
            if (i == 1) joinId = keccak256(abi.encodePacked("WKAIA"));
            
            if (activeJoins[joinId] && joins[joinId].active) {
                temp[count] = joinId;
                count++;
            }
        }
        
        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }
        
        return result;
    }
    
    // Admin functions
    function setVault(address _vault) external onlyOwner {
        vault = IKaiaVault(_vault);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
