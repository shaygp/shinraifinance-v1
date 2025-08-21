import { ethers } from 'ethers';
import { KAIA_CONFIG, getTokenAddress, getProtocolAddress } from '@/config/kaia';

// Contract ABIs (simplified for basic functionality)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address,uint256) returns (bool)',
  'function transferFrom(address,address,uint256) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

const KUSD_ABI = [
  ...ERC20_ABI,
  'function mint(address,uint256)',
  'function burn(address,uint256)',
  'function supplyCap() view returns (uint256)',
];

const KAIA_ABI = [
  ...ERC20_ABI,
  'function mint(address,uint256)',
  'function burn(address,uint256)',
  'function supplyCap() view returns (uint256)',
];

const WKAIA_ABI = [
  ...ERC20_ABI,
  'function deposit() payable',
  'function withdraw(uint256)',
  'event Deposit(address indexed dst, uint wad)',
  'event Withdrawal(address indexed src, uint wad)',
];

const DEX_ABI = [
  'function createPool(address tokenA, address tokenB) returns (bytes32)',
  'function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB, uint256 amountAMin, uint256 amountBMin) returns (uint256)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin) returns (uint256, uint256)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address tokenIn, address tokenOut) returns (uint256)',
  'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256)',
  'function getPoolInfo(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity)',
  'function getUserLiquidity(address tokenA, address tokenB, address user) view returns (uint256)',
  'function getPoolId(address tokenA, address tokenB) view returns (bytes32)',
  'event Swap(address indexed user, bytes32 poolId, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)',
  'event LiquidityAdded(address indexed user, bytes32 poolId, uint256 amountA, uint256 amountB, uint256 liquidity)',
  'event LiquidityRemoved(address indexed user, bytes32 poolId, uint256 amountA, uint256 amountB, uint256 liquidity)',
];

const FARM_ABI = [
  'function poolLength() view returns (uint256)',
  'function getPoolInfo(uint256 pid) view returns (address lpToken, address rewardToken, uint256 allocPoint, uint256 totalStaked, uint256 rewardPerBlock, string memory name, bool active)',
  'function getUserInfo(uint256 pid, address user) view returns (uint256 amount, uint256 rewardDebt, uint256 pendingRewards)',
  'function pendingReward(uint256 pid, address user) view returns (uint256)',
  'function deposit(uint256 pid, uint256 amount)',
  'function withdraw(uint256 pid, uint256 amount)',
  'function harvest(uint256 pid)',
  'function calculateAPY(uint256 pid) view returns (uint256)',
  'event Deposit(address indexed user, uint256 indexed pid, uint256 amount)',
  'event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)',
  'event Harvest(address indexed user, uint256 indexed pid, uint256 amount)',
];

const LENDING_ABI = [
  'function supply(address token, uint256 amount)',
  'function borrow(address collateralToken, address borrowToken, uint256 collateralAmount, uint256 borrowAmount)',
  'function repay(uint256 borrowId, uint256 repayAmount)',
  'function getMaxBorrowAmount(address collateralToken, address borrowToken, uint256 collateralAmount) view returns (uint256)',
  'function getUserBorrow(address user, uint256 borrowId) view returns (uint256 collateralAmount, uint256 borrowAmount, address collateralToken, address borrowToken, uint256 totalOwed, bool active)',
  'function getUserSupplied(address user, address token) view returns (uint256)',
  'function getUserBorrowCount(address user) view returns (uint256)',
  'function getPoolInfo(address token) view returns (uint256 totalSuppliedAmount, uint256 totalBorrowedAmount, uint256 availableLiquidity, uint256 utilizationRate)',
  'event TokensBorrowed(address indexed user, address collateralToken, address borrowToken, uint256 collateralAmount, uint256 borrowAmount)',
  'event LoanRepaid(address indexed user, uint256 borrowId, uint256 repayAmount)',
  'event TokenSupplied(address indexed user, address token, uint256 amount)',
];

const STAKING_ABI = [
  'function stake(uint256 amount)',
  'function unstake(uint256 amount)',
  'function claimRewards()',
  'function getStakerInfo(address user) view returns (uint256 stakedAmount, uint256 pendingRewards, uint256 lastUpdate)',
  'function getTotalStaked() view returns (uint256)',
  'function getAPY() view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Unstaked(address indexed user, uint256 amount)',
  'event RewardsClaimed(address indexed user, uint256 amount)',
];

export class ContractService {
  private provider: ethers.providers.Web3Provider;
  private signer: ethers.Signer;

