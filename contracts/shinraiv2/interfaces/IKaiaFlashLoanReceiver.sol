// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IKaiaFlashLoanReceiver
 * @dev Interface for flash loan receivers following EIP-3156
 * @author Shinrai Protocol
 */
interface IKaiaFlashLoanReceiver {
    
    /**
     * @dev Receive a flash loan
     * @param initiator The address which initiated the flash loan
     * @param token The token being flash loaned
     * @param amount The amount of tokens loaned
     * @param fee The fee for the flash loan
     * @param data Arbitrary data structure passed from the initial call
     * @return The keccak256 hash of "ERC3156FlashBorrower.onFlashLoan"
     */
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32);
}