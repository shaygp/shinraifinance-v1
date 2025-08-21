// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKaiaFlashLoan.sol";
import "./interfaces/IKaiaFlashLoanReceiver.sol";

/**
 * @title KaiaFlashLoan
 * @dev Flash loan provider for Shinrai Protocol on Kaia blockchain
 * @dev Implements EIP-3156 Flash Loan standard
 * @author Shinrai Protocol
 */
contract KaiaFlashLoan is IKaiaFlashLoan, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Flash loan parameters
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public flashLoanFees; // Fee in basis points (e.g., 9 = 0.09%)
    mapping(address => uint256) public maxFlashLoanAmount;
    mapping(address => uint256) public totalFlashLoaned;
    
    // Global limits
    uint256 public globalMaxFlashLoan = 1000000e18; // Global max per transaction
    uint256 public defaultFee = 9; // 0.09% default fee
    uint256 public maxFee = 1000; // Max 10% fee
    
    // Security
    mapping(address => bool) public authorizedCallers;
    mapping(address => uint256) public userDailyLimit;
    mapping(address => mapping(uint256 => uint256)) public userDailyUsage; // user -> day -> amount
    uint256 public defaultUserDailyLimit = 100000e18;
    
    // Fee collection
    address public feeCollector;
    mapping(address => uint256) public collectedFees;
    
    // Flash loan tracking
    mapping(bytes32 => bool) private _flashLoanInProgress;
    uint256 private _currentFlashLoanId;
    
    // Constants
    bytes32 public constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");
    
    // Events are defined in the interface
    
    // Modifiers
    modifier onlyAuthorizedCaller() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "KaiaFlashLoan: Not authorized");
        _;
    }
    
    modifier validToken(address token) {
        require(supportedTokens[token], "KaiaFlashLoan: Token not supported");
        _;
    }
    
    modifier validAmount(address token, uint256 amount) {
        require(amount > 0, "KaiaFlashLoan: Amount must be greater than 0");
        require(amount <= maxFlashLoanAmount[token], "KaiaFlashLoan: Amount exceeds token limit");
        require(amount <= globalMaxFlashLoan, "KaiaFlashLoan: Amount exceeds global limit");
        _;
    }
    
    constructor(address _feeCollector) {
        require(_feeCollector != address(0), "KaiaFlashLoan: Invalid fee collector");
        feeCollector = _feeCollector;
        authorizedCallers[msg.sender] = true;
    }
    
    /**
     * @dev Execute a flash loan following EIP-3156
     * @param receiver Contract that will receive the flash loan
     * @param token Token to flash loan
     * @param amount Amount to flash loan
     * @param data Arbitrary data to pass to receiver
     */
    function flashLoan(
        IKaiaFlashLoanReceiver receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external nonReentrant whenNotPaused validToken(token) validAmount(token, amount) returns (bool) {
        
        // Check daily limits
        _checkDailyLimit(msg.sender, amount);
        
        // Calculate fee
        uint256 fee = _calculateFee(token, amount);
        
        // Check available liquidity
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        require(balanceBefore >= amount, "KaiaFlashLoan: Insufficient liquidity");
        
        // Generate unique flash loan ID
        bytes32 flashLoanId = keccak256(abi.encodePacked(
            msg.sender,
            address(receiver),
            token,
            amount,
            block.timestamp,
            _currentFlashLoanId++
        ));
        
        // Mark flash loan as in progress
        _flashLoanInProgress[flashLoanId] = true;
        
        // Transfer tokens to receiver
        IERC20(token).safeTransfer(address(receiver), amount);
        
        // Call receiver's callback
        bytes32 result = receiver.onFlashLoan(msg.sender, token, amount, fee, data);
        require(result == CALLBACK_SUCCESS, "KaiaFlashLoan: Callback failed");
        
        // Check repayment
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        require(balanceAfter >= balanceBefore + fee, "KaiaFlashLoan: Repayment failed");
        
        // Update tracking
        totalFlashLoaned[token] += amount;
        collectedFees[token] += fee;
        _updateUserDailyUsage(msg.sender, amount);
        
        // Mark flash loan as complete
        _flashLoanInProgress[flashLoanId] = false;
        
        emit FlashLoan(address(receiver), token, amount, fee);
        
        return true;
    }
    
    /**
     * @dev Get the maximum flash loan amount for a token
     */
    function maxFlashLoan(address token) external view returns (uint256) {
        if (!supportedTokens[token]) {
            return 0;
        }
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        uint256 tokenLimit = maxFlashLoanAmount[token];
        uint256 globalLimit = globalMaxFlashLoan;
        
        return _min(_min(balance, tokenLimit), globalLimit);
    }
    
    /**
     * @dev Get the flash loan fee for a token and amount
     */
    function flashFee(address token, uint256 amount) external view returns (uint256) {
        require(supportedTokens[token], "KaiaFlashLoan: Token not supported");
        return _calculateFee(token, amount);
    }
    
    /**
     * @dev Check if user can take a flash loan of given amount
     */
    function canFlashLoan(address user, address token, uint256 amount) external view returns (bool) {
        if (!supportedTokens[token] || amount == 0) {
            return false;
        }
        
        // Check limits
        if (amount > maxFlashLoanAmount[token] || amount > globalMaxFlashLoan) {
            return false;
        }
        
        // Check liquidity
        if (IERC20(token).balanceOf(address(this)) < amount) {
            return false;
        }
        
        // Check daily limit
        uint256 limit = userDailyLimit[user] > 0 ? userDailyLimit[user] : defaultUserDailyLimit;
        uint256 today = block.timestamp / 1 days;
        uint256 usedToday = userDailyUsage[user][today];
        
        return usedToday + amount <= limit;
    }
    
    /**
     * @dev Get user's remaining daily flash loan limit
     */
    function getRemainingDailyLimit(address user) external view returns (uint256) {
        uint256 limit = userDailyLimit[user] > 0 ? userDailyLimit[user] : defaultUserDailyLimit;
        uint256 today = block.timestamp / 1 days;
        uint256 usedToday = userDailyUsage[user][today];
        
        return usedToday >= limit ? 0 : limit - usedToday;
    }
    
    // Admin functions
    function addToken(
        address token,
        uint256 maxAmount,
        uint256 fee
    ) external onlyOwner {
        require(token != address(0), "KaiaFlashLoan: Invalid token");
        require(fee <= maxFee, "KaiaFlashLoan: Fee too high");
        
        supportedTokens[token] = true;
        maxFlashLoanAmount[token] = maxAmount;
        flashLoanFees[token] = fee;
        
        emit TokenAdded(token, maxAmount, fee);
    }
    
    function removeToken(address token) external onlyOwner {
        require(supportedTokens[token], "KaiaFlashLoan: Token not supported");
        
        supportedTokens[token] = false;
        maxFlashLoanAmount[token] = 0;
        flashLoanFees[token] = 0;
        
        emit TokenRemoved(token);
    }
    
    function updateTokenConfig(
        address token,
        uint256 maxAmount,
        uint256 fee
    ) external onlyOwner validToken(token) {
        require(fee <= maxFee, "KaiaFlashLoan: Fee too high");
        
        maxFlashLoanAmount[token] = maxAmount;
        flashLoanFees[token] = fee;
        
        emit TokenConfigUpdated(token, maxAmount, fee);
    }
    
    function setGlobalMaxFlashLoan(uint256 amount) external onlyOwner {
        globalMaxFlashLoan = amount;
    }
    
    function setDefaultFee(uint256 fee) external onlyOwner {
        require(fee <= maxFee, "KaiaFlashLoan: Fee too high");
        defaultFee = fee;
    }
    
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerUpdated(caller, authorized);
    }
    
    function setUserDailyLimit(address user, uint256 limit) external onlyOwner {
        userDailyLimit[user] = limit;
        emit UserDailyLimitUpdated(user, limit);
    }
    
    function setDefaultUserDailyLimit(uint256 limit) external onlyOwner {
        defaultUserDailyLimit = limit;
    }
    
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "KaiaFlashLoan: Invalid fee collector");
        feeCollector = _feeCollector;
    }
    
    function withdrawFees(address token) external {
        require(msg.sender == feeCollector || msg.sender == owner(), "KaiaFlashLoan: Not authorized");
        require(collectedFees[token] > 0, "KaiaFlashLoan: No fees to withdraw");
        
        uint256 amount = collectedFees[token];
        collectedFees[token] = 0;
        
        IERC20(token).safeTransfer(feeCollector, amount);
        emit FeesWithdrawn(token, amount);
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Internal functions
    function _calculateFee(address token, uint256 amount) internal view returns (uint256) {
        uint256 feeRate = flashLoanFees[token] > 0 ? flashLoanFees[token] : defaultFee;
        return (amount * feeRate) / 10000;
    }
    
    function _checkDailyLimit(address user, uint256 amount) internal view {
        uint256 limit = userDailyLimit[user] > 0 ? userDailyLimit[user] : defaultUserDailyLimit;
        uint256 today = block.timestamp / 1 days;
        uint256 usedToday = userDailyUsage[user][today];
        
        require(usedToday + amount <= limit, "KaiaFlashLoan: Daily limit exceeded");
    }
    
    function _updateUserDailyUsage(address user, uint256 amount) internal {
        uint256 today = block.timestamp / 1 days;
        userDailyUsage[user][today] += amount;
    }
    
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}