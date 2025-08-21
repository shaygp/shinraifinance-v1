import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContractService } from '@/services/contracts';
import { useStaking } from './useStaking';
import { useFarms } from './useFarms';

export interface PortfolioPosition {
  type: string;
  asset: string;
  amount: string;
  value: string;
  apy: string;
  status: string;
  contractAddress?: string;
}

export interface Transaction {
  type: string;
  asset: string;
  amount: string;
  hash: string;
  time: string;
  status: string;
}

export interface PortfolioState {
  totalValue: string;
  totalEarnings: string;
  positions: PortfolioPosition[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  balances: {
    kaia: string;
    kusd: string;
    wkaia: string;
    stkaia: string;
  };
}

export const usePortfolio = (walletState: {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: any;
  signer: any;
}) => {
  const { address, chainId, isConnected, provider, signer } = walletState;
  const contractService = useContractService(provider, signer);
  
  // Use other hooks to get data
  const stakingData = useStaking(walletState);
  const farmsData = useFarms(walletState);

  const [portfolioState, setPortfolioState] = useState<PortfolioState>({
    totalValue: '$0.00',
    totalEarnings: '$0.00',
    positions: [],
    transactions: [],
    isLoading: false,
    error: null,
    balances: {
      kaia: '0',
      kusd: '0',
      wkaia: '0',
      stkaia: '0',
    },
  });

  const loadUserTransactions = useCallback(async (): Promise<Transaction[]> => {
    if (!contractService || !address || !chainId) return [];

    try {
      const transactions: Transaction[] = [];
      const currentBlock = await contractService.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

      // Get farm events
      const farmContract = contractService.getFarmContract(chainId);
      const depositFilter = farmContract.filters.Deposit(address);
      const withdrawFilter = farmContract.filters.Withdraw(address);
      const harvestFilter = farmContract.filters.Harvest(address);

      const [depositEvents, withdrawEvents, harvestEvents] = await Promise.all([
        farmContract.queryFilter(depositFilter, fromBlock, currentBlock),
        farmContract.queryFilter(withdrawFilter, fromBlock, currentBlock),
        farmContract.queryFilter(harvestFilter, fromBlock, currentBlock),
      ]);

      // Process farm events
      for (const event of depositEvents) {
        const block = await event.getBlock();
        const args = event.args as { user: string; pid: number; amount: ethers.BigNumber };
        transactions.push({
          type: "Stake",
          asset: "LP Token",
          amount: ethers.utils.formatEther(args.amount),
          hash: event.transactionHash,
          time: new Date(block.timestamp * 1000).toLocaleDateString(),
          status: "Confirmed"
        });
      }

      for (const event of withdrawEvents) {
        const block = await event.getBlock();
        const args = event.args as { user: string; pid: number; amount: ethers.BigNumber };
        transactions.push({
          type: "Unstake",
          asset: "LP Token",
          amount: ethers.utils.formatEther(args.amount),
          hash: event.transactionHash,
          time: new Date(block.timestamp * 1000).toLocaleDateString(),
          status: "Confirmed"
        });
      }

      for (const event of harvestEvents) {
        const block = await event.getBlock();
        const args = event.args as { user: string; pid: number; amount: ethers.BigNumber };
        transactions.push({
          type: "Harvest",
          asset: "KAIA",
          amount: ethers.utils.formatEther(args.amount),
          hash: event.transactionHash,
          time: new Date(block.timestamp * 1000).toLocaleDateString(),
          status: "Confirmed"
        });
      }

      // Get DEX swap events
      try {
        const dexContract = contractService.getDEXContract(chainId);
        const swapFilter = dexContract.filters.Swap(address);
        const swapEvents = await dexContract.queryFilter(swapFilter, fromBlock, currentBlock);

        for (const event of swapEvents) {
          const block = await event.getBlock();
          const args = event.args as { user: string; poolId: string; tokenIn: string; tokenOut: string; amountIn: ethers.BigNumber; amountOut: ethers.BigNumber };
          transactions.push({
            type: "Swap",
            asset: "Token Swap",
            amount: ethers.utils.formatEther(args.amountIn),
            hash: event.transactionHash,
            time: new Date(block.timestamp * 1000).toLocaleDateString(),
            status: "Confirmed"
          });
        }
      } catch (swapError) {
        console.log('No swap events found or DEX contract not available');
      }

      // Sort by most recent first
      return transactions.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    } catch (error) {
      console.error('Error loading transaction history:', error);
      return [];
    }
  }, [contractService, address, chainId]);

  const loadPortfolioData = useCallback(async () => {
    if (!contractService || !address || !chainId) return;

    setPortfolioState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load token balances
      const kaiaBalance = await contractService.getKAIABalance(address, chainId);
      const kusdBalance = await contractService.getKUSDBalance(address, chainId);
      const wkaiaBalance = await contractService.getWKAIABalance(address, chainId);
      
      // Get staking data
      const stkaiaBalance = stakingData.stKAIABalance;
      
      // Calculate total value (mock prices for now)
      const kaiaPrice = 0.85; // $0.85 per KAIA
      const kusdPrice = 1.00; // $1.00 per KUSD
      const wkaiaPrice = 0.85; // $0.85 per WKAIA
      const stkaiaPrice = 0.85; // $0.85 per stKAIA
      
      const totalValue = (
        parseFloat(kaiaBalance) * kaiaPrice +
        parseFloat(kusdBalance) * kusdPrice +
        parseFloat(wkaiaBalance) * wkaiaPrice +
        parseFloat(stkaiaBalance) * stkaiaPrice
      ).toFixed(2);

      // Build positions from various sources
      const positions: PortfolioPosition[] = [];
      
      // Staking position
      if (parseFloat(stakingData.stakedAmount) > 0) {
        positions.push({
          type: "Staking",
          asset: "stKAIA",
          amount: stakingData.stakedAmount,
          value: `$${(parseFloat(stakingData.stakedAmount) * stkaiaPrice).toFixed(2)}`,
          apy: `${stakingData.apy}%`,
          status: "Active",
          contractAddress: chainId === 1001 ? "0x1A42907c51923D98EF39A25C28ffCe06dbA90517" : undefined
        });
      }

      // Token balances as positions
      if (parseFloat(kaiaBalance) > 0) {
        positions.push({
          type: "Holdings",
          asset: "KAIA",
          amount: kaiaBalance,
          value: `$${(parseFloat(kaiaBalance) * kaiaPrice).toFixed(2)}`,
          apy: "0%",
          status: "Active"
        });
      }

      if (parseFloat(kusdBalance) > 0) {
        positions.push({
          type: "Holdings",
          asset: "KUSD",
          amount: kusdBalance,
          value: `$${(parseFloat(kusdBalance) * kusdPrice).toFixed(2)}`,
          apy: "0%",
          status: "Active"
        });
      }

      if (parseFloat(wkaiaBalance) > 0) {
        positions.push({
          type: "Holdings",
          asset: "WKAIA",
          amount: wkaiaBalance,
          value: `$${(parseFloat(wkaiaBalance) * wkaiaPrice).toFixed(2)}`,
          apy: "0%",
          status: "Active"
        });
      }

      // Farm positions
      farmsData.userFarms.forEach(farm => {
        if (parseFloat(farm.staked) > 0) {
          positions.push({
            type: "Farming",
            asset: farm.pair,
            amount: farm.staked,
            value: "$0.00", // Will be calculated from LP token value
            apy: farm.apy,
            status: "Active",
            contractAddress: farm.lpTokenAddress
          });
        }
      });

      // Fetch real transaction history from blockchain events
      const transactions = await loadUserTransactions();

      setPortfolioState({
        totalValue: `$${totalValue}`,
        totalEarnings: "$0.00", // Will be calculated from rewards
        positions,
        transactions,
        isLoading: false,
        error: null,
        balances: {
          kaia: kaiaBalance,
          kusd: kusdBalance,
          wkaia: wkaiaBalance,
          stkaia: stkaiaBalance,
        },
      });

    } catch (error) {
      console.error('Error loading portfolio data:', error);
      setPortfolioState(prev => ({
        ...prev,
        error: 'Failed to load portfolio data',
        isLoading: false,
      }));
    }
  }, [contractService, address, chainId, stakingData, farmsData.userFarms, loadUserTransactions]);

  // Load portfolio data when dependencies change
  useEffect(() => {
    if (isConnected && chainId) {
      loadPortfolioData();
    }
  }, [isConnected, chainId, loadPortfolioData]);

  const refreshPortfolio = useCallback(async () => {
    await loadPortfolioData();
  }, [loadPortfolioData]);

  return {
    ...portfolioState,
    loadPortfolioData,
    refreshPortfolio,
  };
};
