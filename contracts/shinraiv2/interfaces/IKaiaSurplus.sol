// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKaiaSurplus {
    
    struct SurplusAuction {
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 highestBid;
        address highestBidder;
    }
    
    // Events
    event SurplusAccumulated(uint256 amount, uint256 timestamp);
    event SurplusAuctionStarted(uint256 indexed auctionId, uint256 amount, uint256 startTime);
    event SurplusAuctionBid(uint256 indexed auctionId, address indexed bidder, uint256 bidAmount);
    event SurplusAuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 amount);
    event DeficitAccumulated(uint256 amount, uint256 timestamp);
    
    // Core functions
    function accumulateSurplus(uint256 amount) external;
    function accumulateDeficit(uint256 amount) external;
    function bidOnSurplus(uint256 auctionId) external payable;
    function settleSurplusAuction(uint256 auctionId) external;
    
    // View functions
    function getSurplusAuction(uint256 auctionId) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        bool active,
        uint256 highestBid,
        address highestBidder
    );
    function getSurplusStats() external view returns (
        uint256 _totalSurplus,
        uint256 _totalDeficit,
        uint256 _lastSurplusTime,
        uint256 _surplusAuctionCount
    );
    function shouldStartSurplusAuction() external view returns (bool);
    
    // State variables
    function vault() external view returns (address);
    function totalSurplus() external view returns (uint256);
    function totalDeficit() external view returns (uint256);
    function lastSurplusTime() external view returns (uint256);
    function surplusAuctionCount() external view returns (uint256);
    function surplusAuctions(uint256) external view returns (SurplusAuction memory);
    
    // Constants
    function SURPLUS_BUFFER() external view returns (uint256);
    function SURPLUS_LOT_SIZE() external view returns (uint256);
    function MAX_SURPLUS_AUCTION_DURATION() external view returns (uint256);
}
