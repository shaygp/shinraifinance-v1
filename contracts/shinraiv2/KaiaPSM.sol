// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKaiaPSM.sol";
import "./interfaces/IKaiaOracle.sol";

/**
 * @title KaiaPSM
 * @dev Peg Stability Module for Shinrai Protocol on Kaia blockchain
 * @dev Maintains stablecoin peg through direct swaps with backing assets
 * @author Shinrai Protocol
 */
contract KaiaPSM is IKaiaPSM, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Core tokens
    IERC20 public immutable stablecoin;  // Protocol stablecoin
    IERC20 public immutable usdt;        // Native USDT on Kaia Kairos
    IKaiaOracle public oracle;
    
    // PSM parameters
    uint256 public buyFee = 100;         // 1% fee for buying stablecoin with USDT
    uint256 public sellFee = 100;        // 1% fee for selling stablecoin for USDT
    uint256 public maxSwapAmount = 1000000e18; // Max swap per transaction
    uint256 public dailySwapLimit = 10000000e18; // Daily swap limit
    uint256 public totalSwappedToday;
    uint256 public lastResetTime;
    
    // Reserve management
    uint256 public reserveRatio = 1200;  // 120% reserve ratio in basis points
    uint256 public minimumReserve = 100000e18; // Minimum USDT reserve
    
    // Fee collection
    address public feeCollector;
    uint256 public collectedFees;
    
    // Daily tracking
    mapping(address => uint256) public userDailySwap;
    mapping(address => uint256) public userLastSwapReset;
    uint256 public userDailyLimit = 100000e18; // Per user daily limit
    
    // Events are defined in interface to avoid duplication
    
    // Modifiers
    modifier validAmount(uint256 amount) {
        require(amount > 0, "KaiaPSM: Amount must be greater than 0");
        require(amount <= maxSwapAmount, "KaiaPSM: Amount exceeds max swap");
        _;
    }
    
    modifier withinLimits(uint256 amount) {
        _updateDailyLimits();
        require(totalSwappedToday + amount <= dailySwapLimit, "KaiaPSM: Daily limit exceeded");
        
        // Check user daily limit
        if (userLastSwapReset[msg.sender] < lastResetTime) {
            userDailySwap[msg.sender] = 0;
            userLastSwapReset[msg.sender] = block.timestamp;
        }
        require(userDailySwap[msg.sender] + amount <= userDailyLimit, "KaiaPSM: User daily limit exceeded");
        _;
    }
    
    constructor(
        address _stablecoin,
        address _usdt,
        address _oracle,
        address _feeCollector
    ) {
        stablecoin = IERC20(_stablecoin);
        usdt = IERC20(_usdt);
        oracle = IKaiaOracle(_oracle);
        feeCollector = _feeCollector;
        lastResetTime = block.timestamp;
    }
    
    /**
     * @dev Swap USDT for stablecoin (interface implementation)
     */
    function swapUSDTForStablecoin(uint256 usdtAmount, uint256 minStablecoinOut) external validAmount(usdtAmount) withinLimits(usdtAmount) nonReentrant whenNotPaused {
        // Get prices (fixed to handle tuple return)
        (uint256 usdtPrice, ) = oracle.getPrice(address(usdt));
        (uint256 stablecoinPrice, ) = oracle.getPrice(address(stablecoin));
        
        // Calculate stablecoin amount (1:1 ratio assumed for now)
        uint256 stablecoinAmount = usdtAmount;
        
        // Calculate fee
        uint256 fee = (stablecoinAmount * buyFee) / 10000;
        uint256 finalAmount = stablecoinAmount - fee;
        
        // Transfer USDT from user
        usdt.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // Transfer stablecoin to user
        stablecoin.safeTransfer(msg.sender, finalAmount);
        
        // Update tracking
        totalSwappedToday += usdtAmount;
        userDailySwap[msg.sender] += usdtAmount;
        collectedFees += fee;
        
        emit SwapUSDTForStablecoin(msg.sender, usdtAmount, finalAmount, fee);
    }
    
    /**
     * @dev Swap stablecoin for USDT (interface implementation)
     */
    function swapStablecoinForUSDT(
        uint256 stablecoinAmount,
        uint256 minUsdtOut
    ) external validAmount(stablecoinAmount) withinLimits(stablecoinAmount) nonReentrant whenNotPaused {
        // Get prices (fixed to handle tuple return)
        (uint256 usdtPrice, ) = oracle.getPrice(address(usdt));
        (uint256 stablecoinPrice, ) = oracle.getPrice(address(stablecoin));
        
        // Calculate USDT amount (1:1 ratio assumed for now)
        uint256 usdtAmount = stablecoinAmount;
        
        // Calculate fee
        uint256 fee = (usdtAmount * sellFee) / 10000;
        uint256 finalAmount = usdtAmount - fee;
        
        // Check reserve sufficiency
        require(usdt.balanceOf(address(this)) >= finalAmount, "KaiaPSM: Insufficient USDT reserves");
        
        // Transfer stablecoin from user
        stablecoin.safeTransferFrom(msg.sender, address(this), stablecoinAmount);
        
        // Transfer USDT to user
        usdt.safeTransfer(msg.sender, finalAmount);
        
        // Update tracking
        totalSwappedToday += stablecoinAmount;
        userDailySwap[msg.sender] += stablecoinAmount;
        collectedFees += fee;
        
        emit SwapStablecoinForUSDT(msg.sender, stablecoinAmount, finalAmount, fee);
    }
    
    /**
     * @dev Get swap quote for USDT to stablecoin
     */
    function getSwapQuote(uint256 usdtAmount, bool isBuy) external view returns (uint256 outputAmount, uint256 fee) {
        if (isBuy) {
            // Buying stablecoin with USDT
            (uint256 usdtPrice, ) = oracle.getPrice(address(usdt));
            (uint256 stablecoinPrice, ) = oracle.getPrice(address(stablecoin));
            
            uint256 stablecoinAmount = usdtAmount; // 1:1 for now
            fee = (stablecoinAmount * buyFee) / 10000;
            outputAmount = stablecoinAmount - fee;
        } else {
            // Selling stablecoin for USDT
            (uint256 usdtPrice, ) = oracle.getPrice(address(usdt));
            (uint256 stablecoinPrice, ) = oracle.getPrice(address(stablecoin));
            
            uint256 usdtAmountOut = usdtAmount; // 1:1 for now
            fee = (usdtAmountOut * sellFee) / 10000;
            outputAmount = usdtAmountOut - fee;
        }
    }
    
    /**
     * @dev Get USDT to stablecoin output
     */
    function getUSDTToStablecoinOutput(uint256 usdtAmount) external view returns (uint256 stablecoinOut, uint256 fee) {
        // Buying stablecoin with USDT
        (uint256 usdtPrice, ) = oracle.getPrice(address(usdt));
        (uint256 stablecoinPrice, ) = oracle.getPrice(address(stablecoin));
        
        uint256 stablecoinAmount = usdtAmount; // 1:1 for now
        fee = (stablecoinAmount * buyFee) / 10000;
        stablecoinOut = stablecoinAmount - fee;
    }
    
    /**
     * @dev Get stablecoin to USDT output
     */
    function getStablecoinToUSDTOutput(uint256 stablecoinAmount) external view returns (uint256 usdtOut, uint256 fee) {
        // Selling stablecoin for USDT
        (uint256 usdtPrice, ) = oracle.getPrice(address(usdt));
        (uint256 stablecoinPrice, ) = oracle.getPrice(address(stablecoin));
        
        uint256 usdtAmountOut = stablecoinAmount; // 1:1 for now
        fee = (usdtAmountOut * sellFee) / 10000;
        usdtOut = usdtAmountOut - fee;
    }
    
    /**
     * @dev Get reserve status
     */
    function getReserveStatus() external view returns (
        uint256 usdtReserve,
        uint256 stablecoinReserve,
        uint256 currentReserveRatio,
        bool isHealthy
    ) {
        usdtReserve = usdt.balanceOf(address(this));
        stablecoinReserve = stablecoin.totalSupply();
        
        if (stablecoinReserve > 0) {
            currentReserveRatio = (usdtReserve * 10000) / stablecoinReserve;
        } else {
            currentReserveRatio = 10000; // 100% if no stablecoin
        }
        
        isHealthy = usdtReserve >= minimumReserve && currentReserveRatio >= reserveRatio;
    }
    
    /**
     * @dev Set fees (interface implementation)
     */
    function setFees(uint256 _buyFee, uint256 _sellFee) external onlyOwner {
        require(_buyFee <= 1000 && _sellFee <= 1000, "KaiaPSM: Fee too high"); // Max 10%
        buyFee = _buyFee;
        sellFee = _sellFee;
        emit FeesUpdated(_buyFee, _sellFee);
    }
    
    /**
     * @dev Set limits (interface implementation)
     */
    function setLimits(uint256 _maxSwapAmount, uint256 _dailySwapLimit, uint256 _userDailyLimit) external onlyOwner {
        maxSwapAmount = _maxSwapAmount;
        dailySwapLimit = _dailySwapLimit;
        userDailyLimit = _userDailyLimit;
        emit LimitsUpdated(_maxSwapAmount, _dailySwapLimit, _userDailyLimit);
    }
    
    /**
     * @dev Set reserve parameters (interface implementation)
     */
    function setReserveParameters(uint256 _reserveRatio, uint256 _minimumReserve) external onlyOwner {
        reserveRatio = _reserveRatio;
        minimumReserve = _minimumReserve;
        emit ReserveParametersUpdated(_reserveRatio, _minimumReserve);
    }
    
    /**
     * @dev Update fees
     */
    function updateFees(uint256 _buyFee, uint256 _sellFee) external onlyOwner {
        require(_buyFee <= 1000 && _sellFee <= 1000, "KaiaPSM: Fee too high"); // Max 10%
        buyFee = _buyFee;
        sellFee = _sellFee;
        emit FeesUpdated(_buyFee, _sellFee);
    }
    
    /**
     * @dev Update swap limits
     */
    function updateLimits(
        uint256 _maxSwapAmount,
        uint256 _dailySwapLimit,
        uint256 _userDailyLimit
    ) external onlyOwner {
        maxSwapAmount = _maxSwapAmount;
        dailySwapLimit = _dailySwapLimit;
        userDailyLimit = _userDailyLimit;
        emit LimitsUpdated(_maxSwapAmount, _dailySwapLimit, _userDailyLimit);
    }
    
    /**
     * @dev Update reserve parameters
     */
    function updateReserveParameters(
        uint256 _reserveRatio,
        uint256 _minimumReserve
    ) external onlyOwner {
        reserveRatio = _reserveRatio;
        minimumReserve = _minimumReserve;
        emit ReserveParametersUpdated(_reserveRatio, _minimumReserve);
    }
    
    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external {
        require(msg.sender == feeCollector || msg.sender == owner(), "KaiaPSM: Unauthorized");
        uint256 amount = collectedFees;
        collectedFees = 0;
        
        // Transfer fees in stablecoin
        stablecoin.safeTransfer(feeCollector, amount);
        emit FeesWithdrawn(feeCollector, amount);
    }
    
    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }
    
    /**
     * @dev Update daily limits (internal)
     */
    function _updateDailyLimits() internal {
        if (block.timestamp >= lastResetTime + 1 days) {
            totalSwappedToday = 0;
            lastResetTime = block.timestamp;
        }
    }
    
    /**
     * @dev Set oracle
     */
    function setOracle(address _oracle) external onlyOwner {
        oracle = IKaiaOracle(_oracle);
    }
    
    /**
     * @dev Set fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get reserve info
     */
    function getReserveInfo() external view returns (
        uint256 usdtReserve,
        uint256 stablecoinSupply,
        uint256 currentRatio,
        bool isHealthy
    ) {
        usdtReserve = usdt.balanceOf(address(this));
        stablecoinSupply = stablecoin.totalSupply();
        
        if (stablecoinSupply > 0) {
            currentRatio = (usdtReserve * 10000) / stablecoinSupply;
        } else {
            currentRatio = 10000; // 100% if no stablecoin
        }
        
        isHealthy = usdtReserve >= minimumReserve && currentRatio >= reserveRatio;
    }
}