  constructor(provider: ethers.providers.Web3Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // Token Contracts
  getKUSDContract(chainId: number) {
    const address = getTokenAddress('KUSD', chainId);
    return new ethers.Contract(address, KUSD_ABI, this.signer);
  }

  getKAIAContract(chainId: number) {
    const address = getTokenAddress('KAIA', chainId);
    return new ethers.Contract(address, KAIA_ABI, this.signer);
  }

  getWKAIAContract(chainId: number) {
    const address = getTokenAddress('WKAIA', chainId);
    return new ethers.Contract(address, WKAIA_ABI, this.signer);
  }

  // Protocol Contracts
  getDEXContract(chainId: number) {
    const address = getProtocolAddress('swap', chainId);
    return new ethers.Contract(address, DEX_ABI, this.signer);
  }

  getFarmContract(chainId: number) {
    const address = getProtocolAddress('farms', chainId);
    return new ethers.Contract(address, FARM_ABI, this.signer);
  }

  getLendingContract(chainId: number) {
    const address = getProtocolAddress('lending', chainId);
    return new ethers.Contract(address, LENDING_ABI, this.signer);
  }

  getStakingContract(chainId: number) {
    const address = getProtocolAddress('staking', chainId);
    return new ethers.Contract(address, STAKING_ABI, this.signer);
  }

  // Token Balance Functions
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await contract.balanceOf(userAddress);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  }

  async getKAIABalance(userAddress: string, chainId: number): Promise<string> {
    try {
      // For Kairos testnet, get actual native KAIA balance from provider
      if (chainId === 1001) {
        const balance = await this.provider.getBalance(userAddress);
        return ethers.utils.formatEther(balance);
      }
      
      const contract = this.getKAIAContract(chainId);
      const balance = await contract.balanceOf(userAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting KAIA balance:', error);
      // Fallback to native balance
      const balance = await this.provider.getBalance(userAddress);
      return ethers.utils.formatEther(balance);
    }
  }

  async getKUSDBalance(userAddress: string, chainId: number): Promise<string> {
    try {
      const contract = this.getKUSDContract(chainId);
      const balance = await contract.balanceOf(userAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting KUSD balance:', error);
      return '0';
    }
  }

  async getWKAIABalance(userAddress: string, chainId: number): Promise<string> {
    try {
      const contract = this.getWKAIAContract(chainId);
      const balance = await contract.balanceOf(userAddress);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting WKAIA balance:', error);
      return '0';
    }
  }

  // Token Transfer Functions
  async transferKAIA(to: string, amount: string, chainId: number) {
    const contract = this.getKAIAContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.transfer(to, amountWei);
    return await tx.wait();
  }

  async transferKUSD(to: string, amount: string, chainId: number) {
    const contract = this.getKUSDContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.transfer(to, amountWei);
    return await tx.wait();
  }

  async transferWKAIA(to: string, amount: string, chainId: number) {
    const contract = this.getWKAIAContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.transfer(to, amountWei);
    return await tx.wait();
  }

  // WKAIA Deposit/Withdraw Functions
  async depositWKAIA(amount: string, chainId: number) {
    const contract = this.getWKAIAContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.deposit({ value: amountWei });
    return await tx.wait();
  }

  async withdrawWKAIA(amount: string, chainId: number) {
    const contract = this.getWKAIAContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.withdraw(amountWei);
    return await tx.wait();
  }

  // Token Approval Functions
  async approveKAIA(spender: string, amount: string, chainId: number) {
    const contract = this.getKAIAContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.approve(spender, amountWei);
    return await tx.wait();
  }

  async approveKUSD(spender: string, amount: string, chainId: number) {
    const contract = this.getKUSDContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.approve(spender, amountWei);
    return await tx.wait();
  }

  async approveWKAIA(spender: string, amount: string, chainId: number) {
    const contract = this.getWKAIAContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await contract.approve(spender, amountWei);
    return await tx.wait();
  }

  // Token Information Functions
  async getTokenInfo(tokenAddress: string) {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);
    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
    };
  }

  // Gas Estimation
  async estimateGas(contract: ethers.Contract, method: string, ...args: any[]) {
    return await contract.estimateGas[method](...args);
  }

  // Transaction Status
  async getTransactionStatus(txHash: string) {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    return {
      status: receipt?.status === 1 ? 'success' : 'failed',
      gasUsed: receipt?.gasUsed.toString(),
      blockNumber: receipt?.blockNumber,
    };
  }

  // DEX Functions
  async swapTokens(tokenIn: string, tokenOut: string, amountIn: string, amountOutMin: string, chainId: number) {
    try {
      const dex = this.getDEXContract(chainId);
      const amountInWei = ethers.utils.parseEther(amountIn);
      const amountOutMinWei = ethers.utils.parseEther(amountOutMin);
      
      const tx = await dex.swapExactTokensForTokens(
        amountInWei,
        amountOutMinWei,
        tokenIn,
        tokenOut
      );
      
      return await tx.wait();
    } catch (error) {
      console.error('swapTokens error:', error);
      throw new Error(`Failed to execute swap: ${error.message}`);
    }
  }

