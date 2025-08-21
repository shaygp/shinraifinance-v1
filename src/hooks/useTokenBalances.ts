import { useState, useEffect, useCallback } from 'react';
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
      const [kaiaBalance, kusdBalance, wkaiaBalance] = await Promise.all([
        contractService.getKAIABalance(address, chainId),
        contractService.getKUSDBalance(address, chainId),
        contractService.getWKAIABalance(address, chainId),
      ]);

      // Mock prices for calculation (in production, fetch from oracle/API)
      const prices = {
        KAIA: 0.85,
        KUSD: 1.00,
        WKAIA: 0.85,
      };

      const tokenBalances: TokenBalance[] = [
        {
          symbol: 'KAIA',
          balance: kaiaBalance,
          value: (parseFloat(kaiaBalance) * prices.KAIA).toFixed(2),
        },
        {
          symbol: 'KUSD',
          balance: kusdBalance,
          value: (parseFloat(kusdBalance) * prices.KUSD).toFixed(2),
        },
        {
          symbol: 'WKAIA',
          balance: wkaiaBalance,
          value: (parseFloat(wkaiaBalance) * prices.WKAIA).toFixed(2),
        },
      ];

      setBalances(tokenBalances);
    } catch (error) {
      console.error('Error loading token balances:', error);
      setError('Failed to load token balances');
      setBalances([]);
    } finally {
      setIsLoading(false);
    }
  }, [contractService, address, chainId, isConnected]);

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

  // Auto-load balances when wallet connects or changes
  useEffect(() => {
    if (isConnected && chainId === 1001) { // Only on Kairos testnet
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
  };
};