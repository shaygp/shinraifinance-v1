// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IKaiaLiquidation {
    
    struct Auction {
        bytes32 collateralId;
        address user;
        uint256 collateral;
        uint256 debt;
        uint256 startTime;
        uint256 endTime;
        bool active;
        address winner;
        uint256 winningBid;
    }
    
    struct Bid {
        uint256 amount;
        uint256 collateralAmount;
        uint256 timestamp;
    }
    
    // Events
    event AuctionStarted(bytes32 indexed auctionId, bytes32 indexed collateralId, address indexed user, uint256 collateral, uint256 debt);
    event BidPlaced(bytes32 indexed auctionId, address indexed bidder, uint256 bidAmount, uint256 collateralAmount);
    event AuctionSettled(bytes32 indexed auctionId, address indexed winner, uint256 collateralWon, uint256 debtPaid);
    event AuctionCancelled(bytes32 indexed auctionId);
    
    // Core functions
    function startAuction(bytes32 collateralId, address user) external returns (bytes32 auctionId);
    function placeBid(bytes32 auctionId, uint256 bidAmount) external;
    function settleAuction(bytes32 auctionId) external;
    function cancelAuction(bytes32 auctionId) external;
    
    // View functions
    function getAuction(bytes32 auctionId) external view returns (
        bytes32 collateralId,
        address user,
        uint256 collateral,
        uint256 debt,
        uint256 startTime,
        uint256 endTime,
        bool active,
        address winner,
        uint256 winningBid
    );
    function getBid(bytes32 auctionId, address bidder) external view returns (
        uint256 amount,
        uint256 collateralAmount,
        uint256 timestamp
    );
    
    // State variables
    function vault() external view returns (address);
    function auctions(bytes32) external view returns (Auction memory);
    function bids(bytes32, address) external view returns (Bid memory);
    
    // Constants
    function LIQUIDATION_PENALTY() external view returns (uint256);
    function LIQUIDATION_LOT_SIZE() external view returns (uint256);
    function MAX_AUCTION_DURATION() external view returns (uint256);
}