  async getSwapQuote(tokenIn: string, tokenOut: string, amountIn: string, chainId: number): Promise<string> {
    try {
      const dex = this.getDEXContract(chainId);
      const amountInWei = ethers.utils.parseEther(amountIn);
      
      const amountOut = await dex.getAmountOut(amountInWei, tokenIn, tokenOut);
      return ethers.utils.formatEther(amountOut);
    } catch (error) {
      console.error('getSwapQuote error:', error);
      throw new Error(`Failed to get swap quote: ${error.message}`);
    }
  }

  async getPoolInfo(tokenA: string, tokenB: string, chainId: number) {
    const dex = this.getDEXContract(chainId);
    const [reserveA, reserveB, totalLiquidity] = await dex.getPoolInfo(tokenA, tokenB);
    return {
      reserveA: ethers.utils.formatEther(reserveA),
      reserveB: ethers.utils.formatEther(reserveB),
      totalLiquidity: ethers.utils.formatEther(totalLiquidity),
    };
  }

  // Farm Functions
  async getFarmInfo(farmId: number, chainId: number) {
    const farm = this.getFarmContract(chainId);
    const [lpToken, rewardToken, allocPoint, totalStaked, rewardPerBlock, name, active] = 
      await farm.getPoolInfo(farmId);
    
    const apy = await farm.calculateAPY(farmId);
    
    return {
      lpToken,
      rewardToken,
      allocPoint: allocPoint.toString(),
      totalStaked: ethers.utils.formatEther(totalStaked),
      rewardPerBlock: ethers.utils.formatEther(rewardPerBlock),
      name,
      active,
      apy: (apy / 100).toString(), // Convert from basis points to percentage
    };
  }

  async getUserFarmInfo(farmId: number, userAddress: string, chainId: number) {
    const farm = this.getFarmContract(chainId);
    const [amount, rewardDebt, pendingRewards] = await farm.getUserInfo(farmId, userAddress);
    const pendingReward = await farm.pendingReward(farmId, userAddress);
    
    return {
      staked: ethers.utils.formatEther(amount),
      rewardDebt: ethers.utils.formatEther(rewardDebt),
      pendingRewards: ethers.utils.formatEther(pendingRewards),
      totalPending: ethers.utils.formatEther(pendingReward),
    };
  }

  async depositToFarm(farmId: number, amount: string, chainId: number) {
    try {
      const farm = this.getFarmContract(chainId);
      const amountWei = ethers.utils.parseEther(amount);
      
      const tx = await farm.deposit(farmId, amountWei);
      return await tx.wait();
    } catch (error) {
      console.error('depositToFarm error:', error);
      throw new Error(`Failed to deposit to farm: ${error.message}`);
    }
  }

  async withdrawFromFarm(farmId: number, amount: string, chainId: number) {
    try {
      const farm = this.getFarmContract(chainId);
      const amountWei = ethers.utils.parseEther(amount);
      
      const tx = await farm.withdraw(farmId, amountWei);
      return await tx.wait();
    } catch (error) {
      console.error('withdrawFromFarm error:', error);
      throw new Error(`Failed to withdraw from farm: ${error.message}`);
    }
  }

  async harvestFarm(farmId: number, chainId: number) {
    try {
      const farm = this.getFarmContract(chainId);
      
      const tx = await farm.harvest(farmId);
      return await tx.wait();
    } catch (error) {
      console.error('harvestFarm error:', error);
      throw new Error(`Failed to harvest from farm: ${error.message}`);
    }
  }

  // Staking Functions
  async stakeTokens(amount: string, chainId: number) {
    try {
      const staking = this.getStakingContract(chainId);
      const amountWei = ethers.utils.parseEther(amount);
      
      const tx = await staking.stake(amountWei);
      return await tx.wait();
    } catch (error) {
      console.error('stakeTokens error:', error);
      throw new Error(`Failed to stake tokens: ${error.message}`);
    }
  }

  async unstakeTokens(amount: string, chainId: number) {
    try {
      const staking = this.getStakingContract(chainId);
      const amountWei = ethers.utils.parseEther(amount);
      
      const tx = await staking.unstake(amountWei);
      return await tx.wait();
    } catch (error) {
      console.error('unstakeTokens error:', error);
      throw new Error(`Failed to unstake tokens: ${error.message}`);
    }
  }

  async claimStakingRewards(chainId: number) {
    try {
      const staking = this.getStakingContract(chainId);
      
      const tx = await staking.claimRewards();
      return await tx.wait();
    } catch (error) {
      console.error('claimStakingRewards error:', error);
      throw new Error(`Failed to claim staking rewards: ${error.message}`);
    }
  }

