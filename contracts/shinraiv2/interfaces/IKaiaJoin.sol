// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKaiaJoin {
    
    struct JoinInfo {
        address token;
        uint256 minAmount;
        uint256 maxAmount;
        bool active;
    }
    
    // Events
    event JoinCreated(bytes32 indexed joinId, address indexed token, uint256 minAmount, uint256 maxAmount);
    event JoinActivated(bytes32 indexed joinId, bool active);
    event CollateralJoined(bytes32 indexed joinId, address indexed user, uint256 amount);
    event CollateralExited(bytes32 indexed joinId, address indexed user, uint256 amount);
    
    // Core functions
    function join(bytes32 joinId, uint256 amount) external;
    function exit(bytes32 joinId, uint256 amount) external;
    function createJoin(bytes32 joinId, address token, uint256 minAmount, uint256 maxAmount) external;
    function setJoinActive(bytes32 joinId, bool active) external;
    function updateJoin(bytes32 joinId, uint256 minAmount, uint256 maxAmount) external;
    
    // View functions
    function getJoin(bytes32 joinId) external view returns (
        address token,
        uint256 minAmount,
        uint256 maxAmount,
        bool active
    );
    function isJoinActive(bytes32 joinId) external view returns (bool);
    function getActiveJoins() external view returns (bytes32[] memory);
    
    // State variables
    function joins(bytes32) external view returns (
        address token,
        uint256 minAmount,
        uint256 maxAmount,
        bool active
    );
    function activeJoins(bytes32) external view returns (bool);
}
