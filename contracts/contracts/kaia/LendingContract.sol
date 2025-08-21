// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LendingContract is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    struct UserBorrow {
        uint256 collateralAmount;    // Amount of collateral deposited
        uint256 borrowAmount;        // Amount borrowed
        address collateralToken;     // Address of collateral token
        address borrowToken;         // Address of borrowed token
        uint256 borrowTime;          // When the borrow was created
        bool active;                 // Whether the borrow is active
    }

    struct TokenConfig {
        bool isCollateral;          // Can be used as collateral
        bool isBorrowable;          // Can be borrowed
        uint256 ltv;                // Loan-to-value ratio (e.g., 8000 = 80%)
        uint256 liquidationThreshold; // Liquidation threshold (e.g., 8500 = 85%)
        uint256 borrowRate;         // Annual borrow rate (e.g., 500 = 5%)
        bool active;                // Whether token is active
    }

    mapping(address => mapping(uint256 => UserBorrow)) public userBorrows;
    mapping(address => uint256) public userBorrowCount;
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => uint256) public totalSupply;      // Total supplied per token
    mapping(address => uint256) public totalBorrowed;    // Total borrowed per token
    mapping(address => mapping(address => uint256)) public userSupplied; // user -> token -> amount

    uint256 constant public LTV_PRECISION = 10000;
    uint256 constant public RATE_PRECISION = 10000;
    uint256 constant public SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

    event CollateralDeposited(address indexed user, address token, uint256 amount);
    event TokensBorrowed(address indexed user, address collateralToken, address borrowToken, uint256 collateralAmount, uint256 borrowAmount);
    event LoanRepaid(address indexed user, uint256 borrowId, uint256 repayAmount);
    event CollateralWithdrawn(address indexed user, address token, uint256 amount);
    event TokenSupplied(address indexed user, address token, uint256 amount);

    constructor() {}

    function addToken(
        address token,
        bool isCollateral,
        bool isBorrowable,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 borrowRate
    ) external onlyOwner {
        tokenConfigs[token] = TokenConfig({
            isCollateral: isCollateral,
            isBorrowable: isBorrowable,
            ltv: ltv,
            liquidationThreshold: liquidationThreshold,
            borrowRate: borrowRate,
            active: true
        });
    }

    // Supply tokens to earn interest (simple version)
    function supply(address token, uint256 amount) external nonReentrant {
        require(tokenConfigs[token].active, "Token not supported");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        
        userSupplied[msg.sender][token] = userSupplied[msg.sender][token].add(amount);
        totalSupply[token] = totalSupply[token].add(amount);

        emit TokenSupplied(msg.sender, token, amount);
    }

    // Borrow against collateral
    function borrow(
        address collateralToken,
        address borrowToken,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external nonReentrant {
        require(tokenConfigs[collateralToken].isCollateral, "Token cannot be used as collateral");
        require(tokenConfigs[borrowToken].isBorrowable, "Token cannot be borrowed");
        require(collateralAmount > 0 && borrowAmount > 0, "Amounts must be > 0");

        // Check LTV
        uint256 maxBorrowAmount = collateralAmount
            .mul(tokenConfigs[collateralToken].ltv)
            .div(LTV_PRECISION);
        require(borrowAmount <= maxBorrowAmount, "Borrow amount exceeds LTV limit");

        // Check liquidity
        require(
            totalSupply[borrowToken].sub(totalBorrowed[borrowToken]) >= borrowAmount,
            "Insufficient liquidity"
        );

        // Transfer collateral from user
        IERC20(collateralToken).transferFrom(msg.sender, address(this), collateralAmount);

        // Transfer borrowed tokens to user
        IERC20(borrowToken).transfer(msg.sender, borrowAmount);

        // Record the borrow
        uint256 borrowId = userBorrowCount[msg.sender];
        userBorrows[msg.sender][borrowId] = UserBorrow({
            collateralAmount: collateralAmount,
            borrowAmount: borrowAmount,
            collateralToken: collateralToken,
            borrowToken: borrowToken,
            borrowTime: block.timestamp,
            active: true
        });

        userBorrowCount[msg.sender] = userBorrowCount[msg.sender].add(1);
        totalBorrowed[borrowToken] = totalBorrowed[borrowToken].add(borrowAmount);

        emit TokensBorrowed(msg.sender, collateralToken, borrowToken, collateralAmount, borrowAmount);
    }

    // Repay borrowed tokens
    function repay(uint256 borrowId, uint256 repayAmount) external nonReentrant {
        UserBorrow storage userBorrow = userBorrows[msg.sender][borrowId];
        require(userBorrow.active, "Borrow not active");

        uint256 totalOwed = calculateTotalOwed(msg.sender, borrowId);
        require(repayAmount <= totalOwed, "Repay amount exceeds debt");

        // Transfer repayment from user
        IERC20(userBorrow.borrowToken).transferFrom(msg.sender, address(this), repayAmount);

        // Calculate how much of the original borrow this repays
        uint256 principalRepaid = repayAmount.mul(userBorrow.borrowAmount).div(totalOwed);
        
        // Update borrow
        userBorrow.borrowAmount = userBorrow.borrowAmount.sub(principalRepaid);
        totalBorrowed[userBorrow.borrowToken] = totalBorrowed[userBorrow.borrowToken].sub(principalRepaid);

        // If fully repaid, return collateral
        if (userBorrow.borrowAmount == 0) {
            uint256 collateralToReturn = userBorrow.collateralAmount;
            userBorrow.active = false;
            userBorrow.collateralAmount = 0;

            IERC20(userBorrow.collateralToken).transfer(msg.sender, collateralToReturn);
            
            emit CollateralWithdrawn(msg.sender, userBorrow.collateralToken, collateralToReturn);
        }

        emit LoanRepaid(msg.sender, borrowId, repayAmount);
    }

    // Calculate total amount owed (principal + interest)
    function calculateTotalOwed(address user, uint256 borrowId) public view returns (uint256) {
        UserBorrow storage userBorrow = userBorrows[user][borrowId];
        if (!userBorrow.active) return 0;

        uint256 timeElapsed = block.timestamp.sub(userBorrow.borrowTime);
        uint256 borrowRate = tokenConfigs[userBorrow.borrowToken].borrowRate;
        
        // Simple interest calculation
        uint256 interest = userBorrow.borrowAmount
            .mul(borrowRate)
            .mul(timeElapsed)
            .div(RATE_PRECISION)
            .div(SECONDS_PER_YEAR);

        return userBorrow.borrowAmount.add(interest);
    }

    // Calculate maximum borrow amount for a given collateral
    function getMaxBorrowAmount(
        address collateralToken,
        address borrowToken,
        uint256 collateralAmount
    ) external view returns (uint256) {
        if (!tokenConfigs[collateralToken].isCollateral || !tokenConfigs[borrowToken].isBorrowable) {
            return 0;
        }

        // Use oracle for price calculations when available
        // Currently using 1:1 ratio for stable tokens
        uint256 maxBorrow = collateralAmount
            .mul(tokenConfigs[collateralToken].ltv)
            .div(LTV_PRECISION);

        // Check available liquidity
        uint256 availableLiquidity = totalSupply[borrowToken].sub(totalBorrowed[borrowToken]);
        return maxBorrow > availableLiquidity ? availableLiquidity : maxBorrow;
    }

    // Get user's borrow position
    function getUserBorrow(address user, uint256 borrowId) external view returns (
        uint256 collateralAmount,
        uint256 borrowAmount,
        address collateralToken,
        address borrowToken,
        uint256 totalOwed,
        bool active
    ) {
        UserBorrow storage userBorrow = userBorrows[user][borrowId];
        return (
            userBorrow.collateralAmount,
            userBorrow.borrowAmount,
            userBorrow.collateralToken,
            userBorrow.borrowToken,
            calculateTotalOwed(user, borrowId),
            userBorrow.active
        );
    }

    // Get user's supply balance
    function getUserSupplied(address user, address token) external view returns (uint256) {
        return userSupplied[user][token];
    }

    // Get lending pool info
    function getPoolInfo(address token) external view returns (
        uint256 totalSuppliedAmount,
        uint256 totalBorrowedAmount,
        uint256 availableLiquidity,
        uint256 utilizationRate
    ) {
        totalSuppliedAmount = totalSupply[token];
        totalBorrowedAmount = totalBorrowed[token];
        availableLiquidity = totalSuppliedAmount.sub(totalBorrowedAmount);
        
        if (totalSuppliedAmount > 0) {
            utilizationRate = totalBorrowedAmount.mul(10000).div(totalSuppliedAmount);
        } else {
            utilizationRate = 0;
        }
    }

    // Emergency functions
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }

    // Get user's total borrows count
    function getUserBorrowCount(address user) external view returns (uint256) {
        return userBorrowCount[user];
    }
}