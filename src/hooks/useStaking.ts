import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContractService } from '@/services/contracts';
import { useWallet } from './useWallet';

export interface StakingState {
  stakedAmount: string;
  stKAIABalance: string;
  totalStaked: string;
  exchangeRate: string;
  apy: string;
  isLoading: boolean;
  error: string | null;
}

export const useStaking = (walletState: {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: any;
  signer: any;
}) => {
  const { address, chainId, isConnected, provider, signer } = walletState;
  const contractService = useContractService(provider, signer);

  const [stakingState, setStakingState] = useState<StakingState>({
    stakedAmount: '0',
    stKAIABalance: '0',
    totalStaked: '0',
    exchangeRate: '1.0',
    apy: '100',
    isLoading: false,
    error: null,
  });

  const loadStakingData = useCallback(async () => {
    if (!contractService || !address || !chainId) return;

    setStakingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get user's KAIA balance
      const kaiaBalance = await contractService.getKAIABalance(address, chainId);
      
      // Get staking contract address
      const stakingAddress = chainId === 1001 ? "0x1A42907c51923D98EF39A25C28ffCe06dbA90517" : "0x0000000000000000000000000000000000000000";
      
      // Get staking info from contract
      const stakingContract = new ethers.Contract(stakingAddress, [
        'function getStakerInfo(address) view returns (uint256, uint256, uint256)',
        'function getTotalStaked() view returns (uint256)',
        'function getAPY() view returns (uint256)'
      ], contractService.provider);
      
      const [stakedAmount, pendingRewards, lastUpdate] = await stakingContract.getStakerInfo(address);
      const totalStaked = await stakingContract.getTotalStaked();
      const apy = await stakingContract.getAPY();
      
      setStakingState(prev => ({
        ...prev,
        stakedAmount: ethers.utils.formatEther(stakedAmount),
        stKAIABalance: ethers.utils.formatEther(pendingRewards),
        totalStaked: ethers.utils.formatEther(totalStaked),
        apy: apy.toString(),
        isLoading: false,
      }));

    } catch (error) {
      console.error('Error loading staking data:', error);
      setStakingState(prev => ({
        ...prev,
        error: 'Failed to load staking data',
        isLoading: false,
      }));
    }
  }, [contractService, address, chainId]);

  const stakeKAIA = useCallback(async (amount: string) => {
    if (!contractService || !address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid stake amount');
    }

    setStakingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check user KAIA balance first
      const kaiaBalance = await contractService.getKAIABalance(address, chainId);
      if (parseFloat(kaiaBalance) < parseFloat(amount)) {
        throw new Error(`Insufficient KAIA balance. Available: ${parseFloat(kaiaBalance).toFixed(4)} KAIA`);
      }

      // Get staking contract address
      const stakingContractAddress = chainId === 1001 ? "0x1A42907c51923D98EF39A25C28ffCe06dbA90517" : "0x0000000000000000000000000000000000000000";
      
      if (stakingContractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error('Staking not available on this network. Please connect to Kairos testnet.');
      }

      // First approve the staking contract to spend KAIA
      await contractService.approveKAIA(stakingContractAddress, amount, chainId);

      // Then call stake function on the real contract
      const stakingContract = new ethers.Contract(stakingContractAddress, [
        'function stake(uint256 amount) external'
      ], contractService.signer);
      
      const tx = await stakingContract.stake(ethers.utils.parseEther(amount));
      await tx.wait();

      // Reload staking data
      await loadStakingData();

      setStakingState(prev => ({ ...prev, isLoading: false }));

      return { success: true, txHash: tx.hash };

    } catch (error) {
      console.error('Error staking KAIA:', error);
      setStakingState(prev => ({
        ...prev,
        error: 'Failed to stake KAIA',
        isLoading: false,
      }));
      throw error;
    }
  }, [contractService, address, chainId, loadStakingData]);

  const unstakeKAIA = useCallback(async (amount: string) => {
    if (!contractService || !address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid unstake amount');
    }

    setStakingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if user has enough staked amount
      if (parseFloat(stakingState.stakedAmount) < parseFloat(amount)) {
        throw new Error(`Insufficient staked amount. Available: ${parseFloat(stakingState.stakedAmount).toFixed(4)} KAIA`);
      }

      // Get staking contract address
      const stakingContractAddress = chainId === 1001 ? "0x1A42907c51923D98EF39A25C28ffCe06dbA90517" : "0x0000000000000000000000000000000000000000";
      
      if (stakingContractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error('Staking not available on this network. Please connect to Kairos testnet.');
      }
      
      // Call unstake function on the real contract
      const stakingContract = new ethers.Contract(stakingContractAddress, [
        'function unstake(uint256 amount) external'
      ], contractService.signer);
      
      const tx = await stakingContract.unstake(ethers.utils.parseEther(amount));
      await tx.wait();

      // Reload staking data
      await loadStakingData();

      setStakingState(prev => ({ ...prev, isLoading: false }));

      return { success: true, txHash: tx.hash };

    } catch (error) {
      console.error('Error unstaking KAIA:', error);
      setStakingState(prev => ({
        ...prev,
        error: 'Failed to unstake KAIA',
        isLoading: false,
      }));
      throw error;
    }
  }, [contractService, address, chainId, loadStakingData]);

  const claimRewards = useCallback(async () => {
    if (!contractService || !address || !chainId) {
      throw new Error('Wallet not connected');
    }

    setStakingState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get staking contract address
      const stakingContractAddress = chainId === 1001 ? "0x1A42907c51923D98EF39A25C28ffCe06dbA90517" : "0x0000000000000000000000000000000000000000";
      
      // Call claim rewards function on the real contract
      const stakingContract = new ethers.Contract(stakingContractAddress, [
        'function claimRewards() external'
      ], contractService.signer);
      
      const tx = await stakingContract.claimRewards();
      await tx.wait();

      // Reload staking data
      await loadStakingData();

      setStakingState(prev => ({ ...prev, isLoading: false }));

      return { success: true, txHash: tx.hash };

    } catch (error) {
      console.error('Error claiming rewards:', error);
      setStakingState(prev => ({
        ...prev,
        error: 'Failed to claim rewards',
        isLoading: false,
      }));
      throw error;
    }
  }, [contractService, address, chainId, loadStakingData]);

  const getStakingStats = useCallback(() => {
    return {
      totalStaked: stakingState.totalStaked,
      exchangeRate: stakingState.exchangeRate,
      apy: stakingState.apy,
      totalStakers: '0', // Will be updated when we add staker counting
    };
  }, [stakingState]);

  return {
    ...stakingState,
    stakeKAIA,
    unstakeKAIA,
    claimRewards,
    loadStakingData,
    getStakingStats,
  };
};
