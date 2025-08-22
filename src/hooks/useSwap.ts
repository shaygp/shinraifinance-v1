import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useContractService } from '@/services/contracts';
import { useWallet } from './useWallet';
import { getTokenMetadata, getTokenAddress, getProtocolAddress } from '@/config/kaia';

export interface SwapState {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  isLoading: boolean;
  error: string | null;
  priceImpact: string;
  exchangeRate: string;
  gasEstimate: string;
}

export const useSwap = (walletState: {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  provider: any;
  signer: any;
}) => {
  const { address, chainId, isConnected, provider, signer } = walletState;
  const contractService = useContractService(provider, signer);

  const [swapState, setSwapState] = useState<SwapState>({
    fromToken: 'KAIA',
    toToken: 'KUSD',
    fromAmount: '',
    toAmount: '',
    slippage: 0.5,
    isLoading: false,
    error: null,
    priceImpact: '0.1',
    exchangeRate: '0.85',
    gasEstimate: '0.001',
  });

  const getTokenBalance = useCallback(async (token: string) => {
    if (!contractService || !address || !chainId) return '0';

    try {
      switch (token) {
        case 'KAIA':
          return await contractService.getKAIABalance(address, chainId);
        case 'KUSD':
          return await contractService.getKUSDBalance(address, chainId);
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

  const calculateSwapOutput = useCallback(async (fromToken: string, toToken: string, amount: string) => {
    if (!amount || parseFloat(amount) === 0 || !contractService || !chainId) {
      setSwapState(prev => ({ ...prev, toAmount: '', priceImpact: '0', error: null }));
      return;
    }

    setSwapState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check user balance first
      const userBalance = await getTokenBalance(fromToken);
      if (parseFloat(userBalance) < parseFloat(amount)) {
        setSwapState(prev => ({
          ...prev,
          toAmount: '',
          priceImpact: '0',
          isLoading: false,
          error: `Insufficient ${fromToken} balance. Available: ${parseFloat(userBalance).toFixed(4)} ${fromToken}`,
        }));
        return;
      }

      // Get token addresses
      const fromTokenAddress = getTokenAddress(fromToken, chainId);
      const toTokenAddress = getTokenAddress(toToken, chainId);
      
      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error('Token addresses not found for this network');
      }

      // Get quote from DEX contract or calculate mock quote for testing
      let outputAmount: string;
      try {
        outputAmount = await contractService.getSwapQuote(
          fromTokenAddress,
          toTokenAddress,
          amount,
          chainId
        );
      } catch (error) {
        console.log('DEX quote failed, using estimated rate:', error);
        // Provide estimated exchange rates for Kairos testnet
        const rates: { [key: string]: { [key: string]: number } } = {
          'KAIA': { 'KUSD': 0.85, 'WKAIA': 1.0 },
          'KUSD': { 'KAIA': 1.18, 'WKAIA': 1.18 },
          'WKAIA': { 'KAIA': 1.0, 'KUSD': 0.85 }
        };
        
        const rate = rates[fromToken]?.[toToken] || 0.85;
        outputAmount = (parseFloat(amount) * rate).toFixed(6);
      }

      if (!outputAmount || parseFloat(outputAmount) === 0) {
        throw new Error('No liquidity available for this trading pair');
      }

      // Calculate exchange rate
      const rate = parseFloat(outputAmount) / parseFloat(amount);

      // Calculate price impact based on pool reserves
      try {
        const poolInfo = await contractService.getPoolInfo(fromTokenAddress, toTokenAddress, chainId);
        const reserveFrom = parseFloat(poolInfo.reserveA);
        const reserveTo = parseFloat(poolInfo.reserveB);
        
        if (reserveFrom === 0 || reserveTo === 0) {
          throw new Error('No liquidity in this pool');
        }

        // More accurate price impact calculation
        const priceImpact = reserveFrom > 0 ? ((parseFloat(amount) / reserveFrom) * 100).toFixed(2) : '0.1';
        
        setSwapState(prev => ({
          ...prev,
          toAmount: parseFloat(outputAmount).toFixed(6),
          exchangeRate: rate.toFixed(6),
          priceImpact,
          isLoading: false,
          gasEstimate: '0.002', // Updated gas estimate
        }));
      } catch (poolError) {
        // If pool info fails, use the quote but with estimated price impact
        const priceImpact = parseFloat(amount) > 1000 ? '2.0' : parseFloat(amount) > 100 ? '0.5' : '0.1';
        
        setSwapState(prev => ({
          ...prev,
          toAmount: parseFloat(outputAmount).toFixed(6),
          exchangeRate: rate.toFixed(6),
          priceImpact,
          isLoading: false,
          gasEstimate: '0.002',
        }));
      }

    } catch (error) {
      console.error('Error calculating swap output:', error);
      setSwapState(prev => ({ 
        ...prev, 
        toAmount: '',
        priceImpact: '0',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to calculate swap output. Please try again.'
      }));
    }
  }, [contractService, chainId, getTokenBalance]);

  const updateFromAmount = useCallback(async (amount: string) => {
    setSwapState(prev => ({ ...prev, fromAmount: amount, error: null }));
    await calculateSwapOutput(swapState.fromToken, swapState.toToken, amount);
  }, [swapState.fromToken, swapState.toToken, calculateSwapOutput]);

  const updateToAmount = useCallback(async (amount: string) => {
    setSwapState(prev => ({ ...prev, toAmount: amount, error: null }));
    
    if (!amount || parseFloat(amount) === 0) {
      setSwapState(prev => ({ ...prev, fromAmount: '' }));
      return;
    }

    try {
      // Note: Reverse calculation (from output to input) would require additional DEX contract methods
      // For now, we handle forward calculation only (from input to output)
      console.warn('Reverse swap calculation not implemented - use forward calculation instead');

    } catch (error) {
      console.error('Error calculating reverse swap:', error);
    }
  }, [swapState.fromToken, swapState.toToken]);

  const switchTokens = useCallback(() => {
    setSwapState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  }, []);

  const setSlippage = useCallback((slippage: number) => {
    setSwapState(prev => ({ ...prev, slippage }));
  }, []);

  const executeSwap = useCallback(async () => {
    if (!contractService || !address || !chainId) {
      throw new Error('Wallet not connected');
    }

    if (!swapState.fromAmount || !swapState.toAmount) {
      throw new Error('Invalid swap amounts');
    }

    setSwapState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check balances
      const fromBalance = await getTokenBalance(swapState.fromToken);
      if (parseFloat(fromBalance) < parseFloat(swapState.fromAmount)) {
        throw new Error(`Insufficient ${swapState.fromToken} balance`);
      }

      // Get token addresses
      const fromTokenAddress = getTokenAddress(swapState.fromToken, chainId);
      const toTokenAddress = getTokenAddress(swapState.toToken, chainId);
      
      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error('Token addresses not found');
      }

      // Get DEX contract address for approval
      const dexAddress = getProtocolAddress('swap', chainId);
      
      // Approve tokens for DEX contract
      switch (swapState.fromToken) {
        case 'KAIA':
          await contractService.approveKAIA(dexAddress, swapState.fromAmount, chainId);
          break;
        case 'KUSD':
          await contractService.approveKUSD(dexAddress, swapState.fromAmount, chainId);
          break;
        case 'WKAIA':
          await contractService.approveWKAIA(dexAddress, swapState.fromAmount, chainId);
          break;
      }

      // Calculate minimum amount out with slippage tolerance
      const minAmountOut = (parseFloat(swapState.toAmount) * (1 - swapState.slippage / 100)).toFixed(6);

      // Execute swap
      const tx = await contractService.swapTokens(
        fromTokenAddress,
        toTokenAddress,
        swapState.fromAmount,
        minAmountOut,
        chainId
      );

      // Reset form
      setSwapState(prev => ({
        ...prev,
        fromAmount: '',
        toAmount: '',
        isLoading: false,
      }));

      return { success: true, txHash: tx.transactionHash || tx.hash };

    } catch (error) {
      console.error('Error executing swap:', error);
      setSwapState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to execute swap',
        isLoading: false,
      }));
      throw error;
    }
  }, [contractService, address, chainId, swapState, getTokenBalance]);

  const getSwapQuote = useCallback(async () => {
    if (!swapState.fromAmount || !swapState.fromToken || !swapState.toToken) {
      return null;
    }

    try {
      const quote = {
        fromToken: swapState.fromToken,
        toToken: swapState.toToken,
        fromAmount: swapState.fromAmount,
        toAmount: swapState.toAmount,
        exchangeRate: swapState.exchangeRate,
        priceImpact: swapState.priceImpact,
        gasEstimate: swapState.gasEstimate,
        minimumReceived: (parseFloat(swapState.toAmount) * (1 - swapState.slippage / 100)).toFixed(6),
      };

      return quote;
    } catch (error) {
      console.error('Error getting swap quote:', error);
      return null;
    }
  }, [swapState]);

  return {
    ...swapState,
    updateFromAmount,
    updateToAmount,
    switchTokens,
    setSlippage,
    executeSwap: executeSwap,
    swapTokens: executeSwap, // Alias for compatibility
    getSwapQuote,
    getTokenBalance,
  };
};
