// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKaiaSurplus.sol";
import "./interfaces/IKaiaVault.sol";

/**
 * @title KaiaSurplus
 * @dev Surplus management for Shinrai Protocol on Kaia blockchain
 * @author Shinrai Protocol
 */
contract KaiaSurplus is IKaiaSurplus, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Core contracts with override declaration
    address public override vault;
    
    // Surplus parameters
    uint256 public constant SURPLUS_BUFFER = 1000e18; // 1000 KUSD buffer
    uint256 public constant SURPLUS_LOT_SIZE = 100e18; // 100 KUSD lot size
    uint256 public constant MAX_SURPLUS_AUCTION_DURATION = 6 hours;
    
    // Surplus state
    uint256 public totalSurplus;
    uint256 public totalDeficit;
    uint256 public lastSurplusTime;
    
    // Surplus auctions with override declaration
    mapping(uint256 => SurplusAuction) public override surplusAuctions;
    uint256 public surplusAuctionCount;
    
    // Events are defined in interface to avoid duplication
    
    constructor(address _vault) {
        vault = _vault;
        lastSurplusTime = block.timestamp;
    }
    
    /**
     * @dev Accumulate surplus from vault operations
     */
    function accumulateSurplus(uint256 amount) external onlyOwner {
        require(amount > 0, "KaiaSurplus: Invalid amount");
        
        totalSurplus += amount;
        lastSurplusTime = block.timestamp;
        
        emit SurplusAccumulated(amount, block.timestamp);
        
        // Start surplus auction if buffer is exceeded
        if (totalSurplus > SURPLUS_BUFFER) {
            _startSurplusAuction();
        }
    }
    
    /**
     * @dev Accumulate deficit from vault operations
     */
    function accumulateDeficit(uint256 amount) external onlyOwner {
        require(amount > 0, "KaiaSurplus: Invalid amount");
        
        totalDeficit += amount;
        
        emit DeficitAccumulated(amount, block.timestamp);
    }
    
    /**
     * @dev Start surplus auction
     */
    function _startSurplusAuction() internal {
        uint256 auctionAmount = totalSurplus - SURPLUS_BUFFER;
        require(auctionAmount >= SURPLUS_LOT_SIZE, "KaiaSurplus: Amount too small");
        
        surplusAuctionCount++;
        uint256 auctionId = surplusAuctionCount;
        
        surplusAuctions[auctionId] = SurplusAuction({
            amount: auctionAmount,
            startTime: block.timestamp,
            endTime: block.timestamp + MAX_SURPLUS_AUCTION_DURATION,
            active: true,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        totalSurplus -= auctionAmount;
        
        emit SurplusAuctionStarted(auctionId, auctionAmount, block.timestamp);
    }
    
    /**
     * @dev Bid on surplus auction
     */
    function bidOnSurplus(uint256 auctionId) external payable nonReentrant whenNotPaused {
        SurplusAuction storage auction = surplusAuctions[auctionId];
        require(auction.active, "KaiaSurplus: Auction not active");
        require(block.timestamp < auction.endTime, "KaiaSurplus: Auction ended");
        require(msg.value > auction.highestBid, "KaiaSurplus: Bid too low");
        
        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        
        // Update auction state
        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;
        
        emit SurplusAuctionBid(auctionId, msg.sender, msg.value);
    }
    
    /**
     * @dev Settle surplus auction
     */
    function settleSurplusAuction(uint256 auctionId) external nonReentrant whenNotPaused {
        SurplusAuction storage auction = surplusAuctions[auctionId];
        require(auction.active, "KaiaSurplus: Auction not active");
        require(block.timestamp >= auction.endTime, "KaiaSurplus: Auction not ended");
        require(auction.highestBidder != address(0), "KaiaSurplus: No bids");
        
        // Transfer surplus USDT to winner
        IERC20 usdtToken = IERC20(0x0236E4DA096053856Cb659d628D7012Cdf4b2985); // USDT on Kairos
        usdtToken.safeTransfer(auction.highestBidder, auction.amount);
        
        // Mark auction as settled
        auction.active = false;
        
        emit SurplusAuctionSettled(auctionId, auction.highestBidder, auction.amount);
    }
    
    /**
     * @dev Get surplus auction information
     */
    function getSurplusAuction(uint256 auctionId) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 endTime,
        bool active,
        uint256 highestBid,
        address highestBidder
    ) {
        SurplusAuction memory auction = surplusAuctions[auctionId];
        return (
            auction.amount,
            auction.startTime,
            auction.endTime,
            auction.active,
            auction.highestBid,
            auction.highestBidder
        );
    }
    
    /**
     * @dev Get surplus statistics
     */
    function getSurplusStats() external view returns (
        uint256 _totalSurplus,
        uint256 _totalDeficit,
        uint256 _lastSurplusTime,
        uint256 _surplusAuctionCount
    ) {
        return (totalSurplus, totalDeficit, lastSurplusTime, surplusAuctionCount);
    }
    
    /**
     * @dev Check if surplus auction should be started
     */
    function shouldStartSurplusAuction() external view returns (bool) {
        return totalSurplus > SURPLUS_BUFFER && (totalSurplus - SURPLUS_BUFFER) >= SURPLUS_LOT_SIZE;
    }
    
    // Admin functions
    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
    
    function emergencyWithdrawETH(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }
    
    // Receive function for ETH
    receive() external payable {}
}