  async getStakingInfo(userAddress: string, chainId: number) {
    try {
      const staking = this.getStakingContract(chainId);
      const [stakedAmount, pendingRewards, lastUpdate] = await staking.getStakerInfo(userAddress);
      const totalStaked = await staking.getTotalStaked();
      const apy = await staking.getAPY();
      
      return {
        stakedAmount: ethers.utils.formatEther(stakedAmount),
        pendingRewards: ethers.utils.formatEther(pendingRewards),
        lastUpdate: lastUpdate.toNumber(),
        totalStaked: ethers.utils.formatEther(totalStaked),
        apy: apy.toNumber(),
      };
    } catch (error) {
      console.error('getStakingInfo error:', error);
      throw new Error(`Failed to get staking info: ${error.message}`);
    }
  }

  // Lending Functions
  async supplyToLending(token: string, amount: string, chainId: number) {
    const lending = this.getLendingContract(chainId);
    const amountWei = ethers.utils.parseEther(amount);
    const tx = await lending.supply(token, amountWei);
    return await tx.wait();
  }

  async borrowFromLending(
    collateralToken: string,
    borrowToken: string,
    collateralAmount: string,
    borrowAmount: string,
    chainId: number
  ) {
    try {
      const lending = this.getLendingContract(chainId);
      const collateralAmountWei = ethers.utils.parseEther(collateralAmount);
      const borrowAmountWei = ethers.utils.parseEther(borrowAmount);
      
      const tx = await lending.borrow(
        collateralToken,
        borrowToken,
        collateralAmountWei,
        borrowAmountWei
      );
      
      return await tx.wait();
    } catch (error) {
      console.error('borrowFromLending error:', error);
      throw new Error(`Failed to borrow: ${error.message}`);
    }
  }

  async repayLending(borrowId: number, repayAmount: string, chainId: number) {
    const lending = this.getLendingContract(chainId);
    const repayAmountWei = ethers.utils.parseEther(repayAmount);
    const tx = await lending.repay(borrowId, repayAmountWei);
    return await tx.wait();
  }

  async getMaxBorrowAmount(
    collateralToken: string,
    borrowToken: string,
    collateralAmount: string,
    chainId: number
  ): Promise<string> {
    const lending = this.getLendingContract(chainId);
    const collateralAmountWei = ethers.utils.parseEther(collateralAmount);
    const maxBorrow = await lending.getMaxBorrowAmount(collateralToken, borrowToken, collateralAmountWei);
    return ethers.utils.formatEther(maxBorrow);
  }

  async getUserBorrow(userAddress: string, borrowId: number, chainId: number) {
    const lending = this.getLendingContract(chainId);
    const [collateralAmount, borrowAmount, collateralToken, borrowToken, totalOwed, active] = 
      await lending.getUserBorrow(userAddress, borrowId);
    
    return {
      collateralAmount: ethers.utils.formatEther(collateralAmount),
      borrowAmount: ethers.utils.formatEther(borrowAmount),
      collateralToken,
      borrowToken,
      totalOwed: ethers.utils.formatEther(totalOwed),
      active,
    };
  }

  async getUserSupplied(userAddress: string, token: string, chainId: number): Promise<string> {
    const lending = this.getLendingContract(chainId);
    const supplied = await lending.getUserSupplied(userAddress, token);
    return ethers.utils.formatEther(supplied);
  }

  async getUserBorrowCount(userAddress: string, chainId: number): Promise<number> {
    const lending = this.getLendingContract(chainId);
    const count = await lending.getUserBorrowCount(userAddress);
    return count.toNumber();
  }

  async getLendingPoolInfo(token: string, chainId: number) {
    const lending = this.getLendingContract(chainId);
    const [totalSupplied, totalBorrowed, availableLiquidity, utilizationRate] = 
      await lending.getPoolInfo(token);
    
    return {
      totalSupplied: ethers.utils.formatEther(totalSupplied),
      totalBorrowed: ethers.utils.formatEther(totalBorrowed),
      availableLiquidity: ethers.utils.formatEther(availableLiquidity),
      utilizationRate: utilizationRate.toNumber() / 100, // Convert from basis points to percentage
    };
  }

  // Network Information
  async getNetworkInfo() {
    const network = await this.provider.getNetwork();
    const gasPrice = await this.provider.getGasPrice();
    return {
      chainId: network.chainId,
      name: network.name,
      gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
    };
  }
}

// Hook to use contract service
export const useContractService = (provider: ethers.providers.Web3Provider | null, signer: ethers.Signer | null) => {
  if (!provider || !signer) {
    return null;
  }
  return new ContractService(provider, signer);
};
