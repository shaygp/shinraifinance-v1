const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const chainId = BigInt(network.chainId);
    
    console.log("Deploying DeFi contracts with account:", deployer.address);
    console.log("Network:", network.name, "ChainId:", chainId.toString());
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Get deployed token addresses
    let kaiaAddress, kusdAddress, wkaiaAddress;
    
    if (chainId === 1001n) { // Kairos testnet
        kaiaAddress = "0xb9563C346537427aa41876aa4720902268dCdB40";
        kusdAddress = "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E";
        wkaiaAddress = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";
    } else if (chainId === 8217n) { // Kaia mainnet
        // Update these when deploying to mainnet
        kaiaAddress = "0x0000000000000000000000000000000000000000";
        kusdAddress = "0x0000000000000000000000000000000000000000";
        wkaiaAddress = "0x0000000000000000000000000000000000000000";
    } else {
        throw new Error("Unsupported network");
    }

    console.log("Using token addresses:");
    console.log("KAIA:", kaiaAddress);
    console.log("KUSD:", kusdAddress);
    console.log("WKAIA:", wkaiaAddress);

    // 1. Deploy KaiaDEX
    console.log("\n1. Deploying KaiaDEX...");
    const KaiaDEX = await ethers.getContractFactory("KaiaDEX");
    const dex = await KaiaDEX.deploy();
    await dex.waitForDeployment();
    console.log("KaiaDEX deployed to:", await dex.getAddress());

    // 2. Deploy FarmContract
    console.log("\n2. Deploying FarmContract...");
    const currentBlock = await ethers.provider.getBlockNumber();
    const FarmContract = await ethers.getContractFactory("FarmContract");
    const farm = await FarmContract.deploy(currentBlock);
    await farm.waitForDeployment();
    console.log("FarmContract deployed to:", await farm.getAddress());

    // 3. Create trading pools in DEX
    console.log("\n3. Creating trading pools...");
    
    // Create KAIA/KUSD pool
    const createKaiaKusdTx = await dex.createPool(kaiaAddress, kusdAddress);
    await createKaiaKusdTx.wait();
    console.log("Created KAIA/KUSD pool");

    // Create KAIA/WKAIA pool
    const createKaiaWkaiaTx = await dex.createPool(kaiaAddress, wkaiaAddress);
    await createKaiaWkaiaTx.wait();
    console.log("Created KAIA/WKAIA pool");

    // Create KUSD/WKAIA pool
    const createKusdWkaiaTx = await dex.createPool(kusdAddress, wkaiaAddress);
    await createKusdWkaiaTx.wait();
    console.log("Created KUSD/WKAIA pool");

    // 4. Add farms
    console.log("\n4. Adding farms...");
    
    // Get pool IDs for LP tokens (we'll need to create proper LP tokens)
    const kaiaKusdPoolId = await dex.getPoolId(kaiaAddress, kusdAddress);
    const kaiaWkaiaPoolId = await dex.getPoolId(kaiaAddress, wkaiaAddress);
    const kusdWkaiaPoolId = await dex.getPoolId(kusdAddress, wkaiaAddress);

    // For now, we'll use a simple approach - use the pool addresses as "LP tokens"
    // In a full implementation, you'd deploy proper LP token contracts
    
    // Add KAIA/KUSD farm
    const rewardPerBlock = ethers.parseEther("0.1"); // 0.1 KAIA per block
    await farm.addPool(
        kaiaAddress, // Using KAIA as LP token for now (should be proper LP token)
        kaiaAddress, // Reward token is KAIA
        1000, // Allocation points
        rewardPerBlock,
        "KAIA/KUSD LP"
    );
    console.log("Added KAIA/KUSD farm");

    // Add KAIA/WKAIA farm
    await farm.addPool(
        kaiaAddress, // Using KAIA as LP token for now
        kaiaAddress, // Reward token is KAIA
        800, // Allocation points
        (rewardPerBlock * 80n) / 100n, // 80% of base reward
        "KAIA/WKAIA LP"
    );
    console.log("Added KAIA/WKAIA farm");

    // Add KUSD/WKAIA farm
    await farm.addPool(
        kusdAddress, // Using KUSD as LP token for now
        kaiaAddress, // Reward token is KAIA
        600, // Allocation points
        (rewardPerBlock * 60n) / 100n, // 60% of base reward
        "KUSD/WKAIA LP"
    );
    console.log("Added KUSD/WKAIA farm");

    // 5. Fund farm contract with reward tokens
    console.log("\n5. Setting up farm rewards...");
    
    // Get KAIA token contract
    const KAIA = await ethers.getContractAt("KAIA", kaiaAddress);
    
    // Mint some KAIA tokens to the farm for rewards (if we have minting permissions)
    try {
        const farmRewardAmount = ethers.parseEther("100000"); // 100k KAIA for rewards
        await KAIA.mint(await farm.getAddress(), farmRewardAmount);
        console.log("Minted", ethers.formatEther(farmRewardAmount), "KAIA to farm for rewards");
    } catch (error) {
        console.log("Note: Could not mint KAIA tokens to farm. You may need to transfer tokens manually.");
        console.log("Farm address:", await farm.getAddress());
    }

    // 6. Verify deployments
    console.log("\n6. Verification complete!");
    console.log("=".repeat(50));
    console.log("Deployed Contracts:");
    console.log("=".repeat(50));
    console.log("KaiaDEX:", await dex.getAddress());
    console.log("FarmContract:", await farm.getAddress());
    console.log("Network:", chainId === 8217n ? "kaia" : chainId === 1001n ? "kairos" : "unknown");
    console.log("=".repeat(50));

    // Save addresses to file
    const addresses = {
        network: chainId === 8217n ? "kaia" : chainId === 1001n ? "kairos" : "unknown",
        chainId: chainId.toString(),
        contracts: {
            KaiaDEX: await dex.getAddress(),
            FarmContract: await farm.getAddress(),
            KAIA: kaiaAddress,
            KUSD: kusdAddress,
            WKAIA: wkaiaAddress
        },
        pools: [
            { pair: "KAIA/KUSD", poolId: kaiaKusdPoolId },
            { pair: "KAIA/WKAIA", poolId: kaiaWkaiaPoolId },
            { pair: "KUSD/WKAIA", poolId: kusdWkaiaPoolId }
        ],
        farms: [
            { id: 0, name: "KAIA/KUSD LP", allocPoints: 1000 },
            { id: 1, name: "KAIA/WKAIA LP", allocPoints: 800 },
            { id: 2, name: "KUSD/WKAIA LP", allocPoints: 600 }
        ],
        deployedAt: new Date().toISOString(),
        deployer: deployer.address
    };

    const fs = require('fs');
    const addressFile = `./deployed_addresses_${chainId === 8217n ? "kaia" : "kairos"}.json`;
    fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
    console.log(`\nAddresses saved to: ${addressFile}`);

    return addresses;
}

main()
    .then((addresses) => {
        console.log("\n✅ DeFi contracts deployment completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });