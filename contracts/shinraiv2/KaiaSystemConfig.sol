// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KaiaSystemConfig
 * @dev Configuration contract for Kaia blockchain system contract addresses
 * @author Shinrai Protocol
 */
contract KaiaSystemConfig is Ownable {
    
    // Kaia system contract addresses
    address public addressBook;
    address public govParam;
    address public stakingTracker;
    address public clRegistry;
    address public treasury;
    address public kvc;
    address public kff;
    address public kcf;
    address public kif;
    address public kef;
    
    // Network identifier
    string public networkName;
    
    // Events
    event SystemContractUpdated(string contractName, address oldAddress, address newAddress);
    event NetworkUpdated(string oldNetwork, string newNetwork);
    
    constructor(string memory _networkName) {
        networkName = _networkName;
        setDefaultAddresses();
    }
    
    /**
     * @dev Set default addresses based on network
     */
    function setDefaultAddresses() internal {
        if (keccak256(abi.encodePacked(networkName)) == keccak256(abi.encodePacked("kairos"))) {
            // Kairos testnet addresses
            addressBook = 0x0000000000000000000000000000000000000400;
            govParam = 0x84214CEC245D752A9F2faF355b59DDf7f58A6EDb;
            stakingTracker = 0x8Fe0f06DF2C95B8D5D9D4232405614E505Ab04C0;
            clRegistry = 0x25F4044c655Fc7B23c62bbC78ceF3B4EBFb4e478;
            treasury = 0xD5ad6D61Dd87EdabE2332607C328f5cc96aeCB95;
            kvc = 0xaa8d19a5e17e9e1bA693f13aB0E079d274a7e51E;
            kff = 0x8B537f5BC7d176a94D7bF63BeFB81586EB3D1c0E;
            kcf = 0x47E3DbB8c1602BdB0DAeeE89Ce59452c4746CA1C;
            kif = 0x8436e5BD1A6D622c278c946E2F8988a26136A16F;
            kef = 0x819d4b7245164e6A94341F4b5C2ae587372BB669;
        } else if (keccak256(abi.encodePacked(networkName)) == keccak256(abi.encodePacked("kaia"))) {
            // Kaia mainnet addresses
            addressBook = 0x0000000000000000000000000000000000000400;
            govParam = 0x362976Cc2Ef6751DE6bf6008e3E90e1e02deCa51;
            stakingTracker = 0x9b8688d616D3D5180d29520c6a0E28582E82BF4d;
            clRegistry = 0x25F4044c655Fc7B23c62bbC78ceF3B4EBFb4e478;
            treasury = 0xD5ad6D61Dd87EdabE2332607C328f5cc96aeCB95;
            kvc = 0x4f04251064274252D27D4af55BC85b68B3adD992;
            kff = 0x85D82D811743b4B8F3c48F3e48A1664d1FfC2C10;
            kcf = 0xdd4C8d805fC110369D3B148a6692F283ffBDCcd3;
            kif = 0x440372e3cE41a85b7B5A6091c232470d186367D5;
            kef = 0x2D493DC06B73CF8Dede958FABBC9d62C31fA0926;
        }
    }
    
    /**
     * @dev Update system contract address
     */
    function updateSystemContract(string memory contractName, address newAddress) external onlyOwner {
        require(newAddress != address(0), "KaiaSystemConfig: Invalid address");
        
        address oldAddress;
        
        if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("addressBook"))) {
            oldAddress = addressBook;
            addressBook = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("govParam"))) {
            oldAddress = govParam;
            govParam = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("stakingTracker"))) {
            oldAddress = stakingTracker;
            stakingTracker = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("clRegistry"))) {
            oldAddress = clRegistry;
            clRegistry = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("treasury"))) {
            oldAddress = treasury;
            treasury = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("kvc"))) {
            oldAddress = kvc;
            kvc = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("kff"))) {
            oldAddress = kff;
            kff = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("kcf"))) {
            oldAddress = kcf;
            kcf = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("kif"))) {
            oldAddress = kif;
            kif = newAddress;
        } else if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("kef"))) {
            oldAddress = kef;
            kef = newAddress;
        } else {
            revert("KaiaSystemConfig: Unknown contract name");
        }
        
        emit SystemContractUpdated(contractName, oldAddress, newAddress);
    }
    
    /**
     * @dev Update network name and reset addresses
     */
    function updateNetwork(string memory newNetwork) external onlyOwner {
        string memory oldNetwork = networkName;
        networkName = newNetwork;
        setDefaultAddresses();
        emit NetworkUpdated(oldNetwork, newNetwork);
    }
    
    /**
     * @dev Get all system contract addresses
     */
    function getAllAddresses() external view returns (
        address _addressBook,
        address _govParam,
        address _stakingTracker,
        address _clRegistry,
        address _treasury,
        address _kvc,
        address _kff,
        address _kcf,
        address _kif,
        address _kef
    ) {
        return (
            addressBook,
            govParam,
            stakingTracker,
            clRegistry,
            treasury,
            kvc,
            kff,
            kcf,
            kif,
            kef
        );
    }
    
    /**
     * @dev Check if address is a system contract
     */
    function isSystemContract(address contractAddress) external view returns (bool) {
        return (
            contractAddress == addressBook ||
            contractAddress == govParam ||
            contractAddress == stakingTracker ||
            contractAddress == clRegistry ||
            contractAddress == treasury ||
            contractAddress == kvc ||
            contractAddress == kff ||
            contractAddress == kcf ||
            contractAddress == kif ||
            contractAddress == kef
        );
    }
}
