import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContractService } from '@/services/contracts';

export interface TokenBalance {
  symbol: string;
  balance: string;
  value?: string;
}

export const useTokenBalances = (walletState: {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: any;
  signer: any;
}) => {
  const { address, chainId, isConnected, provider, signer } = walletState;
  const contractService = useContractService(provider, signer);

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBalances = useCallback(async () => {
    if (!contractService || !address || !chainId || !isConnected) {
      setBalances([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Always get native KAIA balance first
      const nativeKaiaBalance = await provider.getBalance(address);
      const formattedNativeBalance = ethers.utils.formatEther(nativeKaiaBalance);

      const tokenBalances: TokenBalance[] = [
        {
          symbol: 'KAIA',
          balance: formattedNativeBalance,
          value: (parseFloat(formattedNativeBalance) * 0.85).toFixed(2),
        },
      ];

      // Try to get ERC20 token balances, but don't fail if they don't exist
      try {
        const kusdBalance = await contractService.getKUSDBalance(address, chainId);
        tokenBalances.push({
          symbol: 'KUSD',
          balance: kusdBalance,
          value: (parseFloat(kusdBalance) * 1.00).toFixed(2),
        });
      } catch (error) {
        console.log('KUSD balance not available:', error.message);
        // Add KUSD with 0 balance
        tokenBalances.push({
          symbol: 'KUSD',
          balance: '0',
          value: '0.00',
        });
      }

      try {
        const wkaiaBalance = await contractService.getWKAIABalance(address, chainId);
        tokenBalances.push({
          symbol: 'WKAIA',
          balance: wkaiaBalance,
          value: (parseFloat(wkaiaBalance) * 0.85).toFixed(2),
        });
      } catch (error) {
        console.log('WKAIA balance not available:', error.message);
        // Add WKAIA with 0 balance
        tokenBalances.push({
          symbol: 'WKAIA',
          balance: '0',
          value: '0.00',
        });
      }

      setBalances(tokenBalances);
    } catch (error) {
      console.error('Error loading token balances:', error);
      setError('Failed to load token balances');
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  }, [contractService, address, chainId, isConnected, provider]);

  const getBalance = useCallback((symbol: string): string => {
    const token = balances.find(b => b.symbol === symbol);
    return token?.balance || '0';
  }, [balances]);

  const getTotalValue = useCallback((): string => {
    const total = balances.reduce((sum, token) => {
      return sum + parseFloat(token.value || '0');
    }, 0);
    return total.toFixed(2);
  }, [balances]);

  const refreshBalances = useCallback(() => {
    loadBalances();
  }, [loadBalances]);

  // Function to mint test tokens for users on Kairos testnet
  const mintTestTokens = useCallback(async () => {
    if (!contractService || !address || !chainId || chainId !== 1001) {
      throw new Error('Not connected to Kairos testnet');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Mint 1000 KUSD and KAIA tokens for testing
      const mintAmount = ethers.utils.parseEther('1000');
      
      try {
        const kusdContract = contractService.getKUSDContract(chainId);
        const mintTx1 = await kusdContract.mint(address, mintAmount);
        await mintTx1.wait();
        console.log('Minted 1000 KUSD');
      } catch (error) {
        console.log('KUSD mint failed:', error.message);
      }

      try {
        const kaiaContract = contractService.getKAIAContract(chainId);
        const mintTx2 = await kaiaContract.mint(address, mintAmount);
        await mintTx2.wait();
        console.log('Minted 1000 KAIA tokens');
      } catch (error) {
        console.log('KAIA token mint failed:', error.message);
      }

      // Wrap 50 KAIA to WKAIA for testing
      try {
        const wrapAmount = ethers.utils.parseEther('50');
        const wkaiaContract = contractService.getWKAIAContract(chainId);
        const wrapTx = await wkaiaContract.deposit({ value: wrapAmount });
        await wrapTx.wait();
        console.log('Wrapped 50 KAIA to WKAIA');
      } catch (error) {
        console.log('WKAIA wrap failed:', error.message);
      }

      // Refresh balances after minting
      await loadBalances();
    } catch (error) {
      console.error('Error minting test tokens:', error);
      setError('Failed to mint test tokens');
    } finally {
      setIsLoading(false);
    }
  }, [contractService, address, chainId, loadBalances]);

  // Auto-load balances when wallet connects or changes
  useEffect(() => {
    if (isConnected && chainId && (chainId === 1001 || chainId === 8217)) { // Kairos testnet or Kaia mainnet
      loadBalances();
    } else {
      setBalances([]);
    }
  }, [isConnected, chainId, address, loadBalances]);

  return {
    balances,
    isLoading,
    error,
    getBalance,
    getTotalValue,
    refreshBalances,
    loadBalances,
    mintTestTokens,
  };
};