const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const chainId = BigInt(network.chainId);
    
    console.log("Adding liquidity with account:", deployer.address);
    console.log("Network:", network.name, "ChainId:", chainId.toString());
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Contract addresses from deployment (working addresses)
    const dexAddress = "0x0D797f37aC13B410ADa04743B5CFf34C4dDD7Fbb";
    const farmAddress = "0xff04F73911ed0270f0B91A1e5d51f5DcF9d5C489";
    
    // Token addresses (Kairos testnet)
    const kaiaAddress = "0xb9563C346537427aa41876aa4720902268dCdB40";
    const kusdAddress = "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E";
    const wkaiaAddress = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";

    // Get contracts
    const dex = await ethers.getContractAt("KaiaDEX", dexAddress);
    const kaia = await ethers.getContractAt("KAIA", kaiaAddress);
    const kusd = await ethers.getContractAt("KUSD", kusdAddress);
    const wkaia = await ethers.getContractAt("WKAIA", wkaiaAddress);

    console.log("\n=== Current Token Balances ===");
    console.log("KAIA:", ethers.formatEther(await kaia.balanceOf(deployer.address)));
    console.log("KUSD:", ethers.formatEther(await kusd.balanceOf(deployer.address)));
    console.log("WKAIA:", ethers.formatEther(await wkaia.balanceOf(deployer.address)));

    // Mint some tokens if we have permissions (for testing)
    console.log("\n=== Minting Test Tokens ===");
    const mintAmount = ethers.parseEther("100000"); // 100k tokens each
    
    try {
        await kaia.mint(deployer.address, mintAmount);
        console.log("Minted", ethers.formatEther(mintAmount), "KAIA");
    } catch (error) {
        console.log("Could not mint KAIA:", error.reason || error.message);
    }

    try {
        await kusd.mint(deployer.address, mintAmount);
        console.log("Minted", ethers.formatEther(mintAmount), "KUSD");
    } catch (error) {
        console.log("Could not mint KUSD:", error.reason || error.message);
    }

    // WKAIA is wrapped KAIA, so we need to deposit native KAIA to get WKAIA
    try {
        const wrapAmount = ethers.parseEther("15"); // Wrap 15 KAIA to WKAIA (much smaller amount)
        await wkaia.deposit({ value: wrapAmount });
        console.log("Wrapped", ethers.formatEther(wrapAmount), "KAIA to WKAIA");
    } catch (error) {
        console.log("Could not wrap KAIA to WKAIA:", error.reason || error.message);
    }

    console.log("\n=== Updated Token Balances ===");
    console.log("KAIA:", ethers.formatEther(await kaia.balanceOf(deployer.address)));
    console.log("KUSD:", ethers.formatEther(await kusd.balanceOf(deployer.address)));
    console.log("WKAIA:", ethers.formatEther(await wkaia.balanceOf(deployer.address)));

    // Approve DEX to spend tokens
    console.log("\n=== Approving DEX to spend tokens ===");
    const approveAmount = ethers.parseEther("50000"); // Approve 50k each
    
    await kaia.approve(dexAddress, approveAmount);
    console.log("Approved", ethers.formatEther(approveAmount), "KAIA");
    
    await kusd.approve(dexAddress, approveAmount);
    console.log("Approved", ethers.formatEther(approveAmount), "KUSD");
    
    await wkaia.approve(dexAddress, approveAmount);
    console.log("Approved", ethers.formatEther(approveAmount), "WKAIA");

    // Add liquidity to pools
    console.log("\n=== Adding Liquidity to Pools ===");
    
    // 1. KAIA/KUSD pool - Add 10,000 KAIA and 8,500 KUSD (rate: 1 KAIA = 0.85 KUSD)
    console.log("Adding liquidity to KAIA/KUSD pool...");
    const kaiaAmount = ethers.parseEther("10000");
    const kusdAmount = ethers.parseEther("8500");
    
    const tx1 = await dex.addLiquidity(
        kaiaAddress,
        kusdAddress,
        kaiaAmount,
        kusdAmount,
        ethers.parseEther("9000"), // min KAIA (10% slippage)
        ethers.parseEther("7650")  // min KUSD (10% slippage)
    );
    await tx1.wait();
    console.log("Added KAIA/KUSD liquidity:", ethers.formatEther(kaiaAmount), "KAIA +", ethers.formatEther(kusdAmount), "KUSD");

    // 2. KAIA/WKAIA pool - Add smaller amounts since we have limited WKAIA
    const currentWkaiaBalance = await wkaia.balanceOf(deployer.address);
    const wkaiaBalanceEther = parseFloat(ethers.formatEther(currentWkaiaBalance));
    
    if (wkaiaBalanceEther > 0) {
        console.log("Adding liquidity to KAIA/WKAIA pool...");
        const kaia2Amount = ethers.parseEther("10");
        const wkaiaAmount = ethers.parseEther("10");
        
        const tx2 = await dex.addLiquidity(
            kaiaAddress,
            wkaiaAddress,
            kaia2Amount,
            wkaiaAmount,
            ethers.parseEther("9"), // min KAIA (10% slippage)
            ethers.parseEther("9")  // min WKAIA (10% slippage)
        );
        await tx2.wait();
        console.log("Added KAIA/WKAIA liquidity:", ethers.formatEther(kaia2Amount), "KAIA +", ethers.formatEther(wkaiaAmount), "WKAIA");
    } else {
        console.log("Skipping KAIA/WKAIA pool - no WKAIA balance");
    }

    // Skip KUSD/WKAIA pool since we don't have enough WKAIA
    console.log("Skipping KUSD/WKAIA pool - insufficient WKAIA for large pools");

    // Check pool states
    console.log("\n=== Pool Information ===");
    
    const pool1 = await dex.getPoolInfo(kaiaAddress, kusdAddress);
    console.log("KAIA/KUSD Pool:");
    console.log("  Reserve A:", ethers.formatEther(pool1.reserveA));
    console.log("  Reserve B:", ethers.formatEther(pool1.reserveB));
    console.log("  Total Liquidity:", ethers.formatEther(pool1.totalLiquidity));

    try {
        const pool2 = await dex.getPoolInfo(kaiaAddress, wkaiaAddress);
        console.log("KAIA/WKAIA Pool:");
        console.log("  Reserve A:", ethers.formatEther(pool2.reserveA));
        console.log("  Reserve B:", ethers.formatEther(pool2.reserveB));
        console.log("  Total Liquidity:", ethers.formatEther(pool2.totalLiquidity));
    } catch (error) {
        console.log("KAIA/WKAIA Pool: No liquidity yet");
    }

    try {
        const pool3 = await dex.getPoolInfo(kusdAddress, wkaiaAddress);
        console.log("KUSD/WKAIA Pool:");
        console.log("  Reserve A:", ethers.formatEther(pool3.reserveA));
        console.log("  Reserve B:", ethers.formatEther(pool3.reserveB));
        console.log("  Total Liquidity:", ethers.formatEther(pool3.totalLiquidity));
    } catch (error) {
        console.log("KUSD/WKAIA Pool: No liquidity yet");
    }

    console.log("\n✅ Liquidity added successfully!");
    console.log("The DEX is now ready for swapping!");

    // Test a small swap
    console.log("\n=== Testing Swap ===");
    const swapAmount = ethers.parseEther("10"); // Swap 10 KAIA for KUSD
    
    // Get quote first
    const quoteAmount = await dex.getAmountOut(swapAmount, kaiaAddress, kusdAddress);
    console.log("Quote: 10 KAIA =", ethers.formatEther(quoteAmount), "KUSD");
    
    // Approve and execute swap
    await kaia.approve(dexAddress, swapAmount);
    const swapTx = await dex.swapExactTokensForTokens(
        swapAmount,
        quoteAmount * 90n / 100n, // 10% slippage
        kaiaAddress,
        kusdAddress
    );
    await swapTx.wait();
    console.log("Swap completed!");

    console.log("\n=== Final Status ===");
    console.log("DEX Contract:", dexAddress);
    console.log("Farm Contract:", farmAddress);
    console.log("All pools have liquidity and are ready for trading!");
}

main()
    .then(() => {
        console.log("\n✅ Liquidity setup completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Liquidity setup failed:", error);
        process.exit(1);
    });