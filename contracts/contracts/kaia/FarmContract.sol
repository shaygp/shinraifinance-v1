// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FarmContract is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }

    struct PoolInfo {
        IERC20 lpToken;
        IERC20 rewardToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
        uint256 totalStaked;
        uint256 rewardPerBlock;
        string name;
        bool active;
    }

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    uint256 public totalAllocPoint = 0;
    uint256 public startBlock;
    
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, address rewardToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);

    constructor(uint256 _startBlock) {
        startBlock = _startBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function addPool(
        IERC20 _lpToken,
        IERC20 _rewardToken,
        uint256 _allocPoint,
        uint256 _rewardPerBlock,
        string memory _name
    ) external onlyOwner {
        massUpdatePools();
        
        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            rewardToken: _rewardToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0,
            totalStaked: 0,
            rewardPerBlock: _rewardPerBlock,
            name: _name,
            active: true
        }));

        emit PoolAdded(poolInfo.length - 1, address(_lpToken), address(_rewardToken), _allocPoint);
    }

    function updatePool(uint256 _pid, uint256 _allocPoint) external onlyOwner {
        massUpdatePools();
        
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
        
        emit PoolUpdated(_pid, _allocPoint);
    }

    function setPoolActive(uint256 _pid, bool _active) external onlyOwner {
        poolInfo[_pid].active = _active;
    }

    function updatePoolRewardRate(uint256 _pid, uint256 _rewardPerBlock) external onlyOwner {
        updatePoolRewards(_pid);
        poolInfo[_pid].rewardPerBlock = _rewardPerBlock;
    }

    function getMultiplier(uint256 _from, uint256 _to) public pure returns (uint256) {
        return _to.sub(_from);
    }

    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.totalStaked;
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0 && pool.active) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 reward = multiplier.mul(pool.rewardPerBlock);
            accRewardPerShare = accRewardPerShare.add(reward.mul(1e12).div(lpSupply));
        }
        
        return user.amount.mul(accRewardPerShare).div(1e12).sub(user.rewardDebt).add(user.pendingRewards);
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePoolRewards(pid);
        }
    }

    function updatePoolRewards(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        
        if (block.number <= pool.lastRewardBlock || !pool.active) {
            return;
        }
        
        uint256 lpSupply = pool.totalStaked;
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 reward = multiplier.mul(pool.rewardPerBlock);
        
        pool.accRewardPerShare = pool.accRewardPerShare.add(reward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(pool.active, "Pool not active");
        
        updatePoolRewards(_pid);
        
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
            if (pending > 0) {
                user.pendingRewards = user.pendingRewards.add(pending);
            }
        }
        
        if (_amount > 0) {
            pool.lpToken.transferFrom(msg.sender, address(this), _amount);
            user.amount = user.amount.add(_amount);
            pool.totalStaked = pool.totalStaked.add(_amount);
        }
        
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Insufficient staked amount");
        
        updatePoolRewards(_pid);
        
        uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
        if (pending > 0) {
            user.pendingRewards = user.pendingRewards.add(pending);
        }
        
        if (_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.totalStaked = pool.totalStaked.sub(_amount);
            pool.lpToken.transfer(msg.sender, _amount);
        }
        
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function harvest(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePoolRewards(_pid);
        
        uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e12).sub(user.rewardDebt);
        uint256 totalPending = pending.add(user.pendingRewards);
        
        if (totalPending > 0) {
            user.pendingRewards = 0;
            pool.rewardToken.transfer(msg.sender, totalPending);
            emit Harvest(msg.sender, _pid, totalPending);
        }
        
        user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e12);
    }

    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        
        pool.totalStaked = pool.totalStaked.sub(amount);
        pool.lpToken.transfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, _pid, amount);
    }

    function getPoolInfo(uint256 _pid) external view returns (
        address lpToken,
        address rewardToken,
        uint256 allocPoint,
        uint256 totalStaked,
        uint256 rewardPerBlock,
        string memory name,
        bool active
    ) {
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            address(pool.rewardToken),
            pool.allocPoint,
            pool.totalStaked,
            pool.rewardPerBlock,
            pool.name,
            pool.active
        );
    }

    function getUserInfo(uint256 _pid, address _user) external view returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 pendingRewards
    ) {
        UserInfo storage user = userInfo[_pid][_user];
        return (user.amount, user.rewardDebt, user.pendingRewards);
    }

    // Calculate APY for a pool
    function calculateAPY(uint256 _pid) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        if (pool.totalStaked == 0) return 0;
        
        // Blocks per year (assuming 3 second block time)
        uint256 blocksPerYear = 365 * 24 * 60 * 20; // ~10,512,000 blocks
        uint256 yearlyRewards = pool.rewardPerBlock.mul(blocksPerYear);
        
        // Return APY as percentage * 100 (e.g., 5000 = 50.00%)
        return yearlyRewards.mul(10000).div(pool.totalStaked);
    }

    // Owner functions for emergency
    function emergencyRewardWithdraw(uint256 _pid, uint256 _amount) external onlyOwner {
        PoolInfo storage pool = poolInfo[_pid];
        pool.rewardToken.transfer(owner(), _amount);
    }
}