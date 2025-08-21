import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContractService } from '@/services/contracts';
import { useWallet } from './useWallet';
import { getTokenAddress } from '@/config/kaia';

export interface BorrowState {
  collateralToken: string;
  borrowToken: string;
  collateralAmount: string;
  borrowAmount: string;
  ltv: number;
  liquidationLTV: number;
  borrowAPR: string;
  healthFactor: string;
  isLoading: boolean;
  error: string | null;
  totalBorrowed: string;
  availableLiquidity: string;
  utilizationRate: string;
}

export const useBorrow = (walletState: {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: any;
  signer: any;
}) => {
  const { address, chainId, isConnected, provider, signer } = walletState;
  const contractService = useContractService(provider, signer);

  const [borrowState, setBorrowState] = useState<BorrowState>({
    collateralToken: 'stKAIA',
    borrowToken: 'KUSD',
    collateralAmount: '',
    borrowAmount: '',
    ltv: 0,
    liquidationLTV: 90,
    borrowAPR: '3.2',
    healthFactor: '∞',
    isLoading: false,
    error: null,
    totalBorrowed: '280000000',
    availableLiquidity: '120000000',
    utilizationRate: '70',
  });

  const getCollateralBalance = useCallback(async (token: string) => {
    if (!contractService || !address || !chainId) return '0';

    try {
      switch (token) {
        case 'stKAIA':
          // Mock stKAIA balance - would come from staking contract
          return '0';
        case 'KAIA':
          return await contractService.getKAIABalance(address, chainId);
        case 'WKAIA':
          return await contractService.getWKAIABalance(address, chainId);
        default:
          return '0';
      }
    } catch (error) {
      console.error(`Error getting ${token} balance:`, error);
      return '0';
    }
  }, [contractService, address, chainId]);

  const calculateBorrowLimit = useCallback(async (collateralAmount: string, collateralToken: string) => {
    if (!collateralAmount || parseFloat(collateralAmount) === 0 || !contractService || !chainId) {
      setBorrowState(prev => ({ ...prev, borrowAmount: '', ltv: 0 }));
      return;
    }

    try {
      // Get token addresses
      const collateralTokenAddress = getTokenAddress(collateralToken, chainId);
      const borrowTokenAddress = getTokenAddress(borrowState.borrowToken, chainId);
      
      if (!collateralTokenAddress || !borrowTokenAddress) {
        throw new Error('Token addresses not found');
      }

      // Get max borrow amount from lending contract
      const maxBorrowAmount = await contractService.getMaxBorrowAmount(
        collateralTokenAddress,
        borrowTokenAddress,
        collateralAmount,
        chainId
      );

      setBorrowState(prev => ({
        ...prev,
        borrowAmount: parseFloat(maxBorrowAmount).toFixed(6),
        ltv: 0, // TODO: Calculate current LTV from existing borrows
      }));

    } catch (error) {
      console.error('Error calculating borrow limit:', error);
      setBorrowState(prev => ({ ...prev, error: 'Failed to calculate borrow limit' }));
    }
  }, [contractService, chainId, borrowState.borrowToken]);

  const updateCollateralAmount = useCallback(async (amount: string) => {
    setBorrowState(prev => ({ ...prev, collateralAmount: amount, error: null }));
    await calculateBorrowLimit(amount, borrowState.collateralToken);
  }, [borrowState.collateralToken, calculateBorrowLimit]);

  const updateBorrowAmount = useCallback(async (amount: string) => {
    setBorrowState(prev => ({ ...prev, borrowAmount: amount, error: null }));
    
    if (!amount || parseFloat(amount) === 0) {
      setBorrowState(prev => ({ ...prev, ltv: 0 }));
      return;
    }

    try {
      const borrowValue = parseFloat(amount);
      const collateralValue = parseFloat(borrowState.collateralAmount);
      const ltv = collateralValue > 0 ? (borrowValue / collateralValue) * 100 : 0;

      setBorrowState(prev => ({
        ...prev,
        ltv,
        healthFactor: ltv < 90 ? 'Low' : '∞',
      }));

    } catch (error) {
      console.error('Error calculating LTV:', error);
    }
  }, [borrowState.collateralAmount]);

  const setCollateralToken = useCallback((token: string) => {
    setBorrowState(prev => ({ ...prev, collateralToken: token }));
  }, []);

  const setBorrowToken = useCallback((token: string) => {
    setBorrowState(prev => ({ ...prev, borrowToken: token }));
  }, []);

  const executeBorrow = useCallback(async () => {
    if (!contractService || !address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!borrowState.collateralAmount || parseFloat(borrowState.collateralAmount) <= 0) {
      throw new Error('Invalid collateral amount');
    }

    if (!borrowState.borrowAmount || parseFloat(borrowState.borrowAmount) <= 0) {
      throw new Error('Invalid borrow amount');
    }

    if (borrowState.ltv >= borrowState.liquidationLTV) {
      throw new Error(`Loan-to-value ratio too high (${borrowState.ltv.toFixed(1)}%). Maximum allowed: ${borrowState.liquidationLTV}%`);
    }

    if (chainId !== 1001) {
      throw new Error('Borrowing is only available on Kairos testnet. Please switch networks.');
    }

    setBorrowState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get token addresses
      const collateralTokenAddress = getTokenAddress(borrowState.collateralToken, chainId);
      const borrowTokenAddress = getTokenAddress(borrowState.borrowToken, chainId);
      
      if (!collateralTokenAddress || !borrowTokenAddress) {
        throw new Error('Token addresses not found');
      }

      // Check collateral balance
      const collateralBalance = await getCollateralBalance(borrowState.collateralToken);
      if (parseFloat(collateralBalance) < parseFloat(borrowState.collateralAmount)) {
        throw new Error(`Insufficient ${borrowState.collateralToken} balance. Available: ${parseFloat(collateralBalance).toFixed(4)} ${borrowState.collateralToken}`);
      }

      // Check if lending pool has enough liquidity
      const lendingPoolInfo = await contractService.getLendingPoolInfo(borrowState.borrowToken, chainId);
      if (parseFloat(lendingPoolInfo.availableLiquidity) < parseFloat(borrowState.borrowAmount)) {
        throw new Error(`Insufficient liquidity in ${borrowState.borrowToken} pool. Available: ${parseFloat(lendingPoolInfo.availableLiquidity).toFixed(2)}`);
      }

      // Get lending contract address
      const lendingContract = contractService.getLendingContract(chainId);
      const lendingContractAddress = await lendingContract.getAddress();
      
      // Approve collateral for lending contract
      switch (borrowState.collateralToken) {
        case 'KAIA':
          await contractService.approveKAIA(lendingContractAddress, borrowState.collateralAmount, chainId);
          break;
        case 'KUSD':
          await contractService.approveKUSD(lendingContractAddress, borrowState.collateralAmount, chainId);
          break;
        case 'WKAIA':
          await contractService.approveWKAIA(lendingContractAddress, borrowState.collateralAmount, chainId);
          break;
      }

      // Execute borrow
      const tx = await contractService.borrowFromLending(
        collateralTokenAddress,
        borrowTokenAddress,
        borrowState.collateralAmount,
        borrowState.borrowAmount,
        chainId
      );

      // Reset form
      setBorrowState(prev => ({
        ...prev,
        collateralAmount: '',
        borrowAmount: '',
        ltv: 0,
        isLoading: false,
      }));

      return { success: true, txHash: tx.transactionHash || tx.hash };

    } catch (error) {
      console.error('Error executing borrow:', error);
      setBorrowState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to execute borrow',
        isLoading: false,
      }));
      throw error;
    }
  }, [contractService, address, chainId, borrowState, getCollateralBalance]);

  const repayBorrow = useCallback(async (amount: string) => {
    if (!contractService || !address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid repay amount');
    }

    if (chainId !== 1001) {
      throw new Error('Borrowing is only available on Kairos testnet. Please switch networks.');
    }

    setBorrowState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check borrow token balance
      const borrowBalance = await contractService.getKUSDBalance(address, chainId);
      if (parseFloat(borrowBalance) < parseFloat(amount)) {
        throw new Error(`Insufficient ${borrowState.borrowToken} balance. Available: ${parseFloat(borrowBalance).toFixed(4)} ${borrowState.borrowToken}`);
      }

      // Approve borrow token for repayment
      const lendingContractAddress = '0x0000000000000000000000000000000000000000'; // Mock address
      await contractService.approveKUSD(lendingContractAddress, amount, chainId);

      // Execute repayment (mock for now)
      // const lendingContract = new ethers.Contract(lendingContractAddress, LENDING_ABI, contractService.signer);
      // const tx = await lendingContract.repay(borrowState.borrowToken, ethers.utils.parseEther(amount));
      // await tx.wait();

      // For now, just simulate the transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      setBorrowState(prev => ({ ...prev, isLoading: false }));

      return { success: true, txHash: 'mock-repay-tx-hash' };

    } catch (error) {
      console.error('Error repaying borrow:', error);
      setBorrowState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to repay borrow',
        isLoading: false,
      }));
      throw error;
    }
  }, [contractService, address, chainId, borrowState.borrowToken]);

  const getBorrowStats = useCallback(() => {
    return {
      totalBorrowed: borrowState.totalBorrowed,
      availableLiquidity: borrowState.availableLiquidity,
      utilizationRate: borrowState.utilizationRate,
      borrowAPR: borrowState.borrowAPR,
      liquidationLTV: borrowState.liquidationLTV,
    };
  }, [borrowState]);

  const getHealthFactor = useCallback(() => {
    return {
      healthFactor: borrowState.healthFactor,
      ltv: borrowState.ltv,
      liquidationLTV: borrowState.liquidationLTV,
      isHealthy: borrowState.ltv < borrowState.liquidationLTV,
    };
  }, [borrowState]);

  return {
    ...borrowState,
    updateCollateralAmount,
    updateBorrowAmount,
    setCollateralToken,
    setBorrowToken,
    executeBorrow,
    repayBorrow,
    getCollateralBalance,
    getBorrowStats,
    getHealthFactor,
  };
};
