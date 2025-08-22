const { ethers } = require('ethers');

// Kaia Kairos testnet RPC
const RPC_URL = 'https://public-en-kairos.node.kaia.io';
const PRIVATE_KEY = '0x1824fec805082d0ec3416b0040e82729d01c2930b16460d8906c3499b0d535e0';

// Contract addresses
const DEX_ADDRESS = "0x0D797f37aC13B410ADa04743B5CFf34C4dDD7Fbb";
const KAIA_ADDRESS = "0xb9563C346537427aa41876aa4720902268dCdB40";
const KUSD_ADDRESS = "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E";
const WKAIA_ADDRESS = "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773";

// Basic DEX ABI
const DEX_ABI = [
  'function createPool(address tokenA, address tokenB) returns (bytes32)',
  'function getPoolInfo(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint256 amountAMin, uint256 amountBMin) returns (uint256)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address tokenIn, address tokenOut) returns (uint256)',
  'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256)'
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function mint(address to, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)'
];

async function main() {
  console.log('🔧 Testing DEX setup...\n');
  
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Using wallet:', wallet.address);
  console.log('Balance:', ethers.utils.formatEther(await wallet.getBalance()), 'KAIA\n');
  
  // Get contract instances
  const dex = new ethers.Contract(DEX_ADDRESS, DEX_ABI, wallet);
  const kaiaToken = new ethers.Contract(KAIA_ADDRESS, ERC20_ABI, wallet);
  const kusdToken = new ethers.Contract(KUSD_ADDRESS, ERC20_ABI, wallet);
  
  try {
    // Check if DEX contract exists
    const code = await provider.getCode(DEX_ADDRESS);
    if (code === '0x') {
      console.log('❌ DEX contract not deployed at', DEX_ADDRESS);
      return;
    }
    console.log('✅ DEX contract found');
    
    // Check token balances
    console.log('\n📊 Token balances:');
    const kaiaBalance = await kaiaToken.balanceOf(wallet.address);
    const kusdBalance = await kusdToken.balanceOf(wallet.address);
    console.log('KAIA:', ethers.utils.formatEther(kaiaBalance));
    console.log('KUSD:', ethers.utils.formatEther(kusdBalance));
    
    // Try to mint some tokens if balance is low
    if (kaiaBalance.lt(ethers.utils.parseEther('100'))) {
      try {
        console.log('\n🪙 Minting test tokens...');
        const mintTx1 = await kaiaToken.mint(wallet.address, ethers.utils.parseEther('1000'));
        await mintTx1.wait();
        console.log('✅ Minted 1000 KAIA');
      } catch (error) {
        console.log('⚠️ Could not mint KAIA:', error.message);
      }
    }
    
    if (kusdBalance.lt(ethers.utils.parseEther('100'))) {
      try {
        const mintTx2 = await kusdToken.mint(wallet.address, ethers.utils.parseEther('1000'));
        await mintTx2.wait();
        console.log('✅ Minted 1000 KUSD');
      } catch (error) {
        console.log('⚠️ Could not mint KUSD:', error.message);
      }
    }
    
    // Check pool info
    console.log('\n🏊 Checking pools...');
    try {
      const poolInfo = await dex.getPoolInfo(KAIA_ADDRESS, KUSD_ADDRESS);
      console.log('KAIA/KUSD Pool:');
      console.log('  Reserve A:', ethers.utils.formatEther(poolInfo.reserveA));
      console.log('  Reserve B:', ethers.utils.formatEther(poolInfo.reserveB));
      console.log('  Liquidity:', ethers.utils.formatEther(poolInfo.totalLiquidity));
      
      if (poolInfo.totalLiquidity.eq(0)) {
        console.log('\n💧 Pool has no liquidity, adding some...');
        
        // Approve tokens
        await kaiaToken.approve(DEX_ADDRESS, ethers.utils.parseEther('100'));
        await kusdToken.approve(DEX_ADDRESS, ethers.utils.parseEther('85'));
        
        // Add liquidity
        const addTx = await dex.addLiquidity(
          KAIA_ADDRESS,
          KUSD_ADDRESS,
          ethers.utils.parseEther('50'),
          ethers.utils.parseEther('42.5'),
          ethers.utils.parseEther('49'),
          ethers.utils.parseEther('42')
        );
        await addTx.wait();
        console.log('✅ Added liquidity to KAIA/KUSD pool');
        
        // Check again
        const newPoolInfo = await dex.getPoolInfo(KAIA_ADDRESS, KUSD_ADDRESS);
        console.log('Updated pool info:');
        console.log('  Reserve A:', ethers.utils.formatEther(newPoolInfo.reserveA));
        console.log('  Reserve B:', ethers.utils.formatEther(newPoolInfo.reserveB));
      }
      
    } catch (error) {
      if (error.message.includes('Pool does not exist')) {
        console.log('🏊 Creating KAIA/KUSD pool...');
        const createTx = await dex.createPool(KAIA_ADDRESS, KUSD_ADDRESS);
        await createTx.wait();
        console.log('✅ Pool created');
        
        // Add initial liquidity
        console.log('💧 Adding initial liquidity...');
        await kaiaToken.approve(DEX_ADDRESS, ethers.utils.parseEther('100'));
        await kusdToken.approve(DEX_ADDRESS, ethers.utils.parseEther('85'));
        
        const addTx = await dex.addLiquidity(
          KAIA_ADDRESS,
          KUSD_ADDRESS,
          ethers.utils.parseEther('50'),
          ethers.utils.parseEther('42.5'),
          ethers.utils.parseEther('49'),
          ethers.utils.parseEther('42')
        );
        await addTx.wait();
        console.log('✅ Added initial liquidity');
      } else {
        throw error;
      }
    }
    
    // Test quote
    console.log('\n💱 Testing swap quote...');
    try {
      const quote = await dex.getAmountOut(
        ethers.utils.parseEther('1'),
        KAIA_ADDRESS,
        KUSD_ADDRESS
      );
      console.log('1 KAIA =', ethers.utils.formatEther(quote), 'KUSD');
    } catch (error) {
      console.log('❌ Quote failed:', error.message);
    }
    
    console.log('\n🎉 DEX setup completed successfully!');
    console.log('✅ Swaps should now work in the frontend');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}