const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const chainId = BigInt(network.chainId);
    
    console.log("Deploying Lending contract with account:", deployer.address);
    console.log("Network:", network.name, "ChainId:", chainId.toString());
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Token addresses (Kairos testnet)
    const kaiaAddress = "0xb9563C346537427aa41876aa4720902268dCdB40";
    const kusdAddress = "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E";
    const wkaiaAddress = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";

    console.log("\n=== Deploying Lending Contract ===");
    const LendingContract = await ethers.getContractFactory("LendingContract");
    const lending = await LendingContract.deploy();
    await lending.waitForDeployment();
    console.log("LendingContract deployed to:", await lending.getAddress());

    console.log("\n=== Configuring Tokens ===");
    
    // Configure KAIA as collateral and borrowable
    await lending.addToken(
        kaiaAddress,
        true,  // isCollateral
        true,  // isBorrowable
        8000,  // 80% LTV
        8500,  // 85% liquidation threshold
        500    // 5% borrow rate
    );
    console.log("Configured KAIA token");

    // Configure KUSD as collateral and borrowable
    await lending.addToken(
        kusdAddress,
        true,  // isCollateral
        true,  // isBorrowable
        9000,  // 90% LTV (stablecoin, higher LTV)
        9300,  // 93% liquidation threshold
        300    // 3% borrow rate
    );
    console.log("Configured KUSD token");

    // Configure WKAIA as collateral and borrowable
    await lending.addToken(
        wkaiaAddress,
        true,  // isCollateral
        true,  // isBorrowable
        8000,  // 80% LTV
        8500,  // 85% liquidation threshold
        500    // 5% borrow rate
    );
    console.log("Configured WKAIA token");

    console.log("\n=== Providing Initial Liquidity ===");
    // Get token contracts
    const kaia = await ethers.getContractAt("KAIA", kaiaAddress);
    const kusd = await ethers.getContractAt("KUSD", kusdAddress);

    // Supply initial liquidity to the lending pool
    const supplyAmount = ethers.parseEther("50000"); // Supply 50k of each token

    try {
        // Approve lending contract to spend tokens
        await kaia.approve(await lending.getAddress(), supplyAmount);
        await kusd.approve(await lending.getAddress(), supplyAmount);

        // Supply tokens to lending pool
        await lending.supply(kaiaAddress, supplyAmount);
        console.log("Supplied", ethers.formatEther(supplyAmount), "KAIA to lending pool");

        await lending.supply(kusdAddress, supplyAmount);
        console.log("Supplied", ethers.formatEther(supplyAmount), "KUSD to lending pool");
        
    } catch (error) {
        console.log("Could not supply initial liquidity:", error.reason || error.message);
    }

    console.log("\n=== Deployment Complete ===");
    console.log("=".repeat(50));
    console.log("LendingContract:", await lending.getAddress());
    console.log("Network:", chainId === 8217n ? "kaia" : chainId === 1001n ? "kairos" : "unknown");
    console.log("=".repeat(50));

    // Update addresses file
    const fs = require('fs');
    let addresses = {};
    
    // Read existing addresses if file exists
    const addressFile = `./deployed_addresses_${chainId === 8217n ? "kaia" : "kairos"}.json`;
    try {
        const existingData = fs.readFileSync(addressFile, 'utf8');
        addresses = JSON.parse(existingData);
    } catch (error) {
        console.log("Creating new address file");
        addresses = {
            network: chainId === 8217n ? "kaia" : chainId === 1001n ? "kairos" : "unknown",
            chainId: chainId.toString(),
            contracts: {},
            deployedAt: new Date().toISOString(),
            deployer: deployer.address
        };
    }

    // Add lending contract address
    addresses.contracts.LendingContract = await lending.getAddress();
    addresses.lastUpdated = new Date().toISOString();

    // Save updated addresses
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log(`\nAddresses updated in: ${addressFile}`);

    return addresses;
}

main()
    .then((addresses) => {
        console.log("\n✅ Lending contract deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Lending deployment failed:", error);
        process.exit(1);
    });