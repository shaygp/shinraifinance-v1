// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IKaiaFlashLoanReceiver.sol";

/**
 * @title IKaiaFlashLoan
 * @dev Interface for Kaia Flash Loan provider following EIP-3156
 * @author Shinrai Protocol
 */
interface IKaiaFlashLoan {
    
    // Events
    event FlashLoan(address indexed receiver, address indexed token, uint256 amount, uint256 fee);
    event TokenAdded(address indexed token, uint256 maxAmount, uint256 fee);
    event TokenRemoved(address indexed token);
    event TokenConfigUpdated(address indexed token, uint256 maxAmount, uint256 fee);
    event FeesWithdrawn(address indexed token, uint256 amount);
    event AuthorizedCallerUpdated(address indexed caller, bool authorized);
    event UserDailyLimitUpdated(address indexed user, uint256 limit);
    
    // Core flash loan function (EIP-3156)
    function flashLoan(
        IKaiaFlashLoanReceiver receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool);
    
    // EIP-3156 required functions
    function maxFlashLoan(address token) external view returns (uint256);
    function flashFee(address token, uint256 amount) external view returns (uint256);
    
    // Additional view functions
    function canFlashLoan(address user, address token, uint256 amount) external view returns (bool);
    function getRemainingDailyLimit(address user) external view returns (uint256);
    
    // Token management
    function addToken(address token, uint256 maxAmount, uint256 fee) external;
    function removeToken(address token) external;
    function updateTokenConfig(address token, uint256 maxAmount, uint256 fee) external;
    
    // Configuration
    function setGlobalMaxFlashLoan(uint256 amount) external;
    function setDefaultFee(uint256 fee) external;
    function setAuthorizedCaller(address caller, bool authorized) external;
    function setUserDailyLimit(address user, uint256 limit) external;
    function setDefaultUserDailyLimit(uint256 limit) external;
    function setFeeCollector(address _feeCollector) external;
    
    // Admin functions
    function withdrawFees(address token) external;
    function emergencyWithdraw(address token, uint256 amount) external;
    function pause() external;
    function unpause() external;
}