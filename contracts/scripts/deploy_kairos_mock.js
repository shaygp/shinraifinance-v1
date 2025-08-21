const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Shinrai Protocol to Kairos Testnet (Mock Tokens)...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`\n👤 Deploying from: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(await deployer.getBalance())} KAIA`);
    
    // Deploy mock tokens first
    console.log("\n🪙 Deploying mock tokens...");
    
    const MockKAIA = await ethers.getContractFactory("KAIA");
    const mockKAIA = await MockKAIA.deploy();
    await mockKAIA.deployed();
    console.log(`✅ Mock KAIA deployed to: ${mockKAIA.address}`);
    
    // Use real USDT on Kairos testnet
    const USDT_ADDRESS = "0x0236e4da096053856cb659d628d7012cdf4b2985";
    console.log(`✅ Using real USDT at: ${USDT_ADDRESS}`);
    
    const MockWKAIA = await ethers.getContractFactory("WKAIA");
    const mockWKAIA = await MockWKAIA.deploy();
    await mockWKAIA.deployed();
    console.log(`✅ Mock WKAIA deployed to: ${mockWKAIA.address}`);
    
    // Deploy KaiaOracle (with mock price feed for now)
    console.log("\n🔮 Deploying KaiaOracle...");
    const KaiaOracle = await ethers.getContractFactory("KaiaOracle");
    const kaiaOracle = await KaiaOracle.deploy(ethers.constants.AddressZero); // Mock address for now
    await kaiaOracle.deployed();
    console.log(`✅ KaiaOracle deployed to: ${kaiaOracle.address}`);
    
    // Deploy KaiaRates
    console.log("\n📊 Deploying KaiaRates...");
    const KaiaRates = await ethers.getContractFactory("KaiaRates");
    const kaiaRates = await KaiaRates.deploy();
    await kaiaRates.deployed();
    console.log(`✅ KaiaRates deployed to: ${kaiaRates.address}`);
    
    // Deploy KaiaVault
    console.log("\n🏦 Deploying KaiaVault...");
    const KaiaVault = await ethers.getContractFactory("KaiaVault");
    const kaiaVault = await KaiaVault.deploy(
        kaiaOracle.address,
        ethers.constants.AddressZero, // Mock address book
        ethers.constants.AddressZero, // Mock staking tracker
        ethers.constants.AddressZero  // Mock gov param
    );
    await kaiaVault.deployed();
    console.log(`✅ KaiaVault deployed to: ${kaiaVault.address}`);
    
    // Deploy KaiaInteraction
    console.log("\n🤝 Deploying KaiaInteraction...");
    const KaiaInteraction = await ethers.getContractFactory("KaiaInteraction");
    const kaiaInteraction = await KaiaInteraction.deploy(
        kaiaVault.address,
        mockKAIA.address,
        USDT_ADDRESS, // Real USDT on Kairos
        mockWKAIA.address,
        ethers.constants.AddressZero, // Mock staking tracker
        ethers.constants.AddressZero, // Mock gov param
        ethers.constants.AddressZero  // Mock cl registry
    );
    await kaiaInteraction.deployed();
    console.log(`✅ KaiaInteraction deployed to: ${kaiaInteraction.address}`);
    
    // Deploy KaiaLiquidation
    console.log("\n⚡ Deploying KaiaLiquidation...");
    const KaiaLiquidation = await ethers.getContractFactory("KaiaLiquidation");
    const kaiaLiquidation = await KaiaLiquidation.deploy(kaiaVault.address);
    await kaiaLiquidation.deployed();
    console.log(`✅ KaiaLiquidation deployed to: ${kaiaLiquidation.address}`);
    
    // Deploy KaiaSurplus
    console.log("\n💰 Deploying KaiaSurplus...");
    const KaiaSurplus = await ethers.getContractFactory("KaiaSurplus");
    const kaiaSurplus = await KaiaSurplus.deploy(kaiaVault.address);
    await kaiaSurplus.deployed();
    console.log(`✅ KaiaSurplus deployed to: ${kaiaSurplus.address}`);
    
    // Deploy KaiaJoin
    console.log("\n🔗 Deploying KaiaJoin...");
    const KaiaJoin = await ethers.getContractFactory("KaiaJoin");
    const kaiaJoin = await KaiaJoin.deploy(kaiaVault.address);
    await kaiaJoin.deployed();
    console.log(`✅ KaiaJoin deployed to: ${kaiaJoin.address}`);
    
    // Deploy KaiaSystemConfig
    console.log("\n⚙️ Deploying KaiaSystemConfig...");
    const KaiaSystemConfig = await ethers.getContractFactory("KaiaSystemConfig");
    const kaiaSystemConfig = await KaiaSystemConfig.deploy("kairos");
    await kaiaSystemConfig.deployed();
    console.log(`✅ KaiaSystemConfig deployed to: ${kaiaSystemConfig.address}`);
    
    // Deploy DeFi contracts
    console.log("\n🌊 Deploying DeFi contracts...");
    
    // Deploy KaiaDEX
    const KaiaDEX = await ethers.getContractFactory("KaiaDEX");
    const kaiaDEX = await KaiaDEX.deploy();
    await kaiaDEX.deployed();
    console.log(`✅ KaiaDEX deployed to: ${kaiaDEX.address}`);
    
    // Deploy FarmContract
    const FarmContract = await ethers.getContractFactory("FarmContract");
    const farmContract = await FarmContract.deploy();
    await farmContract.deployed();
    console.log(`✅ FarmContract deployed to: ${farmContract.address}`);
    
    // Deploy LendingContract
    const LendingContract = await ethers.getContractFactory("LendingContract");
    const lendingContract = await LendingContract.deploy();
    await lendingContract.deployed();
    console.log(`✅ LendingContract deployed to: ${lendingContract.address}`);
    
    // Deploy StakingContract
    const StakingContract = await ethers.getContractFactory("StakingContract");
    const stakingContract = await StakingContract.deploy();
    await stakingContract.deployed();
    console.log(`✅ StakingContract deployed to: ${stakingContract.address}`);
    
    // Deploy LPToken
    const LPToken = await ethers.getContractFactory("LPToken");
    const lpToken = await LPToken.deploy();
    await lpToken.deployed();
    console.log(`✅ LPToken deployed to: ${lpToken.address}`);
    
    // Save deployment addresses
    const deploymentInfo = {
        network: "kairos",
        chainId: 1001,
        rpcUrl: "https://public-en-kairos.node.kaia.io",
        contracts: {
            // Mock tokens
            MockKAIA: mockKAIA.address,
            MockKUSD: mockKUSD.address,
            MockWKAIA: mockWKAIA.address,
            
            // Core protocol
            KaiaOracle: kaiaOracle.address,
            KaiaRates: kaiaRates.address,
            KaiaVault: kaiaVault.address,
            KaiaInteraction: kaiaInteraction.address,
            KaiaLiquidation: kaiaLiquidation.address,
            KaiaSurplus: kaiaSurplus.address,
            KaiaJoin: kaiaJoin.address,
            KaiaSystemConfig: kaiaSystemConfig.address,
            
            // DeFi protocols
            KaiaDEX: kaiaDEX.address,
            FarmContract: farmContract.address,
            LendingContract: lendingContract.address,
            StakingContract: stakingContract.address,
            LPToken: lpToken.address
        },
        mockTokens: {
            KAIA: mockKAIA.address,
            KUSD: mockKUSD.address,
            WKAIA: mockWKAIA.address
        },
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        note: "Deployed with mock tokens for testing purposes"
    };
    
    // Write deployment info to file
    const fs = require("fs");
    fs.writeFileSync(
        "deployed_addresses_kairos_mock.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("📄 Deployment info saved to: deployed_addresses_kairos_mock.json");
    
    console.log("\n🔗 Contract Addresses:");
    console.log(`Mock KAIA: ${mockKAIA.address}`);
    console.log(`Mock KUSD: ${mockKUSD.address}`);
    console.log(`Mock WKAIA: ${mockWKAIA.address}`);
    console.log(`KaiaVault: ${kaiaVault.address}`);
    console.log(`KaiaInteraction: ${kaiaInteraction.address}`);
    console.log(`KaiaDEX: ${kaiaDEX.address}`);
    console.log(`FarmContract: ${farmContract.address}`);
    
    console.log("\n🚀 Next steps:");
    console.log("1. Test all contracts with mock tokens");
    console.log("2. Set up initial liquidity pools");
    console.log("3. Test vault operations (deposit, borrow, repay)");
    console.log("4. Test DeFi operations (swap, farm, stake)");
    console.log("5. Deploy with real tokens when ready");
    
    console.log("\n💡 Note: This deployment uses mock tokens for testing.");
    console.log("   For production, deploy with real Kairos testnet tokens.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
