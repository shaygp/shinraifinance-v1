// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IKaiaLiquidation.sol";
import "./interfaces/IKaiaVault.sol";

/**
 * @title KaiaLiquidation
 * @dev Liquidation mechanism for Shinrai Protocol on Kaia blockchain
 * @author Shinrai Protocol
 */
contract KaiaLiquidation is IKaiaLiquidation, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // Core contracts with override declarations
    address public override vault;
    
    // Liquidation parameters
    uint256 public constant LIQUIDATION_PENALTY = 1300; // 13% in basis points
    uint256 public constant LIQUIDATION_LOT_SIZE = 1000; // 1000 tokens minimum
    uint256 public constant MAX_AUCTION_DURATION = 3 hours;
    
    // Auction state 
    mapping(bytes32 => Auction) public auctions;
    mapping(bytes32 => mapping(address => Bid)) public bids;
    
    // Current auction ID counter
    uint256 private auctionCounter;
    
    // Events not in interface
    event VaultUpdated(address indexed vault);
    event AuctionFinalized(bytes32 indexed auctionId, address indexed winner, uint256 amount);
    event EmergencyWithdraw(address indexed token, uint256 amount);
    
    constructor(address _vault) {
        vault = _vault;
    }
    
    /**
     * @dev Start liquidation auction for an unsafe position
     */
    function startAuction(
        bytes32 collateralId,
        address user
    ) external onlyOwner nonReentrant whenNotPaused returns (bytes32 auctionId) {
        IKaiaVault vaultContract = IKaiaVault(vault);
        (,,,,, bool active,,) = vaultContract.getCollateralType(collateralId);
        require(active, "KaiaLiquidation: Invalid collateral type");
        
        // Check if position is unsafe
        require(!vaultContract.isPositionSafe(collateralId, user, 0), "KaiaLiquidation: Position is safe");
        
        // Get position details
        (uint256 collateral, uint256 debt,,) = vaultContract.getPosition(collateralId, user);
        require(collateral > 0 && debt > 0, "KaiaLiquidation: No position to liquidate");
        
        // Generate auction ID
        auctionId = keccak256(abi.encodePacked(block.timestamp, auctionCounter++, user, collateralId));
        
        // Create auction (matching interface struct)
        auctions[auctionId] = Auction({
            collateralId: collateralId,
            user: user,
            collateral: collateral,
            debt: debt,
            startTime: block.timestamp,
            endTime: block.timestamp + MAX_AUCTION_DURATION,
            active: true,
            winner: address(0),
            winningBid: 0
        });
        
        emit AuctionStarted(auctionId, collateralId, user, collateral, debt);
        return auctionId;
    }
    
    /**
     * @dev Place a bid on an auction
     */
    function placeBid(
        bytes32 auctionId,
        uint256 bidAmount
    ) external nonReentrant whenNotPaused {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "KaiaLiquidation: Auction not active");
        require(block.timestamp < auction.endTime, "KaiaLiquidation: Auction ended");
        require(bidAmount > auction.winningBid, "KaiaLiquidation: Bid too low");
        
        // Transfer USDT from bidder
        IERC20 usdtToken = IERC20(0x0236E4DA096053856Cb659d628D7012Cdf4b2985); // USDT on Kairos (fixed checksum)
        usdtToken.safeTransferFrom(msg.sender, address(this), bidAmount);
        
        // Return previous bid if exists
        if (auction.winner != address(0)) {
            usdtToken.safeTransfer(auction.winner, auction.winningBid);
        }
        
        // Update auction
        auction.winningBid = bidAmount;
        auction.winner = msg.sender;
        
        // Store bid (matching interface struct)
        bids[auctionId][msg.sender] = Bid({
            amount: bidAmount,
            collateralAmount: auction.collateral,
            timestamp: block.timestamp
        });
        
        emit BidPlaced(auctionId, msg.sender, bidAmount, auction.collateral);
    }
    
    /**
     * @dev Settle auction (implementing interface)
     */
    function settleAuction(bytes32 auctionId) external nonReentrant whenNotPaused {
        finalizeAuction(auctionId);
    }
    
    /**
     * @dev Cancel auction
     */
    function cancelAuction(bytes32 auctionId) external onlyOwner nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "KaiaLiquidation: Auction not active");
        
        auction.active = false;
        emit AuctionCancelled(auctionId);
    }
    
    /**
     * @dev Get auction (implementing interface)
     */
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
    ) {
        Auction memory auction = auctions[auctionId];
        return (
            auction.collateralId,
            auction.user,
            auction.collateral,
            auction.debt,
            auction.startTime,
            auction.endTime,
            auction.active,
            auction.winner,
            auction.winningBid
        );
    }
    
    /**
     * @dev Get bid (implementing interface)
     */
    function getBid(bytes32 auctionId, address bidder) external view returns (
        uint256 amount,
        uint256 collateralAmount,
        uint256 timestamp
    ) {
        Bid memory bid = bids[auctionId][bidder];
        return (bid.amount, bid.collateralAmount, bid.timestamp);
    }
    
    /**
     * @dev Finalize auction (internal)
     */
    function finalizeAuction(bytes32 auctionId) internal {
        Auction storage auction = auctions[auctionId];
        require(auction.active, "KaiaLiquidation: Auction not active");
        require(block.timestamp >= auction.endTime, "KaiaLiquidation: Auction still ongoing");
        
        auction.active = false;
        
        if (auction.winner != address(0)) {
            // Transfer collateral to highest bidder
            // Note: This is simplified - in production, you'd transfer actual collateral tokens
            
            // Pay debt to vault
            // Note: This is simplified - in production, you'd interact with the vault to clear debt
            
            emit AuctionSettled(auctionId, auction.winner, auction.collateral, auction.debt);
        } else {
            emit AuctionCancelled(auctionId);
        }
    }
    
    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
        emit EmergencyWithdraw(token, amount);
    }
    
    /**
     * @dev Get auction info
     */
    function getAuctionInfo(bytes32 auctionId) external view returns (
        bytes32 collateralId,
        address user,
        uint256 collateral,
        uint256 debt,
        uint256 startTime,
        uint256 endTime,
        address winner,
        uint256 winningBid,
        bool active
    ) {
        Auction memory auction = auctions[auctionId];
        return (
            auction.collateralId,
            auction.user,
            auction.collateral,
            auction.debt,
            auction.startTime,
            auction.endTime,
            auction.winner,
            auction.winningBid,
            auction.active
        );
    }
    
    /**
     * @dev Set vault address
     */
    function setVault(address _vault) external onlyOwner {
        vault = _vault;
        emit VaultUpdated(_vault);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}