// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKaiaRates {
    
    /**
     * @dev Calculate interest rate based on utilization
     * @param collateralId The collateral type identifier
     * @param utilization The utilization rate (0-10000 basis points)
     * @return The calculated interest rate in basis points
     */
    function calculateRate(bytes32 collateralId, uint256 utilization) external view returns (uint256);
}
