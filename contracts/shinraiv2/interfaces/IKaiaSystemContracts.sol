// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IKaiaSystemContracts
 * @dev Interfaces for Kaia blockchain system contracts
 * @author Shinrai Protocol
 */

interface IKaiaAddressBook {
    /**
     * @dev Get system contract address by name
     */
    function getAddress(string memory name) external view returns (address);
    
    /**
     * @dev Get all system contract addresses
     */
    function getAllAddresses() external view returns (string[] memory names, address[] memory addresses);
}

interface IKaiaGovParam {
    /**
     * @dev Get minimum stake amount
     */
    function getMinStake() external view returns (uint256);
    
    /**
     * @dev Get maximum stake amount
     */
    function getMaxStake() external view returns (uint256);
    
    /**
     * @dev Get staking lock period
     */
    function getStakeLockPeriod() external view returns (uint256);
    
    /**
     * @dev Get validator commission rate
     */
    function getValidatorCommissionRate() external view returns (uint256);
    
    /**
     * @dev Get governance parameters
     */
    function getGovernanceParams() external view returns (
        uint256 minStake,
        uint256 maxStake,
        uint256 stakeLockPeriod,
        uint256 validatorCommissionRate
    );
}

interface IKaiaStakingTracker {
    /**
     * @dev Get user's staking information
     */
    function getUserStaking(address user) external view returns (
        uint256 stakedAmount,
        uint256 stakingTime,
        uint256 lockEndTime,
        bool isLocked
    );
    
    /**
     * @dev Get total staked amount
     */
    function getTotalStaked() external view returns (uint256);
    
    /**
     * @dev Get staking rewards for user
     */
    function getStakingRewards(address user) external view returns (uint256);
    
    /**
     * @dev Check if user can unstake
     */
    function canUnstake(address user) external view returns (bool);
}

interface IKaiaCLRegistry {
    /**
     * @dev Get validator information
     */
    function getValidator(address validator) external view returns (
        string memory name,
        string memory website,
        string memory description,
        uint256 commissionRate,
        bool isActive
    );
    
    /**
     * @dev Get active validators
     */
    function getActiveValidators() external view returns (address[] memory);
    
    /**
     * @dev Get validator count
     */
    function getValidatorCount() external view returns (uint256);
    
    /**
     * @dev Check if address is a validator
     */
    function isValidator(address validator) external view returns (bool);
}

interface IKaiaTreasury {
    /**
     * @dev Get treasury balance
     */
    function getBalance() external view returns (uint256);
    
    /**
     * @dev Get treasury allocation for protocol
     */
    function getProtocolAllocation() external view returns (uint256);
    
    /**
     * @dev Request funds from treasury
     */
    function requestFunds(uint256 amount) external returns (bool);
}
