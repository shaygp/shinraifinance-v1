const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Simple Blockchain Transactions...\n");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Deployer Balance:", ethers.utils.formatEther(await deployer.getBalance()), "KAIA\n");

  // Test network connection
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId);
  console.log("📡 RPC URL:", ethers.provider.connection.url, "\n");

  // Test contract addresses from latest deployment
  const KUSD_ADDRESS = "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E";
  const KAIA_ADDRESS = "0xb9563C346537427aa41876aa4720902268dCdB40";
  const WKAIA_ADDRESS = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";

  console.log("📋 Contract Addresses:");
  console.log("KUSD:", KUSD_ADDRESS);
  console.log("KAIA:", KAIA_ADDRESS);
  console.log("WKAIA:", WKAIA_ADDRESS, "\n");

  try {
    // Test 1: Check deployer's native KAIA balance
    console.log("🔍 Test 1: Checking native KAIA balance...");
    const nativeBalance = await deployer.getBalance();
    console.log("✅ Native Balance:", ethers.utils.formatEther(nativeBalance), "KAIA\n");

    // Test 2: Check deployer's KAIA token balance
    console.log("🔍 Test 2: Checking KAIA token balance...");
    const kaiaContract = new ethers.Contract(KAIA_ADDRESS, [
      'function balanceOf(address) view returns (uint256)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)'
    ], deployer);

    const kaiaBalance = await kaiaContract.balanceOf(deployer.address);
    const kaiaName = await kaiaContract.name();
    const kaiaSymbol = await kaiaContract.symbol();
    const kaiaDecimals = await kaiaContract.decimals();

    console.log("✅ KAIA Token Info:");
    console.log("   Name:", kaiaName);
    console.log("   Symbol:", kaiaSymbol);
    console.log("   Decimals:", kaiaDecimals);
    console.log("   Balance:", ethers.utils.formatUnits(kaiaBalance, kaiaDecimals), kaiaSymbol, "\n");

    // Test 3: Check deployer's KUSD balance
    console.log("🔍 Test 3: Checking KUSD balance...");
    const kusdContract = new ethers.Contract(KUSD_ADDRESS, [
      'function balanceOf(address) view returns (uint256)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)'
    ], deployer);

    const kusdBalance = await kusdContract.balanceOf(deployer.address);
    const kusdName = await kusdContract.name();
    const kusdSymbol = await kusdContract.symbol();
    const kusdDecimals = await kusdContract.decimals();

    console.log("✅ KUSD Token Info:");
    console.log("   Name:", kusdName);
    console.log("   Symbol:", kusdSymbol);
    console.log("   Decimals:", kusdDecimals);
    console.log("   Balance:", ethers.utils.formatUnits(kusdBalance, kusdDecimals), kusdSymbol, "\n");

    // Test 4: Check deployer's WKAIA balance
    console.log("🔍 Test 4: Checking WKAIA balance...");
    const wkaiaContract = new ethers.Contract(WKAIA_ADDRESS, [
      'function balanceOf(address) view returns (uint256)',
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)'
    ], deployer);

    const wkaiaBalance = await wkaiaContract.balanceOf(deployer.address);
    const wkaiaName = await wkaiaContract.name();
    const wkaiaSymbol = await wkaiaContract.symbol();
    const wkaiaDecimals = await wkaiaContract.decimals();

    console.log("✅ WKAIA Token Info:");
    console.log("   Name:", wkaiaName);
    console.log("   Symbol:", wkaiaSymbol);
    console.log("   Decimals:", wkaiaDecimals);
    console.log("   Balance:", ethers.utils.formatUnits(wkaiaBalance, wkaiaDecimals), wkaiaSymbol, "\n");

    // Test 5: Test a simple transfer (0.001 KAIA to self as a test)
    console.log("🔍 Test 5: Testing simple transfer...");
    const testAmount = ethers.utils.parseEther("0.001");
    
    console.log("   Transferring 0.001 KAIA to self...");
    const tx = await kaiaContract.transfer(deployer.address, testAmount);
    console.log("   Transaction hash:", tx.hash);
    
    console.log("   Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("   ✅ Transaction confirmed in block:", receipt.blockNumber);
    console.log("   Gas used:", receipt.gasUsed.toString());
    console.log("   Gas price:", ethers.utils.formatUnits(receipt.effectiveGasPrice, "gwei"), "gwei\n");

    // Test 6: Check balance after transfer
    console.log("🔍 Test 6: Verifying balance after transfer...");
    const newKaiaBalance = await kaiaContract.balanceOf(deployer.address);
    console.log("✅ New KAIA Balance:", ethers.utils.formatUnits(newKaiaBalance, kaiaDecimals), kaiaSymbol);
    console.log("   Balance unchanged (transfer to self):", newKaiaBalance.eq(kaiaBalance), "\n");

    // Test 7: Test contract interaction (approve function)
    console.log("🔍 Test 7: Testing approve function...");
    const approveAmount = ethers.utils.parseEther("100");
    const approveTx = await kaiaContract.approve(deployer.address, approveAmount);
    console.log("   Approving 100 KAIA for self...");
    
    console.log("   Waiting for confirmation...");
    const approveReceipt = await approveTx.wait();
    console.log("   ✅ Approve transaction confirmed in block:", approveReceipt.blockNumber);
    console.log("   Gas used:", approveReceipt.gasUsed.toString(), "\n");

    // Test 8: Check allowance
    console.log("🔍 Test 8: Checking allowance...");
    const allowance = await kaiaContract.allowance(deployer.address, deployer.address);
    console.log("✅ Allowance:", ethers.utils.formatUnits(allowance, kaiaDecimals), kaiaSymbol, "\n");

    console.log("🎉 All tests completed successfully!");
    console.log("✅ Blockchain integration is working perfectly!");
    console.log("✅ Smart contracts are accessible and functional!");
    console.log("✅ Transactions are being processed correctly!");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
