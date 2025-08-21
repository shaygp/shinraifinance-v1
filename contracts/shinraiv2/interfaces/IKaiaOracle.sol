// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKaiaOracle {
    
    /**
     * @dev Get the price of a token in KUSD (with 18 decimals)
     * @param token The token address to get price for
     * @return price The price of the token in KUSD
     * @return timestamp The timestamp when the price was last updated
     */
    function getPrice(address token) external view returns (uint256 price, uint256 timestamp);
    
    /**
     * @dev Get the price of a token pair
     * @param base The base token address
     * @param quote The quote token address
     * @return price The price of base in terms of quote
     * @return timestamp The timestamp when the price was last updated
     */
    function getPricePair(address base, address quote) external view returns (uint256 price, uint256 timestamp);
    
    /**
     * @dev Check if a price is stale
     * @param token The token address
     * @return True if the price is stale
     */
    function isPriceStale(address token) external view returns (bool);
    
    /**
     * @dev Get the last update time for a token
     * @param token The token address
     * @return timestamp The last update timestamp
     */
    function getLastUpdateTime(address token) external view returns (uint256 timestamp);
    
    /**
     * @dev Get the heartbeat interval for price updates
     * @return interval The heartbeat interval in seconds
     */
    function getHeartbeat() external view returns (uint256 interval);
    
    /**
     * @dev Check if the oracle is paused
     * @return True if the oracle is paused
     */
    function paused() external view returns (bool);
}
