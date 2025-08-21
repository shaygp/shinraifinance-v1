const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying staking contract with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Chain ID:", chainId);

  // Get the deployed KAIA token address
  let kaiaTokenAddress;
  if (chainId === 1001n) { // Kairos testnet
    kaiaTokenAddress = "0xb9563C346537427aa41876aa4720902268dCdB40"; // NEW ADDRESS
  } else if (chainId === 8217n) { // Kaia mainnet
    kaiaTokenAddress = "0x0000000000000000000000000000000000000000"; // TODO: Deploy
  } else {
    throw new Error("Unsupported network");
  }

  console.log("KAIA Token Address:", kaiaTokenAddress);

  // Deploy StakingContract
  console.log("\nDeploying StakingContract...");
  const StakingContract = await ethers.getContractFactory("StakingContract");
  const stakingContract = await StakingContract.deploy(kaiaTokenAddress);
  await stakingContract.waitForDeployment();
  
  const stakingAddress = await stakingContract.getAddress();
  console.log("StakingContract deployed to:", stakingAddress);

  // Transfer ownership to deployer
  await stakingContract.transferOwnership(deployer.address);
  console.log("Ownership transferred to deployer");

  console.log("\nDeployment Summary:");
  console.log("StakingContract:", stakingAddress);
  console.log("KAIA Token:", kaiaTokenAddress);
  console.log("Deployer:", deployer.address);

  // Save deployment info
  const deploymentInfo = {
    network: chainId === 8217n ? "kaia" : chainId === 1001n ? "kairos" : "unknown",
    chainId: chainId.toString(),
    deployer: deployer.address,
    contracts: {
      staking: stakingAddress,
      kaiaToken: kaiaTokenAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\nDeployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
