const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Working Contracts to Kaia Kairos Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Token addresses on Kaia Kairos
  const KAIA_TOKEN = "0xb9563C346537427aa41876aa4720902268dCdB40";
  const KUSD_TOKEN = "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E";
  const WKAIA_TOKEN = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";

  const deployedContracts = {};

  try {
    // 1. Deploy KaiaDEX
    console.log("📦 1. Deploying KaiaDEX...");
    const KaiaDEX = await ethers.getContractFactory("KaiaDEX");
    const dex = await KaiaDEX.deploy();
    await dex.waitForDeployment();
    deployedContracts.dex = await dex.getAddress();
    console.log("✅ KaiaDEX deployed at:", deployedContracts.dex);

    // 2. Deploy FarmContract
    console.log("📦 2. Deploying FarmContract...");
    const currentBlock = await ethers.provider.getBlockNumber();
    const FarmContract = await ethers.getContractFactory("FarmContract");
    const farm = await FarmContract.deploy(currentBlock);
    await farm.waitForDeployment();
    deployedContracts.farm = await farm.getAddress();
    console.log("✅ FarmContract deployed at:", deployedContracts.farm);

    // 3. Deploy StakingContract
    console.log("📦 3. Deploying StakingContract...");
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const staking = await StakingContract.deploy(KAIA_TOKEN);
    await staking.waitForDeployment();
    deployedContracts.staking = await staking.getAddress();
    console.log("✅ StakingContract deployed at:", deployedContracts.staking);

    // 4. Deploy LendingContract
    console.log("📦 4. Deploying LendingContract...");
    const LendingContract = await ethers.getContractFactory("LendingContract");
    const lending = await LendingContract.deploy();
    await lending.waitForDeployment();
    deployedContracts.lending = await lending.getAddress();
    console.log("✅ LendingContract deployed at:", deployedContracts.lending);

    // 5. Try deploying KaiaOracle (if it compiles)
    try {
      console.log("📦 5. Deploying KaiaOracle...");
      const KaiaOracle = await ethers.getContractFactory("KaiaOracle");
      const oracle = await KaiaOracle.deploy();
      await oracle.waitForDeployment();
      deployedContracts.oracle = await oracle.getAddress();
      console.log("✅ KaiaOracle deployed at:", deployedContracts.oracle);
    } catch (error) {
      console.log("⚠️ KaiaOracle deployment failed, skipping...");
    }

    // 6. Try deploying KaiaVault (if it compiles)
    try {
      console.log("📦 6. Deploying KaiaVault...");
      const KaiaVault = await ethers.getContractFactory("KaiaVault");
      const vault = await KaiaVault.deploy(
        deployedContracts.oracle || "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000400", // addressBook
        "0x8Fe0f06DF2C95B8D5D9D4232405614E505Ab04C0", // stakingTracker
        "0x84214CEC245D752A9F2faF355b59DDf7f58A6EDb"  // govParam
      );
      await vault.waitForDeployment();
      deployedContracts.vault = await vault.getAddress();
      console.log("✅ KaiaVault deployed at:", deployedContracts.vault);
    } catch (error) {
      console.log("⚠️ KaiaVault deployment failed, skipping...");
    }

    console.log("\n⚙️ Configuring contracts...");

    // Configure DEX pools
    console.log("- Creating trading pools...");
    await dex.createPool(KAIA_TOKEN, KUSD_TOKEN);
    await dex.createPool(KAIA_TOKEN, WKAIA_TOKEN);
    await dex.createPool(KUSD_TOKEN, WKAIA_TOKEN);
    console.log("✅ Created 3 trading pools");

    // Configure farm
    console.log("- Adding farms...");
    const rewardPerBlock = ethers.parseEther("0.1");
    await farm.addPool(KAIA_TOKEN, KAIA_TOKEN, 1000, rewardPerBlock, "KAIA/KUSD LP");
    await farm.addPool(KAIA_TOKEN, KAIA_TOKEN, 800, (rewardPerBlock * 80n) / 100n, "KAIA/WKAIA LP");
    await farm.addPool(KUSD_TOKEN, KAIA_TOKEN, 600, (rewardPerBlock * 60n) / 100n, "KUSD/WKAIA LP");
    console.log("✅ Added 3 farm pools");

    // Configure lending
    console.log("- Configuring lending tokens...");
    await lending.addToken(KAIA_TOKEN, true, true, 8000, 8500, 500);
    await lending.addToken(KUSD_TOKEN, false, true, 0, 0, 300);
    await lending.addToken(WKAIA_TOKEN, true, true, 7500, 8000, 600);
    console.log("✅ Configured lending tokens");

    console.log("\n✅ All working contracts deployed and configured!");
    console.log("\n📋 Deployment Summary:");
    console.log("=====================================");
    
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(20)}: ${address}`);
    });

    // Save addresses to file
    const fs = require('fs');
    const addressData = {
      network: "kairos",
      chainId: "1001",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        ...deployedContracts,
        KAIA: KAIA_TOKEN,
        KUSD: KUSD_TOKEN,
        WKAIA: WKAIA_TOKEN
      }
    };
    
    fs.writeFileSync(
      './deployed_addresses_kairos_working.json', 
      JSON.stringify(addressData, null, 2)
    );
    
    console.log("\n💾 Addresses saved to deployed_addresses_kairos_working.json");
    console.log("🎉 Deployment completed successfully!");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });