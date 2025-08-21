const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  console.log("Chain ID:", chainId);

            // Deploy KUSD (Kaia USD Stablecoin)
          console.log("\nDeploying KUSD...");
          const KUSD = await ethers.getContractFactory("KUSD");
          const kusd = await KUSD.deploy();
          await kusd.waitForDeployment();
          console.log("KUSD deployed to:", await kusd.getAddress());

            // Initialize KUSD
          await kusd.initialize(chainId, "KUSD", ethers.parseEther("1000000000")); // 1B supply cap
          console.log("KUSD initialized");

          // Deploy KAIA (Kaia Native Token)
          console.log("\nDeploying KAIA...");
          const KAIA = await ethers.getContractFactory("KAIA");
          const kaia = await KAIA.deploy();
          await kaia.waitForDeployment();
          console.log("KAIA deployed to:", await kaia.getAddress());

          // Initialize KAIA
          await kaia.initialize(chainId, "KAIA", ethers.parseEther("1000000000")); // 1B supply cap
          console.log("KAIA initialized");

          // Deploy WKAIA (Wrapped Kaia)
          console.log("\nDeploying WKAIA...");
          const WKAIA = await ethers.getContractFactory("WKAIA");
          const wkaia = await WKAIA.deploy();
          await wkaia.waitForDeployment();
          console.log("WKAIA deployed to:", await wkaia.getAddress());

            // Mint some initial tokens to deployer
          console.log("\nMinting initial tokens...");
          await kusd.mint(deployer.address, ethers.parseEther("1000000")); // 1M KUSD
          await kaia.mint(deployer.address, ethers.parseEther("1000000")); // 1M KAIA
          console.log("Initial tokens minted to deployer");

          console.log("\nDeployment Summary:");
          console.log("KUSD (Kaia USD):", await kusd.getAddress());
          console.log("KAIA (Kaia Token):", await kaia.getAddress());
          console.log("WKAIA (Wrapped Kaia):", await wkaia.getAddress());
          console.log("Deployer:", deployer.address);

            // Save deployment addresses
          const deploymentInfo = {
            network: chainId === 8217n ? "kaia" : chainId === 1001n ? "kairos" : "unknown",
            chainId: chainId.toString(),
            deployer: deployer.address,
            tokens: {
              kusd: await kusd.getAddress(),
              kaia: await kaia.getAddress(),
              wkaia: await wkaia.getAddress()
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
