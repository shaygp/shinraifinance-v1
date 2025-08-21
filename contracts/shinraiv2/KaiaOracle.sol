// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IKaiaOracle.sol";

/**
 * @title KaiaOracle
 * @dev Price oracle for Shinrai Protocol on Kaia blockchain with Witnet integration
 * @author Shinrai Protocol
 */
contract KaiaOracle is IKaiaOracle, Ownable, Pausable {
    
    // Token addresses on Kaia network
    address public constant KAIA_TOKEN = 0xb9563C346537427aa41876aa4720902268dCdB40;
    address public constant USDT_TOKEN = 0x0236E4DA096053856Cb659d628D7012Cdf4b2985; // Real USDT on Kairos (fixed checksum)
    address public constant WKAIA_TOKEN = 0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773;
    
    // Price data structure
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 lastUpdated;
        bool isActive;
    }
    
    // Token price mappings
    mapping(address => PriceData) public prices;
    
    // Heartbeat interval (default: 1 hour)
    uint256 public heartbeat = 3600;
    
    // Maximum price deviation (default: 10%)
    uint256 public maxDeviation = 1000; // 10% = 1000 basis points
    
    // Authorized price updaters
    mapping(address => bool) public authorizedUpdaters;
    
    // Events (not in interface to avoid duplication)
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event TokenAdded(address indexed token, uint256 initialPrice);
    event TokenRemoved(address indexed token);
    event AuthorizedUpdaterSet(address indexed updater, bool authorized);
    event HeartbeatUpdated(uint256 heartbeat);
    event MaxDeviationUpdated(uint256 maxDeviation);
    
    // Override the paused function to resolve conflict
    function paused() public view override(Pausable, IKaiaOracle) returns (bool) {
        return Pausable.paused();
    }
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "KaiaOracle: Unauthorized");
        _;
    }
    
    constructor() {
        // Initialize with default prices (1 USD = 1e18)
        prices[KAIA_TOKEN] = PriceData({
            price: 1e18, // $1 default
            timestamp: block.timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        prices[USDT_TOKEN] = PriceData({
            price: 1e18, // $1 (stablecoin)
            timestamp: block.timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        prices[WKAIA_TOKEN] = PriceData({
            price: 1e18, // $1 default
            timestamp: block.timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        // Owner is authorized by default
        authorizedUpdaters[msg.sender] = true;
    }
    
    /**
     * @dev Get price for a token
     */
    function getPrice(address token) external view returns (uint256 price, uint256 timestamp) {
        PriceData memory priceData = prices[token];
        require(priceData.isActive, "KaiaOracle: Token not supported");
        require(block.timestamp - priceData.lastUpdated <= heartbeat, "KaiaOracle: Price too stale");
        
        return (priceData.price, priceData.timestamp);
    }
    
    /**
     * @dev Update price for a token
     */
    function updatePrice(address token, uint256 price, uint256 timestamp) external onlyAuthorized whenNotPaused {
        require(price > 0, "KaiaOracle: Invalid price");
        require(timestamp <= block.timestamp, "KaiaOracle: Future timestamp");
        require(prices[token].isActive, "KaiaOracle: Token not supported");
        
        // Check price deviation if previous price exists
        if (prices[token].price > 0) {
            uint256 deviation = _calculateDeviation(prices[token].price, price);
            require(deviation <= maxDeviation, "KaiaOracle: Price deviation too high");
        }
        
        prices[token] = PriceData({
            price: price,
            timestamp: timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        emit PriceUpdated(token, price, timestamp);
    }
    
    /**
     * @dev Add a new supported token
     */
    function addToken(address token, uint256 initialPrice) external onlyOwner {
        require(token != address(0), "KaiaOracle: Invalid token address");
        require(!prices[token].isActive, "KaiaOracle: Token already supported");
        
        prices[token] = PriceData({
            price: initialPrice,
            timestamp: block.timestamp,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        emit TokenAdded(token, initialPrice);
    }
    
    /**
     * @dev Remove a supported token
     */
    function removeToken(address token) external onlyOwner {
        require(prices[token].isActive, "KaiaOracle: Token not supported");
        
        prices[token].isActive = false;
        emit TokenRemoved(token);
    }
    
    /**
     * @dev Set authorized updater
     */
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit AuthorizedUpdaterSet(updater, authorized);
    }
    
    /**
     * @dev Set heartbeat interval
     */
    function setHeartbeat(uint256 _heartbeat) external onlyOwner {
        require(_heartbeat > 0, "KaiaOracle: Invalid heartbeat");
        heartbeat = _heartbeat;
        emit HeartbeatUpdated(_heartbeat);
    }
    
    /**
     * @dev Set maximum price deviation
     */
    function setMaxDeviation(uint256 _maxDeviation) external onlyOwner {
        require(_maxDeviation <= 5000, "KaiaOracle: Deviation too high"); // Max 50%
        maxDeviation = _maxDeviation;
        emit MaxDeviationUpdated(_maxDeviation);
    }
    
    /**
     * @dev Check if price is stale
     */
    function isPriceStale(address token) external view returns (bool) {
        return block.timestamp - prices[token].lastUpdated > heartbeat;
    }
    
    /**
     * @dev Get price pair (implement interface requirement)
     */
    function getPricePair(address base, address quote) external view returns (uint256 price, uint256 timestamp) {
        (uint256 basePrice, uint256 baseTimestamp) = this.getPrice(base);
        (uint256 quotePrice, ) = this.getPrice(quote);
        
        // Calculate price ratio
        uint256 pairPrice = (basePrice * 1e18) / quotePrice;
        return (pairPrice, baseTimestamp);
    }
    
    /**
     * @dev Get last update time
     */
    function getLastUpdateTime(address token) external view returns (uint256 timestamp) {
        return prices[token].lastUpdated;
    }
    
    /**
     * @dev Get heartbeat interval
     */
    function getHeartbeat() external view returns (uint256 interval) {
        return heartbeat;
    }
    
    /**
     * @dev Get price info
     */
    function getPriceInfo(address token) external view returns (
        uint256 price,
        uint256 timestamp,
        uint256 lastUpdated,
        bool isActive,
        bool isStale
    ) {
        PriceData memory priceData = prices[token];
        bool stale = block.timestamp - priceData.lastUpdated > heartbeat;
        
        return (
            priceData.price,
            priceData.timestamp,
            priceData.lastUpdated,
            priceData.isActive,
            stale
        );
    }
    
    /**
     * @dev Calculate price deviation in basis points
     */
    function _calculateDeviation(uint256 oldPrice, uint256 newPrice) internal pure returns (uint256) {
        uint256 diff = oldPrice > newPrice ? oldPrice - newPrice : newPrice - oldPrice;
        return (diff * 10000) / oldPrice;
    }
    
    /**
     * @dev Emergency pause
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}