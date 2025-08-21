// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IKaiaVault.sol";
import "./interfaces/IKaiaSystemContracts.sol";

/**
 * @title KaiaVault
 * @dev Core vault system for Shinrai Protocol on Kaia blockchain
 * @author Shinrai Protocol
 */
contract KaiaVault is IKaiaVault, Ownable, ReentrancyGuard, Pausable {
    
    // State variables with proper override declarations
    mapping(bytes32 => CollateralType) public override collateralTypes;
    mapping(bytes32 => mapping(address => UserPosition)) public override userPositions;
    mapping(bytes32 => uint256) public override globalDebtCeiling;
    
    uint256 public override totalDebtIssued;
    uint256 public override totalCollateralLocked;
    uint256 public override systemStabilityFee;
    
    address public override oracle;
    IKaiaAddressBook public addressBook;
    IKaiaStakingTracker public stakingTracker;
    IKaiaGovParam public govParam;
    
    // Modifiers
    modifier onlyActiveCollateral(bytes32 collateralId) {
        require(collateralTypes[collateralId].active, "KaiaVault: Collateral type not active");
        _;
    }
    
    modifier onlyValidPosition(bytes32 collateralId, address user) {
        require(userPositions[collateralId][user].active, "KaiaVault: Position not active");
        _;
    }
    
    constructor(
        address _oracle,
        address _addressBook,
        address _stakingTracker,
        address _govParam
    ) {
        oracle = _oracle;
        addressBook = IKaiaAddressBook(_addressBook);
        stakingTracker = IKaiaStakingTracker(_stakingTracker);
        govParam = IKaiaGovParam(_govParam);
        systemStabilityFee = 500; // 5% default
    }
    
    /**
     * @dev Add a new collateral type
     */
    function addCollateralType(
        bytes32 collateralId,
        uint256 debtCeiling,
        uint256 debtFloor,
        uint256 liquidationRatio,
        uint256 stabilityFee,
        uint256 liquidationPenalty
    ) external onlyOwner {
        require(collateralTypes[collateralId].debtCeiling == 0, "KaiaVault: Collateral type already exists");
        require(liquidationRatio > 10000, "KaiaVault: Liquidation ratio too low");
        require(stabilityFee <= 2000, "KaiaVault: Stability fee too high");
        
        collateralTypes[collateralId] = CollateralType({
            debtCeiling: debtCeiling,
            debtFloor: debtFloor,
            liquidationRatio: liquidationRatio,
            stabilityFee: stabilityFee,
            liquidationPenalty: liquidationPenalty,
            active: true,
            totalCollateral: 0,
            totalDebt: 0
        });
        
        emit CollateralTypeAdded(collateralId, debtCeiling, liquidationRatio);
    }
    
    /**
     * @dev Deposit collateral
     */
    function depositCollateral(
        bytes32 collateralId,
        uint256 amount
    ) external onlyActiveCollateral(collateralId) nonReentrant whenNotPaused {
        require(amount > 0, "KaiaVault: Amount must be greater than 0");
        
        UserPosition storage position = userPositions[collateralId][msg.sender];
        if (!position.active) {
            position.active = true;
            position.lastUpdate = block.timestamp;
        }
        
        position.collateral += amount;
        collateralTypes[collateralId].totalCollateral += amount;
        totalCollateralLocked += amount;
        
        emit CollateralDeposited(collateralId, msg.sender, amount);
    }
    
    /**
     * @dev Withdraw collateral (if position remains safe)
     */
    function withdrawCollateral(
        bytes32 collateralId,
        uint256 amount
    ) external onlyValidPosition(collateralId, msg.sender) nonReentrant whenNotPaused {
        require(amount > 0, "KaiaVault: Amount must be greater than 0");
        
        UserPosition storage position = userPositions[collateralId][msg.sender];
        require(position.collateral >= amount, "KaiaVault: Insufficient collateral");
        
        // Check if withdrawal would make position unsafe
        require(isPositionSafe(collateralId, msg.sender, amount), "KaiaVault: Withdrawal would make position unsafe");
        
        position.collateral -= amount;
        collateralTypes[collateralId].totalCollateral -= amount;
        totalCollateralLocked -= amount;
        
        emit CollateralWithdrawn(collateralId, msg.sender, amount);
    }
    
    /**
     * @dev Issue debt (borrow USDT)
     */
    function issueDebt(
        bytes32 collateralId,
        uint256 amount
    ) external onlyValidPosition(collateralId, msg.sender) nonReentrant whenNotPaused {
        require(amount > 0, "KaiaVault: Amount must be greater than 0");
        require(amount >= collateralTypes[collateralId].debtFloor, "KaiaVault: Amount below debt floor");
        
        UserPosition storage position = userPositions[collateralId][msg.sender];
        uint256 newDebt = position.debt + amount;
        
        require(newDebt <= getMaxDebt(collateralId, msg.sender), "KaiaVault: Exceeds max debt");
        require(totalDebtIssued + amount <= globalDebtCeiling[collateralId], "KaiaVault: Exceeds global debt ceiling");
        
        position.debt = newDebt;
        position.lastUpdate = block.timestamp;
        collateralTypes[collateralId].totalDebt += amount;
        totalDebtIssued += amount;
        
        emit DebtIssued(collateralId, msg.sender, amount);
    }
    
    /**
     * @dev Repay debt
     */
    function repayDebt(
        bytes32 collateralId,
        uint256 amount
    ) external onlyValidPosition(collateralId, msg.sender) nonReentrant whenNotPaused {
        require(amount > 0, "KaiaVault: Amount must be greater than 0");
        
        UserPosition storage position = userPositions[collateralId][msg.sender];
        require(position.debt >= amount, "KaiaVault: Insufficient debt to repay");
        
        position.debt -= amount;
        position.lastUpdate = block.timestamp;
        collateralTypes[collateralId].totalDebt -= amount;
        totalDebtIssued -= amount;
        
        emit DebtRepaid(collateralId, msg.sender, amount);
    }
    
    /**
     * @dev Check if position is safe
     */
    function isPositionSafe(
        bytes32 collateralId,
        address user,
        uint256 withdrawalAmount
    ) public view returns (bool) {
        UserPosition memory position = userPositions[collateralId][user];
        if (position.debt == 0) return true;
        
        uint256 collateralValue = getCollateralValue(collateralId, position.collateral - withdrawalAmount);
        uint256 debtValue = position.debt;
        uint256 requiredRatio = collateralTypes[collateralId].liquidationRatio;
        
        return (collateralValue * 10000) >= (debtValue * requiredRatio);
    }
    
    /**
     * @dev Get maximum debt for user
     */
    function getMaxDebt(bytes32 collateralId, address user) public view returns (uint256) {
        UserPosition memory position = userPositions[collateralId][user];
        uint256 collateralValue = getCollateralValue(collateralId, position.collateral);
        uint256 liquidationRatio = collateralTypes[collateralId].liquidationRatio;
        
        return (collateralValue * 10000) / liquidationRatio;
    }
    
    /**
     * @dev Get collateral value in USDT
     */
    function getCollateralValue(bytes32 collateralId, uint256 amount) public view returns (uint256) {
        // For now, return a fixed price for testing
        // In production, this would get price from oracle
        return amount; // 1:1 ratio for testing
    }
    
    /**
     * @dev Get collateral token address from collateral ID
     */
    function getCollateralTokenAddress(bytes32 collateralId) public pure returns (address) {
        // For now, return a placeholder address
        // In production, this would map collateral IDs to token addresses
        return address(0x0);
    }
    
    /**
     * @dev Get position information
     */
    function getPosition(bytes32 collateralId, address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 lastUpdate,
        bool active
    ) {
        UserPosition memory position = userPositions[collateralId][user];
        return (position.collateral, position.debt, position.lastUpdate, position.active);
    }
    
    /**
     * @dev Get collateral type information
     */
    function getCollateralType(bytes32 collateralId) external view returns (
        uint256 debtCeiling,
        uint256 debtFloor,
        uint256 liquidationRatio,
        uint256 stabilityFee,
        uint256 liquidationPenalty,
        bool active,
        uint256 totalCollateral,
        uint256 totalDebt
    ) {
        CollateralType memory collateral = collateralTypes[collateralId];
        return (
            collateral.debtCeiling,
            collateral.debtFloor,
            collateral.liquidationRatio,
            collateral.stabilityFee,
            collateral.liquidationPenalty,
            collateral.active,
            collateral.totalCollateral,
            collateral.totalDebt
        );
    }
    
    // Admin functions
    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }
    
    function setGlobalDebtCeiling(bytes32 collateralId, uint256 ceiling) external onlyOwner {
        globalDebtCeiling[collateralId] = ceiling;
    }
    
    function setSystemStabilityFee(uint256 fee) external onlyOwner {
        require(fee <= 2000, "KaiaVault: Fee too high");
        systemStabilityFee = fee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}