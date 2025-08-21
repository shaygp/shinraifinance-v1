// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IKaiaPSM
 * @dev Interface for Kaia Peg Stability Module
 * @author Shinrai Protocol
 */
interface IKaiaPSM {
    
    // Structs
    struct SwapInfo {
        uint256 inputAmount;
        uint256 outputAmount;
        uint256 fee;
        uint256 priceImpact;
    }
    
    struct ReserveStatus {
        uint256 usdtReserve;
        uint256 stablecoinReserve;
        uint256 currentReserveRatio;
        bool isHealthy;
    }
    
    // Events
    event SwapStablecoinForUSDT(address indexed user, uint256 stablecoinIn, uint256 usdtOut, uint256 fee);
    event SwapUSDTForStablecoin(address indexed user, uint256 usdtIn, uint256 stablecoinOut, uint256 fee);
    event FeesUpdated(uint256 buyFee, uint256 sellFee);
    event LimitsUpdated(uint256 maxSwapAmount, uint256 dailySwapLimit, uint256 userDailyLimit);
    event ReserveParametersUpdated(uint256 reserveRatio, uint256 minimumReserve);
    event FeesWithdrawn(address indexed collector, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    // Core swap functions
    function swapStablecoinForUSDT(uint256 stablecoinAmount, uint256 minUsdtOut) external;
    function swapUSDTForStablecoin(uint256 usdtAmount, uint256 minStablecoinOut) external;
    
    // View functions
    function getStablecoinToUSDTOutput(uint256 stablecoinAmount) external view returns (uint256 usdtOut, uint256 fee);
    function getUSDTToStablecoinOutput(uint256 usdtAmount) external view returns (uint256 stablecoinOut, uint256 fee);
    function getReserveStatus() external view returns (uint256 usdtReserve, uint256 stablecoinReserve, uint256 currentReserveRatio, bool isHealthy);
    
    // Configuration
    function setFees(uint256 _buyFee, uint256 _sellFee) external;
    function setLimits(uint256 _maxSwapAmount, uint256 _dailySwapLimit, uint256 _userDailyLimit) external;
    function setReserveParameters(uint256 _reserveRatio, uint256 _minimumReserve) external;
    function setOracle(address _oracle) external;
    function setFeeCollector(address _feeCollector) external;
    
    // Admin functions
    function withdrawFees() external;
    function emergencyWithdraw(address token, uint256 amount) external;
    function pause() external;
    function unpause() external;
}