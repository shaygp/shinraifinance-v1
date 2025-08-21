// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKaiaVault.sol";
import "./interfaces/IKaiaInteraction.sol";
import "./interfaces/IKaiaSystemContracts.sol";
// Using external token contracts deployed on Kaia network

/**
 * @title KaiaInteraction
 * @dev Main user interface for Shinrai Protocol on Kaia blockchain
 * @author Shinrai Protocol
 */
contract KaiaInteraction is IKaiaInteraction, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Core contracts
    IKaiaVault public vault;
    IERC20 public kaiaToken;
    IERC20 public usdtToken;
    IERC20 public wkaiaToken;
    
    // Kaia system contracts
    IKaiaStakingTracker public stakingTracker;
    IKaiaGovParam public govParam;
    IKaiaCLRegistry public clRegistry;
    
    // Events are defined in the interface
    
    // Modifiers
    modifier onlyValidAmount(uint256 amount) {
        require(amount > 0, "KaiaInteraction: Amount must be greater than 0");
        _;
    }
    
    modifier onlyValidCollateral(bytes32 collateralId) {
        (,,,,, bool active,,) = vault.getCollateralType(collateralId);
        require(active, "KaiaInteraction: Invalid collateral type");
        _;
    }
    
    constructor(
        address _vault,
        address _kaiaToken,
        address _usdtToken,
        address _wkaiaToken,
        address _stakingTracker,
        address _govParam,
        address _clRegistry
    ) {
        vault = IKaiaVault(_vault);
        kaiaToken = IERC20(_kaiaToken);
        usdtToken = IERC20(_usdtToken);
        wkaiaToken = IERC20(_wkaiaToken);
        stakingTracker = IKaiaStakingTracker(_stakingTracker);
        govParam = IKaiaGovParam(_govParam);
        clRegistry = IKaiaCLRegistry(_clRegistry);
        
        // Validate that we're using the correct Kaia network addresses
        require(_kaiaToken == 0xb9563C346537427aa41876aa4720902268dCdB40, "KaiaInteraction: Invalid KAIA address");
        require(_usdtToken == 0x0236E4DA096053856Cb659d628D7012Cdf4b2985, "KaiaInteraction: Invalid USDT address");
        require(_wkaiaToken == 0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773, "KaiaInteraction: Invalid WKAIA address");
    }
    
    /**
     * @dev Stake KAIA tokens for liquid staking
     */
    function stake(uint256 amount) external onlyValidAmount(amount) nonReentrant whenNotPaused {
        require(kaiaToken.balanceOf(msg.sender) >= amount, "KaiaInteraction: Insufficient KAIA balance");
        
        // Check staking limits from Kaia governance
        (uint256 minStake, uint256 maxStake, , ) = govParam.getGovernanceParams();
        require(amount >= minStake, "KaiaInteraction: Below minimum stake");
        require(amount <= maxStake, "KaiaInteraction: Above maximum stake");
        
        // Transfer KAIA from user to this contract
        kaiaToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Integrate with Kaia staking tracker
        // Note: In practice, this would call the actual staking function
        // For now, we're just tracking the stake locally
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @dev Unstake KAIA tokens
     */
    function unstake(uint256 amount) external onlyValidAmount(amount) nonReentrant whenNotPaused {
        // Check if user can unstake from Kaia staking tracker
        require(stakingTracker.canUnstake(msg.sender), "KaiaInteraction: Cannot unstake yet");
        
        // Get user's staking info
        (uint256 stakedAmount, , uint256 lockEndTime, bool isLocked) = stakingTracker.getUserStaking(msg.sender);
        require(stakedAmount >= amount, "KaiaInteraction: Insufficient staked amount");
        require(!isLocked || block.timestamp >= lockEndTime, "KaiaInteraction: Staking still locked");
        
        // Transfer KAIA back to user
        kaiaToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, amount);
    }
    
    /**
     * @dev Deposit collateral and borrow USDT
     */
    function depositAndBorrow(
        bytes32 collateralId,
        uint256 collateralAmount,
        uint256 borrowAmount
    ) external onlyValidCollateral(collateralId) onlyValidAmount(collateralAmount) onlyValidAmount(borrowAmount) nonReentrant whenNotPaused {
        
        // Get the collateral token (assuming it's an ERC20)
        address collateralToken = getCollateralToken(collateralId);
        IERC20 collateral = IERC20(collateralToken);
        
        require(collateral.balanceOf(msg.sender) >= collateralAmount, "KaiaInteraction: Insufficient collateral balance");
        
        // Transfer collateral from user to vault
        collateral.safeTransferFrom(msg.sender, address(vault), collateralAmount);
        
        // Deposit collateral to vault
        vault.depositCollateral(collateralId, collateralAmount);
        
        // Issue debt (borrow USDT)
        vault.issueDebt(collateralId, borrowAmount);
        
        // Transfer USDT to user (assuming contract has USDT balance)
        usdtToken.safeTransfer(msg.sender, borrowAmount);
        
        emit Borrowed(msg.sender, collateralAmount, borrowAmount);
    }
    
    /**
     * @dev Repay debt and withdraw collateral
     */
    function repayAndWithdraw(
        bytes32 collateralId,
        uint256 repayAmount,
        uint256 withdrawAmount
    ) external onlyValidAmount(repayAmount) onlyValidAmount(withdrawAmount) nonReentrant whenNotPaused {
        
        require(usdtToken.balanceOf(msg.sender) >= repayAmount, "KaiaInteraction: Insufficient USDT balance");
        
        // Transfer USDT from user to this contract
        usdtToken.safeTransferFrom(msg.sender, address(this), repayAmount);
        
        // Repay debt to vault
        vault.repayDebt(collateralId, repayAmount);
        
        // Withdraw collateral from vault
        vault.withdrawCollateral(collateralId, withdrawAmount);
        
        // Transfer collateral back to user
        address collateralToken = getCollateralToken(collateralId);
        IERC20(collateralToken).safeTransfer(msg.sender, withdrawAmount);
        
        emit Repaid(msg.sender, repayAmount);
    }
    
    /**
     * @dev Liquidate an unsafe position
     */
    function liquidate(
        bytes32 collateralId,
        address user
    ) external onlyValidCollateral(collateralId) nonReentrant whenNotPaused {
        
        // Check if position is unsafe
        require(!vault.isPositionSafe(collateralId, user, 0), "KaiaInteraction: Position is safe");
        
        // Get position details
        (uint256 collateral, uint256 debt, , ) = vault.getPosition(collateralId, user);
        
        require(collateral > 0 && debt > 0, "KaiaInteraction: Invalid position");
        
        // Calculate liquidation amount (typically 50% of debt)
        uint256 liquidationAmount = debt / 2;
        
        // Repay debt on behalf of user
        usdtToken.safeTransferFrom(msg.sender, address(this), liquidationAmount);
        vault.repayDebt(collateralId, liquidationAmount);
        
        // Calculate collateral to seize (with liquidation penalty)
        uint256 collateralToSeize = calculateLiquidationCollateral(collateralId, liquidationAmount);
        
        // Withdraw collateral from vault
        vault.withdrawCollateral(collateralId, collateralToSeize);
        
        // Transfer seized collateral to liquidator
        address collateralToken = getCollateralToken(collateralId);
        IERC20(collateralToken).safeTransfer(msg.sender, collateralToSeize);
        
        emit Liquidated(user, msg.sender, collateralToSeize, liquidationAmount);
    }
    
    /**
     * @dev Get user's position information
     */
    function getPosition(bytes32 collateralId, address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 lastUpdate,
        bool active
    ) {
        return vault.getPosition(collateralId, user);
    }
    
    /**
     * @dev Get maximum borrowable amount for user
     */
    function getMaxBorrow(bytes32 collateralId, address user) external view returns (uint256) {
        return vault.getMaxDebt(collateralId, user);
    }
    
    /**
     * @dev Check if position is safe
     */
    function isPositionSafe(bytes32 collateralId, address user) external view returns (bool) {
        return vault.isPositionSafe(collateralId, user, 0);
    }
    
    /**
     * @dev Get collateral token address for a collateral type
     */
    function getCollateralToken(bytes32 collateralId) public view returns (address) {
        // This is a simplified mapping - in practice, you'd have a proper mapping
        // For now, returning KAIA address as default
        return address(kaiaToken);
    }
    
    /**
     * @dev Calculate collateral to seize during liquidation
     */
    function calculateLiquidationCollateral(bytes32 collateralId, uint256 debtAmount) internal view returns (uint256) {
        // Get liquidation penalty from vault
        (,,,, uint256 liquidationPenalty,,,) = vault.getCollateralType(collateralId);
        
        // Calculate collateral value needed to cover debt + penalty
        uint256 collateralValue = debtAmount + (debtAmount * liquidationPenalty / 10000);
        
        // Convert to collateral amount (this would use oracle price)
        return collateralValue; // Simplified - should use oracle
    }
    
    // Admin functions
    function setStakingTracker(address _stakingTracker) external onlyOwner {
        stakingTracker = IKaiaStakingTracker(_stakingTracker);
    }
    
    function setVault(address _vault) external onlyOwner {
        vault = IKaiaVault(_vault);
    }
    
    function setGovParam(address _govParam) external onlyOwner {
        govParam = IKaiaGovParam(_govParam);
    }
    
    function setCLRegistry(address _clRegistry) external onlyOwner {
        clRegistry = IKaiaCLRegistry(_clRegistry);
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
