// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKaiaInteraction {
    
    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 collateralAmount, uint256 borrowAmount);
    event Repaid(address indexed user, uint256 repayAmount);
    event Liquidated(address indexed user, address indexed liquidator, uint256 collateralAmount, uint256 debtAmount);
    
    // Core functions
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function depositAndBorrow(bytes32 collateralId, uint256 collateralAmount, uint256 borrowAmount) external;
    function repayAndWithdraw(bytes32 collateralId, uint256 repayAmount, uint256 withdrawAmount) external;
    function liquidate(bytes32 collateralId, address user) external;
    
    // View functions
    function getPosition(bytes32 collateralId, address user) external view returns (
        uint256 collateral,
        uint256 debt,
        uint256 lastUpdate,
        bool active
    );
    function getMaxBorrow(bytes32 collateralId, address user) external view returns (uint256);
    function isPositionSafe(bytes32 collateralId, address user) external view returns (bool);
    function getCollateralToken(bytes32 collateralId) external view returns (address);
    
    // State variables (automatically generated getters)
}
