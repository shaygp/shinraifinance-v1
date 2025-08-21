// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IKaiaRates.sol";

/**
 * @title KaiaRates
 * @dev Interest rate management for Shinrai Protocol on Kaia blockchain
 * @author Shinrai Protocol
 */
contract KaiaRates is IKaiaRates, Ownable, Pausable {
    
    struct RateData {
        uint256 baseRate;         // Base interest rate (basis points)
        uint256 multiplier;       // Rate multiplier (basis points)
        uint256 jumpMultiplier;   // Jump multiplier for high utilization
        uint256 kink;             // Utilization rate at which jump multiplier applies
        uint256 lastUpdateTime;   // Last update timestamp
        bool active;              // Whether this rate is active
    }
    
    // Rate data for each collateral type
    mapping(bytes32 => RateData) public rates;
    
    // Global parameters
    uint256 public globalBaseRate = 100;      // 1% default
    uint256 public globalMultiplier = 200;    // 2% default
    uint256 public globalJumpMultiplier = 1000; // 10% default
    uint256 public globalKink = 8000;         // 80% default
    
    // Utilization thresholds
    uint256 public constant MIN_UTILIZATION = 0;
    uint256 public constant MAX_UTILIZATION = 10000; // 100%
    
    // Events
    event RateUpdated(bytes32 indexed collateralId, uint256 baseRate, uint256 multiplier, uint256 jumpMultiplier, uint256 kink);
    event GlobalRatesUpdated(uint256 baseRate, uint256 multiplier, uint256 jumpMultiplier, uint256 kink);
    event RateActivated(bytes32 indexed collateralId, bool active);
    
    // Modifiers
    modifier onlyValidCollateral(bytes32 collateralId) {
        require(collateralId != bytes32(0), "KaiaRates: Invalid collateral ID");
        _;
    }
    
    modifier onlyValidRate(uint256 rate) {
        require(rate <= 5000, "KaiaRates: Rate too high"); // Max 50%
        _;
    }
    
    modifier onlyValidKink(uint256 kink) {
        require(kink > 0 && kink < MAX_UTILIZATION, "KaiaRates: Invalid kink");
        _;
    }
    
    constructor() {
        // Set default global rates
        globalBaseRate = 100;      // 1%
        globalMultiplier = 200;    // 2%
        globalJumpMultiplier = 1000; // 10%
        globalKink = 8000;         // 80%
    }
    
    /**
     * @dev Set rates for a specific collateral type
     */
    function setRates(
        bytes32 collateralId,
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink
    ) external onlyOwner onlyValidCollateral(collateralId) onlyValidRate(baseRate) onlyValidRate(multiplier) onlyValidRate(jumpMultiplier) onlyValidKink(kink) {
        
        rates[collateralId] = RateData({
            baseRate: baseRate,
            multiplier: multiplier,
            jumpMultiplier: jumpMultiplier,
            kink: kink,
            lastUpdateTime: block.timestamp,
            active: true
        });
        
        emit RateUpdated(collateralId, baseRate, multiplier, jumpMultiplier, kink);
    }
    
    /**
     * @dev Update global rates
     */
    function updateGlobalRates(
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink
    ) external onlyOwner onlyValidRate(baseRate) onlyValidRate(multiplier) onlyValidRate(jumpMultiplier) onlyValidKink(kink) {
        
        globalBaseRate = baseRate;
        globalMultiplier = multiplier;
        globalJumpMultiplier = jumpMultiplier;
        globalKink = kink;
        
        emit GlobalRatesUpdated(baseRate, multiplier, jumpMultiplier, kink);
    }
    
    /**
     * @dev Activate/deactivate rates for a collateral type
     */
    function setRateActive(bytes32 collateralId, bool active) external onlyOwner onlyValidCollateral(collateralId) {
        require(rates[collateralId].lastUpdateTime > 0, "KaiaRates: Rate not set");
        
        rates[collateralId].active = active;
        emit RateActivated(collateralId, active);
    }
    
    /**
     * @dev Calculate interest rate based on utilization
     */
    function calculateRate(bytes32 collateralId, uint256 utilization) external view override returns (uint256) {
        RateData memory rateData = rates[collateralId];
        
        // If no specific rate is set, use global rates
        if (rateData.lastUpdateTime == 0 || !rateData.active) {
            return calculateGlobalRate(utilization);
        }
        
        return calculateSpecificRate(rateData, utilization);
    }
    
    /**
     * @dev Calculate interest rate for a specific collateral type
     */
    function calculateSpecificRate(RateData memory rateData, uint256 utilization) internal pure returns (uint256) {
        require(utilization <= MAX_UTILIZATION, "KaiaRates: Utilization exceeds maximum");
        
        uint256 rate;
        
        if (utilization <= rateData.kink) {
            // Linear rate up to kink
            rate = rateData.baseRate + (utilization * rateData.multiplier / MAX_UTILIZATION);
        } else {
            // Jump rate after kink
            uint256 normalRate = rateData.baseRate + (rateData.kink * rateData.multiplier / MAX_UTILIZATION);
            uint256 excessUtilization = utilization - rateData.kink;
            uint256 jumpRate = (excessUtilization * rateData.jumpMultiplier / (MAX_UTILIZATION - rateData.kink));
            rate = normalRate + jumpRate;
        }
        
        return rate;
    }
    
    /**
     * @dev Calculate interest rate using global parameters
     */
    function calculateGlobalRate(uint256 utilization) internal view returns (uint256) {
        require(utilization <= MAX_UTILIZATION, "KaiaRates: Utilization exceeds maximum");
        
        uint256 rate;
        
        if (utilization <= globalKink) {
            // Linear rate up to kink
            rate = globalBaseRate + (utilization * globalMultiplier / MAX_UTILIZATION);
        } else {
            // Jump rate after kink
            uint256 normalRate = globalBaseRate + (globalKink * globalMultiplier / MAX_UTILIZATION);
            uint256 excessUtilization = utilization - globalKink;
            uint256 jumpRate = (excessUtilization * globalJumpMultiplier / (MAX_UTILIZATION - globalKink));
            rate = normalRate + jumpRate;
        }
        
        return rate;
    }
    
    /**
     * @dev Get rate data for a collateral type
     */
    function getRateData(bytes32 collateralId) external view returns (
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink,
        uint256 lastUpdateTime,
        bool active
    ) {
        RateData memory rateData = rates[collateralId];
        return (
            rateData.baseRate,
            rateData.multiplier,
            rateData.jumpMultiplier,
            rateData.kink,
            rateData.lastUpdateTime,
            rateData.active
        );
    }
    
    /**
     * @dev Get global rate parameters
     */
    function getGlobalRates() external view returns (
        uint256 baseRate,
        uint256 multiplier,
        uint256 jumpMultiplier,
        uint256 kink
    ) {
        return (globalBaseRate, globalMultiplier, globalJumpMultiplier, globalKink);
    }
    
    /**
     * @dev Check if rates are set for a collateral type
     */
    function hasRates(bytes32 collateralId) external view returns (bool) {
        return rates[collateralId].lastUpdateTime > 0 && rates[collateralId].active;
    }
    
    /**
     * @dev Calculate utilization rate
     */
    function calculateUtilization(uint256 totalBorrowed, uint256 totalSupply) external pure returns (uint256) {
        if (totalSupply == 0) return 0;
        return (totalBorrowed * MAX_UTILIZATION) / totalSupply;
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
