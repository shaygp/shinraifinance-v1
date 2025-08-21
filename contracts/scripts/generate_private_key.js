const { ethers } = require("ethers");

async function generatePrivateKey() {
  const mnemonic = "rack once train market region upper pyramid fossil rice pink ripple order";
  
  // Create HD wallet from mnemonic
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  console.log("Mnemonic:", mnemonic);
  console.log("Private Key:", wallet.privateKey);
  console.log("Address:", wallet.address);
  
  // Also generate with derivation path
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const derivedWallet = hdNode.derivePath("m/44'/60'/0'/0/0");
  
  console.log("\nDerived Wallet:");
  console.log("Private Key:", derivedWallet.privateKey);
  console.log("Address:", derivedWallet.address);
}

generatePrivateKey()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
