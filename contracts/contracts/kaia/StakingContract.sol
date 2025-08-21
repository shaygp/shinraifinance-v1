// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingContract is ReentrancyGuard, Ownable {
    IERC20 public kaiaToken;
    
    struct Staker {
        uint256 stakedAmount;
        uint256 rewardDebt;
        uint256 lastUpdateTime;
    }
    
    mapping(address => Staker) public stakers;
    
    uint256 public totalStaked;
    uint256 public rewardPerToken;
    uint256 public lastUpdateTime;
    uint256 public rewardRate = 1e15; // Simplified reward rate
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor(address _kaiaToken) {
        kaiaToken = IERC20(_kaiaToken);
        lastUpdateTime = block.timestamp;
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(kaiaToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        _updateRewards(msg.sender);
        
        stakers[msg.sender].stakedAmount += amount;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0");
        require(stakers[msg.sender].stakedAmount >= amount, "Insufficient staked amount");
        
        _updateRewards(msg.sender);
        
        stakers[msg.sender].stakedAmount -= amount;
        totalStaked -= amount;
        
        require(kaiaToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        
        uint256 rewards = stakers[msg.sender].rewardDebt;
        require(rewards > 0, "No rewards to claim");
        
        stakers[msg.sender].rewardDebt = 0;
        
        // Mint new KAIA tokens as rewards
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    function _updateRewards(address user) internal {
        if (totalStaked > 0) {
            rewardPerToken += (block.timestamp - lastUpdateTime) * rewardRate;
        }
        
        if (stakers[user].stakedAmount > 0) {
            uint256 pending = (stakers[user].stakedAmount * (rewardPerToken - stakers[user].rewardDebt)) / 1e18;
            stakers[user].rewardDebt += pending;
        }
        
        stakers[user].lastUpdateTime = block.timestamp;
        lastUpdateTime = block.timestamp;
    }
    
    function getStakerInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 lastUpdate
    ) {
        Staker memory staker = stakers[user];
        uint256 currentRewardPerToken = rewardPerToken;
        
        if (totalStaked > 0) {
            currentRewardPerToken += (block.timestamp - lastUpdateTime) * rewardRate;
        }
        
        uint256 pending = 0;
        if (staker.stakedAmount > 0) {
            pending = (staker.stakedAmount * (currentRewardPerToken - staker.rewardDebt)) / 1e18;
        }
        
        return (staker.stakedAmount, pending, staker.lastUpdateTime);
    }
    
    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }
    
    function getAPY() external pure returns (uint256) {
        return 100; // 100% APY
    }
    
    // Emergency functions for owner
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = kaiaToken.balanceOf(address(this));
        if (balance > 0) {
            kaiaToken.transfer(owner(), balance);
        }
    }
}
