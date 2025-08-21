// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract KaiaDEX is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
        bool exists;
    }

    mapping(bytes32 => Pool) public pools;
    mapping(address => mapping(address => bytes32)) public getPoolId;
    
    uint256 public constant FEE_RATE = 3; // 0.3%
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    event PoolCreated(address indexed tokenA, address indexed tokenB, bytes32 poolId);
    event LiquidityAdded(address indexed user, bytes32 poolId, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(address indexed user, bytes32 poolId, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Swap(address indexed user, bytes32 poolId, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);

    function createPool(address tokenA, address tokenB) external returns (bytes32 poolId) {
        require(tokenA != tokenB, "Identical tokens");
        require(tokenA != address(0) && tokenB != address(0), "Zero address");
        
        // Sort tokens to ensure consistent pool IDs
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        
        poolId = keccak256(abi.encodePacked(tokenA, tokenB));
        require(!pools[poolId].exists, "Pool already exists");
        
        Pool storage pool = pools[poolId];
        pool.tokenA = tokenA;
        pool.tokenB = tokenB;
        pool.exists = true;
        
        getPoolId[tokenA][tokenB] = poolId;
        getPoolId[tokenB][tokenA] = poolId;
        
        emit PoolCreated(tokenA, tokenB, poolId);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 liquidity) {
        bytes32 poolId = getPoolId[tokenA][tokenB];
        require(pools[poolId].exists, "Pool does not exist");
        
        Pool storage pool = pools[poolId];
        
        // Ensure tokens are in correct order
        if (tokenA != pool.tokenA) {
            (tokenA, tokenB) = (tokenB, tokenA);
            (amountA, amountB) = (amountB, amountA);
            (amountAMin, amountBMin) = (amountBMin, amountAMin);
        }
        
        uint256 actualAmountA = amountA;
        uint256 actualAmountB = amountB;
        
        if (pool.totalLiquidity > 0) {
            // Calculate optimal amounts based on current ratio
            uint256 amountBOptimal = amountA.mul(pool.reserveB).div(pool.reserveA);
            if (amountBOptimal <= amountB) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                actualAmountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = amountB.mul(pool.reserveA).div(pool.reserveB);
                require(amountAOptimal <= amountA && amountAOptimal >= amountAMin, "Insufficient A amount");
                actualAmountA = amountAOptimal;
            }
            
            liquidity = actualAmountA.mul(pool.totalLiquidity).div(pool.reserveA);
        } else {
            // First liquidity provision
            liquidity = sqrt(actualAmountA.mul(actualAmountB));
        }
        
        require(liquidity > 0, "Insufficient liquidity minted");
        
        // Transfer tokens
        IERC20(pool.tokenA).transferFrom(msg.sender, address(this), actualAmountA);
        IERC20(pool.tokenB).transferFrom(msg.sender, address(this), actualAmountB);
        
        // Update pool state
        pool.reserveA = pool.reserveA.add(actualAmountA);
        pool.reserveB = pool.reserveB.add(actualAmountB);
        pool.totalLiquidity = pool.totalLiquidity.add(liquidity);
        pool.liquidity[msg.sender] = pool.liquidity[msg.sender].add(liquidity);
        
        emit LiquidityAdded(msg.sender, poolId, actualAmountA, actualAmountB, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        bytes32 poolId = getPoolId[tokenA][tokenB];
        require(pools[poolId].exists, "Pool does not exist");
        
        Pool storage pool = pools[poolId];
        require(pool.liquidity[msg.sender] >= liquidity, "Insufficient liquidity");
        
        // Ensure tokens are in correct order
        bool isReversed = tokenA != pool.tokenA;
        
        // Calculate amounts to return
        amountA = liquidity.mul(pool.reserveA).div(pool.totalLiquidity);
        amountB = liquidity.mul(pool.reserveB).div(pool.totalLiquidity);
        
        if (isReversed) {
            (amountA, amountB) = (amountB, amountA);
            (amountAMin, amountBMin) = (amountBMin, amountAMin);
        }
        
        require(amountA >= amountAMin && amountB >= amountBMin, "Insufficient output amount");
        
        // Update pool state
        pool.reserveA = pool.reserveA.sub(isReversed ? amountB : amountA);
        pool.reserveB = pool.reserveB.sub(isReversed ? amountA : amountB);
        pool.totalLiquidity = pool.totalLiquidity.sub(liquidity);
        pool.liquidity[msg.sender] = pool.liquidity[msg.sender].sub(liquidity);
        
        // Transfer tokens back
        IERC20(pool.tokenA).transfer(msg.sender, isReversed ? amountB : amountA);
        IERC20(pool.tokenB).transfer(msg.sender, isReversed ? amountA : amountB);
        
        emit LiquidityRemoved(msg.sender, poolId, amountA, amountB, liquidity);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address tokenIn,
        address tokenOut
    ) external nonReentrant returns (uint256 amountOut) {
        bytes32 poolId = getPoolId[tokenIn][tokenOut];
        require(pools[poolId].exists, "Pool does not exist");
        
        Pool storage pool = pools[poolId];
        
        // Calculate output amount with fee
        uint256 amountInWithFee = amountIn.mul(FEE_DENOMINATOR.sub(FEE_RATE));
        
        if (tokenIn == pool.tokenA) {
            amountOut = amountInWithFee.mul(pool.reserveB).div(
                pool.reserveA.mul(FEE_DENOMINATOR).add(amountInWithFee)
            );
            
            require(amountOut >= amountOutMin, "Insufficient output amount");
            
            // Update reserves
            pool.reserveA = pool.reserveA.add(amountIn);
            pool.reserveB = pool.reserveB.sub(amountOut);
        } else {
            amountOut = amountInWithFee.mul(pool.reserveA).div(
                pool.reserveB.mul(FEE_DENOMINATOR).add(amountInWithFee)
            );
            
            require(amountOut >= amountOutMin, "Insufficient output amount");
            
            // Update reserves
            pool.reserveB = pool.reserveB.add(amountIn);
            pool.reserveA = pool.reserveA.sub(amountOut);
        }
        
        // Transfer tokens
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        emit Swap(msg.sender, poolId, tokenIn, tokenOut, amountIn, amountOut);
    }

    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external view returns (uint256 amountOut) {
        bytes32 poolId = getPoolId[tokenIn][tokenOut];
        require(pools[poolId].exists, "Pool does not exist");
        
        Pool storage pool = pools[poolId];
        uint256 amountInWithFee = amountIn.mul(FEE_DENOMINATOR.sub(FEE_RATE));
        
        if (tokenIn == pool.tokenA) {
            amountOut = amountInWithFee.mul(pool.reserveB).div(
                pool.reserveA.mul(FEE_DENOMINATOR).add(amountInWithFee)
            );
        } else {
            amountOut = amountInWithFee.mul(pool.reserveA).div(
                pool.reserveB.mul(FEE_DENOMINATOR).add(amountInWithFee)
            );
        }
    }

    function getPoolInfo(address tokenA, address tokenB) 
        external 
        view 
        returns (
            uint256 reserveA,
            uint256 reserveB,
            uint256 totalLiquidity
        ) 
    {
        bytes32 poolId = getPoolId[tokenA][tokenB];
        Pool storage pool = pools[poolId];
        
        if (tokenA == pool.tokenA) {
            return (pool.reserveA, pool.reserveB, pool.totalLiquidity);
        } else {
            return (pool.reserveB, pool.reserveA, pool.totalLiquidity);
        }
    }

    function getUserLiquidity(address tokenA, address tokenB, address user) 
        external 
        view 
        returns (uint256) 
    {
        bytes32 poolId = getPoolId[tokenA][tokenB];
        return pools[poolId].liquidity[user];
    }

    // Babylonian method for square root
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}