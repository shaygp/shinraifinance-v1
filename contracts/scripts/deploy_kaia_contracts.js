const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Shinrai Protocol to Kaia Kairos Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Contract addresses on Kaia Kairos
  const KAIA_TOKEN = "0xb9563C346537427aa41876aa4720902268dCdB40";
  const USDT_TOKEN = "0x0236e4da096053856cb659d628d7012cdf4b2985";
  const WKAIA_TOKEN = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";

  // Kaia system contracts
  const STAKING_TRACKER = "0x8Fe0f06DF2C95B8D5D9D4232405614E505Ab04C0";
  const GOV_PARAM = "0x84214cec245d752a9f2faf355b59ddf7f58a6edb";
  const CL_REGISTRY = "0x25F4044c655Fc7B23c62bbC78ceF3B4EBFb4e478";

  const deployedContracts = {};

  try {
    console.log("📦 1. Deploying KaiaSystemConfig...");
    const KaiaSystemConfig = await ethers.getContractFactory("KaiaSystemConfig");
    const systemConfig = await KaiaSystemConfig.deploy("kairos");
    await systemConfig.deployed();
    deployedContracts.systemConfig = systemConfig.address;
    console.log("✅ KaiaSystemConfig deployed at:", systemConfig.address);

    console.log("📦 2. Deploying KaiaOracle...");
    const KaiaOracle = await ethers.getContractFactory("KaiaOracle");
    const oracle = await KaiaOracle.deploy();
    await oracle.deployed();
    deployedContracts.oracle = oracle.address;
    console.log("✅ KaiaOracle deployed at:", oracle.address);

    console.log("📦 3. Deploying KaiaRates...");
    const KaiaRates = await ethers.getContractFactory("KaiaRates");
    const rates = await KaiaRates.deploy();
    await rates.deployed();
    deployedContracts.rates = rates.address;
    console.log("✅ KaiaRates deployed at:", rates.address);

    console.log("📦 4. Deploying KaiaVault...");
    const KaiaVault = await ethers.getContractFactory("KaiaVault");
    const vault = await KaiaVault.deploy();
    await vault.deployed();
    deployedContracts.vault = vault.address;
    console.log("✅ KaiaVault deployed at:", vault.address);

    console.log("📦 5. Deploying KaiaJoin...");
    const KaiaJoin = await ethers.getContractFactory("KaiaJoin");
    const join = await KaiaJoin.deploy(vault.address);
    await join.deployed();
    deployedContracts.join = join.address;
    console.log("✅ KaiaJoin deployed at:", join.address);

    console.log("📦 6. Deploying KaiaLiquidation...");
    const KaiaLiquidation = await ethers.getContractFactory("KaiaLiquidation");
    const liquidation = await KaiaLiquidation.deploy(vault.address);
    await liquidation.deployed();
    deployedContracts.liquidation = liquidation.address;
    console.log("✅ KaiaLiquidation deployed at:", liquidation.address);

    console.log("📦 7. Deploying KaiaPSM...");
    const KaiaPSM = await ethers.getContractFactory("KaiaPSM");
    const psm = await KaiaPSM.deploy(
      KAIA_TOKEN, // Using KAIA as stablecoin for now
      USDT_TOKEN,
      oracle.address,
      deployer.address // Fee collector
    );
    await psm.deployed();
    deployedContracts.psm = psm.address;
    console.log("✅ KaiaPSM deployed at:", psm.address);

    console.log("📦 8. Deploying KaiaFlashLoan...");
    const KaiaFlashLoan = await ethers.getContractFactory("KaiaFlashLoan");
    const flashLoan = await KaiaFlashLoan.deploy(deployer.address); // Fee collector
    await flashLoan.deployed();
    deployedContracts.flashLoan = flashLoan.address;
    console.log("✅ KaiaFlashLoan deployed at:", flashLoan.address);

    console.log("📦 9. Deploying KaiaInteraction...");
    const KaiaInteraction = await ethers.getContractFactory("KaiaInteraction");
    const interaction = await KaiaInteraction.deploy(
      vault.address,
      KAIA_TOKEN,
      USDT_TOKEN,
      WKAIA_TOKEN,
      STAKING_TRACKER,
      GOV_PARAM,
      CL_REGISTRY
    );
    await interaction.deployed();
    deployedContracts.interaction = interaction.address;
    console.log("✅ KaiaInteraction deployed at:", interaction.address);

    console.log("📦 10. Deploying existing DeFi contracts...");
    
    // Deploy DEX
    const KaiaDEX = await ethers.getContractFactory("KaiaDEX");
    const dex = await KaiaDEX.deploy();
    await dex.deployed();
    deployedContracts.dex = dex.address;
    console.log("✅ KaiaDEX deployed at:", dex.address);

    // Deploy Farm
    const FarmContract = await ethers.getContractFactory("FarmContract");
    const farm = await FarmContract.deploy(await ethers.provider.getBlockNumber());
    await farm.deployed();
    deployedContracts.farm = farm.address;
    console.log("✅ FarmContract deployed at:", farm.address);

    // Deploy Staking
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const staking = await StakingContract.deploy(KAIA_TOKEN);
    await staking.deployed();
    deployedContracts.staking = staking.address;
    console.log("✅ StakingContract deployed at:", staking.address);

    // Deploy Lending
    const LendingContract = await ethers.getContractFactory("LendingContract");
    const lending = await LendingContract.deploy();
    await lending.deployed();
    deployedContracts.lending = lending.address;
    console.log("✅ LendingContract deployed at:", lending.address);

    console.log("\n⚙️ Configuring contracts...");

    // Configure PSM
    console.log("- Configuring PSM with initial tokens...");
    await flashLoan.addToken(KAIA_TOKEN, ethers.utils.parseEther("1000000"), 9); // 0.09% fee
    await flashLoan.addToken(USDT_TOKEN, ethers.utils.parseEther("1000000"), 9);

    // Configure lending
    console.log("- Configuring lending tokens...");
    await lending.addToken(KAIA_TOKEN, true, true, 8000, 8500, 500); // 80% LTV, 85% liquidation, 5% rate
    await lending.addToken(USDT_TOKEN, false, true, 0, 0, 300); // Only borrowable, 3% rate

    console.log("\n✅ All contracts deployed and configured successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("=====================================");
    
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name.padEnd(20)}: ${address}`);
    });

    console.log("\n🔗 Frontend Configuration:");
    console.log("Update your kaia.ts config with these addresses:");
    console.log("=====================================");
    console.log(`vault: "${deployedContracts.vault}",`);
    console.log(`oracle: "${deployedContracts.oracle}",`);
    console.log(`rates: "${deployedContracts.rates}",`);
    console.log(`liquidation: "${deployedContracts.liquidation}",`);
    console.log(`psm: "${deployedContracts.psm}",`);
    console.log(`flashloan: "${deployedContracts.flashLoan}",`);
    console.log(`interaction: "${deployedContracts.interaction}",`);
    console.log(`staking: "${deployedContracts.staking}",`);
    console.log(`lending: "${deployedContracts.lending}",`);
    console.log(`swap: "${deployedContracts.dex}",`);
    console.log(`farms: "${deployedContracts.farm}",`);

    // Save addresses to file
    const fs = require('fs');
    const addressData = {
      network: "kairos",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deployedContracts
    };
    
    fs.writeFileSync(
      './deployed_addresses_kairos.json', 
      JSON.stringify(addressData, null, 2)
    );
    
    console.log("\n💾 Addresses saved to deployed_addresses_kairos.json");
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