const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Setting up DEX pools on Kaia Kairos...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Setting up pools with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "KAIA");

  // Contract addresses
  const DEX_ADDRESS = "0x0D797f37aC13B410ADa04743B5CFf34C4dDD7Fbb";
  const KAIA_ADDRESS = "0xb9563C346537427aa41876aa4720902268dCdB40";
  const KUSD_ADDRESS = "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E";
  const WKAIA_ADDRESS = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";

  try {
    // Get contract instances
    const dex = await ethers.getContractAt("KaiaDEX", DEX_ADDRESS);
    const kaiaToken = await ethers.getContractAt("IERC20", KAIA_ADDRESS);
    const kusdToken = await ethers.getContractAt("IERC20", KUSD_ADDRESS);
    const wkaiaToken = await ethers.getContractAt("IERC20", WKAIA_ADDRESS);

    console.log("📊 Checking token balances...");
    const kaiaBalance = await kaiaToken.balanceOf(deployer.address);
    const kusdBalance = await kusdToken.balanceOf(deployer.address);
    const wkaiaBalance = await wkaiaToken.balanceOf(deployer.address);

    console.log(`KAIA: ${ethers.utils.formatEther(kaiaBalance)}`);
    console.log(`KUSD: ${ethers.utils.formatEther(kusdBalance)}`);
    console.log(`WKAIA: ${ethers.utils.formatEther(wkaiaBalance)}`);

    // Create pools if they don't exist
    console.log("\n🏊 Creating pools...");
    
    try {
      console.log("Creating KAIA/KUSD pool...");
      const tx1 = await dex.createPool(KAIA_ADDRESS, KUSD_ADDRESS);
      await tx1.wait();
      console.log("✅ KAIA/KUSD pool created");
    } catch (error) {
      if (error.message.includes("Pool already exists")) {
        console.log("✅ KAIA/KUSD pool already exists");
      } else {
        throw error;
      }
    }

    try {
      console.log("Creating KAIA/WKAIA pool...");
      const tx2 = await dex.createPool(KAIA_ADDRESS, WKAIA_ADDRESS);
      await tx2.wait();
      console.log("✅ KAIA/WKAIA pool created");
    } catch (error) {
      if (error.message.includes("Pool already exists")) {
        console.log("✅ KAIA/WKAIA pool already exists");
      } else {
        throw error;
      }
    }

    try {
      console.log("Creating KUSD/WKAIA pool...");
      const tx3 = await dex.createPool(KUSD_ADDRESS, WKAIA_ADDRESS);
      await tx3.wait();
      console.log("✅ KUSD/WKAIA pool created");
    } catch (error) {
      if (error.message.includes("Pool already exists")) {
        console.log("✅ KUSD/WKAIA pool already exists");
      } else {
        throw error;
      }
    }

    // Check if we have tokens to add liquidity
    const minLiquidity = ethers.utils.parseEther("10");
    if (kaiaBalance.gte(minLiquidity) && kusdBalance.gte(minLiquidity)) {
      console.log("\n💧 Adding initial liquidity...");
      
      // Approve tokens for DEX
      console.log("Approving tokens...");
      await kaiaToken.approve(DEX_ADDRESS, ethers.utils.parseEther("100"));
      await kusdToken.approve(DEX_ADDRESS, ethers.utils.parseEther("100"));
      
      if (wkaiaBalance.gte(minLiquidity)) {
        await wkaiaToken.approve(DEX_ADDRESS, ethers.utils.parseEther("100"));
      }

      // Add liquidity to KAIA/KUSD pool (1:0.85 ratio)
      try {
        console.log("Adding liquidity to KAIA/KUSD pool...");
        const tx = await dex.addLiquidity(
          KAIA_ADDRESS,
          KUSD_ADDRESS,
          ethers.utils.parseEther("50"), // 50 KAIA
          ethers.utils.parseEther("42.5"), // 42.5 KUSD (1:0.85 ratio)
          ethers.utils.parseEther("49"), // min KAIA
          ethers.utils.parseEther("42") // min KUSD
        );
        await tx.wait();
        console.log("✅ Liquidity added to KAIA/KUSD pool");
      } catch (error) {
        console.log("⚠️ Could not add liquidity to KAIA/KUSD:", error.message);
      }

      // Add liquidity to KAIA/WKAIA pool if we have WKAIA
      if (wkaiaBalance.gte(minLiquidity)) {
        try {
          console.log("Adding liquidity to KAIA/WKAIA pool...");
          const tx = await dex.addLiquidity(
            KAIA_ADDRESS,
            WKAIA_ADDRESS,
            ethers.utils.parseEther("25"), // 25 KAIA
            ethers.utils.parseEther("25"), // 25 WKAIA (1:1 ratio)
            ethers.utils.parseEther("24"), // min KAIA
            ethers.utils.parseEther("24") // min WKAIA
          );
          await tx.wait();
          console.log("✅ Liquidity added to KAIA/WKAIA pool");
        } catch (error) {
          console.log("⚠️ Could not add liquidity to KAIA/WKAIA:", error.message);
        }
      }
    } else {
      console.log("⚠️ Insufficient token balances to add initial liquidity");
      console.log("You can manually add liquidity later through the frontend");
    }

    console.log("\n📊 Pool Status:");
    
    // Check pool info
    try {
      const poolInfo1 = await dex.getPoolInfo(KAIA_ADDRESS, KUSD_ADDRESS);
      console.log(`KAIA/KUSD: ${ethers.utils.formatEther(poolInfo1.reserveA)} KAIA, ${ethers.utils.formatEther(poolInfo1.reserveB)} KUSD`);
    } catch (error) {
      console.log("KAIA/KUSD: No liquidity");
    }

    try {
      const poolInfo2 = await dex.getPoolInfo(KAIA_ADDRESS, WKAIA_ADDRESS);
      console.log(`KAIA/WKAIA: ${ethers.utils.formatEther(poolInfo2.reserveA)} KAIA, ${ethers.utils.formatEther(poolInfo2.reserveB)} WKAIA`);
    } catch (error) {
      console.log("KAIA/WKAIA: No liquidity");
    }

    try {
      const poolInfo3 = await dex.getPoolInfo(KUSD_ADDRESS, WKAIA_ADDRESS);
      console.log(`KUSD/WKAIA: ${ethers.utils.formatEther(poolInfo3.reserveA)} KUSD, ${ethers.utils.formatEther(poolInfo3.reserveB)} WKAIA`);
    } catch (error) {
      console.log("KUSD/WKAIA: No liquidity");
    }

    console.log("\n🎉 DEX setup completed successfully!");
    console.log("Users can now swap tokens through the frontend.");

  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });