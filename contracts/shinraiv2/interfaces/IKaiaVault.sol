// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKaiaVault {
    
    struct CollateralType {
        uint256 debtCeiling;
        uint256 debtFloor;
        uint256 liquidationRatio;
        uint256 stabilityFee;
        uint256 liquidationPenalty;
        bool active;
        uint256 totalCollateral;
        uint256 totalDebt;
    }
    
    struct UserPosition {
        uint256 collateral;
        uint256 debt;
        uint256 lastUpdate;
        bool active;
    }
    
    // Events
    event CollateralTypeAdded(bytes32 indexed collateralId, uint256 debtCeiling, uint256 liquidationRatio);
    event CollateralDeposited(bytes32 indexed collateralId, address indexed user, uint256 amount);
    event CollateralWithdrawn(bytes32 indexed collateralId, address indexed user, uint256 amount);
    event DebtIssued(bytes32 indexed collateralId, address indexed user, uint256 amount);
    event DebtRepaid(bytes32 indexed collateralId, address indexed user, uint256 amount);
    event PositionLiquidated(bytes32 indexed collateralId, address indexed user, address indexed liquidator);
    
    // Core functions
    function addCollateralType(
        bytes32 collateralId,
        uint256 debtCeiling,
        uint256 debtFloor,
        uint256 liquidationRatio,
        uint256 stabilityFee,
        uint256 liquidationPenalty
    ) external;
    
    function depositCollateral(bytes32 collateralId, uint256 amount) external;
    function withdrawCollateral(bytes32 collateralId, uint256 amount) external;
    function issueDebt(bytes32 collateralId, uint256 amount) external;
    function repayDebt(bytes32 collateralId, uint256 amount) external;
    
    // View functions
    function isPositionSafe(bytes32 collateralId, address user, uint256 withdrawalAmount) external view returns (bool);
    function getMaxDebt(bytes32 collateralId, address user) external view returns (uint256);
    function getCollateralValue(bytes32 collateralId, uint256 amount) external view returns (uint256);
    function getPosition(bytes32 collateralId, address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 lastUpdate,
        bool active
    );
    function getCollateralType(bytes32 collateralId) external view returns (
        uint256 debtCeiling,
        uint256 debtFloor,
        uint256 liquidationRatio,
        uint256 stabilityFee,
        uint256 liquidationPenalty,
        bool active,
        uint256 totalCollateral,
        uint256 totalDebt
    );
    
    // State variables
    function collateralTypes(bytes32) external view returns (
        uint256 debtCeiling,
        uint256 debtFloor,
        uint256 liquidationRatio,
        uint256 stabilityFee,
        uint256 liquidationPenalty,
        bool active,
        uint256 totalCollateral,
        uint256 totalDebt
    );
    function userPositions(bytes32, address) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 lastUpdate,
        bool active
    );
    function globalDebtCeiling(bytes32) external view returns (uint256);
    function totalDebtIssued() external view returns (uint256);
    function totalCollateralLocked() external view returns (uint256);
    function systemStabilityFee() external view returns (uint256);
    function oracle() external view returns (address);
}
