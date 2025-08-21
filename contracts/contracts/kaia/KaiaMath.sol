// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title KaiaMath
 * @dev Mathematical utilities for Shinrai Protocol on Kaia blockchain
 * @author Shinrai Protocol
 */
library KaiaMath {
    
    uint256 public constant RAY = 10**27;
    uint256 public constant RAD = 10**45;
    uint256 public constant WAD = 10**18;
    
    /**
     * @dev Multiply two numbers and round down
     */
    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "KaiaMath: multiplication overflow");
    }
    
    /**
     * @dev Divide two numbers and round down
     */
    function div(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y > 0, "KaiaMath: division by zero");
        z = x / y;
    }
    
    /**
     * @dev Add two numbers
     */
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x, "KaiaMath: addition overflow");
    }
    
    /**
     * @dev Subtract two numbers
     */
    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "KaiaMath: subtraction overflow");
    }
    
    /**
     * @dev Calculate minimum of two numbers
     */
    function min(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x < y ? x : y;
    }
    
    /**
     * @dev Calculate maximum of two numbers
     */
    function max(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x > y ? x : y;
    }
    
    /**
     * @dev Calculate absolute difference between two numbers
     */
    function diff(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x > y ? x - y : y - x;
    }
    
    /**
     * @dev Calculate percentage (basis points)
     */
    function percentage(uint256 amount, uint256 basisPoints) internal pure returns (uint256) {
        return (amount * basisPoints) / 10000;
    }
    
    /**
     * @dev Calculate compound interest
     */
    function compound(uint256 principal, uint256 rate, uint256 periods) internal pure returns (uint256) {
        if (periods == 0) return principal;
        
        uint256 result = principal;
        for (uint256 i = 0; i < periods; i++) {
            result = add(result, percentage(result, rate));
        }
        
        return result;
    }
    
    /**
     * @dev Calculate simple interest
     */
    function simpleInterest(uint256 principal, uint256 rate, uint256 periods) internal pure returns (uint256) {
        return add(principal, percentage(principal, mul(rate, periods)));
    }
    
    /**
     * @dev Calculate utilization rate
     */
    function utilizationRate(uint256 borrowed, uint256 supplied) internal pure returns (uint256) {
        if (supplied == 0) return 0;
        return (borrowed * 10000) / supplied;
    }
    
    /**
     * @dev Calculate collateralization ratio
     */
    function collateralizationRatio(uint256 collateral, uint256 debt) internal pure returns (uint256) {
        if (debt == 0) return type(uint256).max;
        return (collateral * 10000) / debt;
    }
    
    /**
     * @dev Check if position is safe
     */
    function isPositionSafe(uint256 collateral, uint256 debt, uint256 minRatio) internal pure returns (bool) {
        if (debt == 0) return true;
        return collateralizationRatio(collateral, debt) >= minRatio;
    }
    
    /**
     * @dev Calculate liquidation amount
     */
    function calculateLiquidationAmount(uint256 debt, uint256 penalty) internal pure returns (uint256) {
        return add(debt, percentage(debt, penalty));
    }
    
    /**
     * @dev Calculate swap output amount (constant product AMM)
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "KaiaMath: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "KaiaMath: INSUFFICIENT_LIQUIDITY");
        
        uint256 amountInWithFee = mul(amountIn, sub(10000, fee));
        uint256 numerator = mul(amountInWithFee, reserveOut);
        uint256 denominator = add(mul(reserveIn, 10000), amountInWithFee);
        amountOut = div(numerator, denominator);
    }
    
    /**
     * @dev Calculate swap input amount (constant product AMM)
     */
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 fee
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, "KaiaMath: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "KaiaMath: INSUFFICIENT_LIQUIDITY");
        
        uint256 numerator = mul(mul(reserveIn, reserveOut), 10000);
        uint256 denominator = mul(sub(reserveOut, amountOut), sub(10000, fee));
        amountIn = add(div(numerator, denominator), 1);
    }
}
