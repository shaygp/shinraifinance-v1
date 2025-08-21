import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { KAIA_CONFIG } from '@/config/kaia';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    provider: null,
    signer: null,
  });

  const switchToKairosNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x3E9', // 1001 in hex
            chainName: 'Kairos',
            nativeCurrency: {
              name: 'Kaia',
              symbol: 'KAIA',
              decimals: 18,
            },
            rpcUrls: ['https://public-en-kairos.node.kaia.io'],
            blockExplorerUrls: ['https://kairos.kaiascan.io'],
          },
        ],
      });
    } catch (error) {
      console.error('Failed to add Kairos network:', error);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true }));

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const network = await provider.getNetwork();
      const address = await signer.getAddress();

      // Check if user is on Kaia network, if not auto-switch to Kairos testnet
      if (network.chainId !== 8217 && network.chainId !== 1001) {
        try {
          console.log('Not on Kaia network, switching to Kairos testnet...');
          await switchToKairosNetwork();
          
          // Wait a bit for the network switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get updated network info after switch
          const updatedProvider = new ethers.providers.Web3Provider(window.ethereum);
          const updatedNetwork = await updatedProvider.getNetwork();
          const updatedSigner = updatedProvider.getSigner();
          const updatedAddress = await updatedSigner.getAddress();
          
          setWalletState({
            address: updatedAddress,
            chainId: updatedNetwork.chainId,
            isConnected: true,
            isConnecting: false,
            provider: updatedProvider,
            signer: updatedSigner,
          });
          
          console.log(`Switched to network: ${updatedNetwork.chainId}`);
          return;
        } catch (switchError) {
          console.error('Failed to switch network:', switchError);
          alert('Please manually switch to Kairos testnet (Chain ID: 1001) to use this application.');
        }
      }

      setWalletState({
        address,
        chainId: network.chainId,
        isConnected: true,
        isConnecting: false,
        provider,
        signer,
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // Reset wallet state directly instead of calling disconnectWallet
          setWalletState({
            address: null,
            chainId: null,
            isConnected: false,
            isConnecting: false,
            provider: null,
            signer: null,
          });
        } else {
          setWalletState(prev => ({ ...prev, address: accounts[0] }));
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', async (chainId: string) => {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const network = await provider.getNetwork();
          const address = await signer.getAddress();

          setWalletState(prev => ({
            ...prev,
            chainId: network.chainId,
            provider,
            signer,
            address,
          }));
        } catch (error) {
          console.error('Failed to handle chain change:', error);
          // If error, keep existing state but update chainId
          setWalletState(prev => ({
            ...prev,
            chainId: parseInt(chainId, 16),
          }));
        }
      });

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  }, [switchToKairosNetwork]);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      provider: null,
      signer: null,
    });
  }, []);

  const switchToKaiaNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x2019', // 8217 in hex
            chainName: 'Kaia',
            nativeCurrency: {
              name: 'Kaia',
              symbol: 'KAIA',
              decimals: 18,
            },
            rpcUrls: ['https://public-en.node.kaia.io'],
            blockExplorerUrls: ['https://kaiascan.io'],
          },
        ],
      });
    } catch (error) {
      console.error('Failed to add Kaia network:', error);
    }
  }, []);

  const isKaiaNetwork = useCallback(() => {
    return walletState.chainId === 8217 || walletState.chainId === 1001;
  }, [walletState.chainId]);

  useEffect(() => {
    // Check if wallet is already connected
    if (typeof window.ethereum !== 'undefined') {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            // Don't call connectWallet here to avoid infinite loop
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const network = await provider.getNetwork();
            const address = await signer.getAddress();

            setWalletState({
              address,
              chainId: network.chainId,
              isConnected: true,
              isConnecting: false,
              provider,
              signer,
            });

            // Set up event listeners
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
              if (accounts.length === 0) {
                // Reset wallet state directly
                setWalletState({
                  address: null,
                  chainId: null,
                  isConnected: false,
                  isConnecting: false,
                  provider: null,
                  signer: null,
                });
              } else {
                setWalletState(prev => ({ ...prev, address: accounts[0] }));
              }
            });

            window.ethereum.on('chainChanged', async (chainId: string) => {
              try {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const network = await provider.getNetwork();
                const address = await signer.getAddress();

                setWalletState(prev => ({
                  ...prev,
                  chainId: network.chainId,
                  provider,
                  signer,
                  address,
                }));
              } catch (error) {
                console.error('Failed to handle chain change:', error);
                setWalletState(prev => ({
                  ...prev,
                  chainId: parseInt(chainId, 16),
                }));
              }
            });
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      };
      
      checkConnection();
    }
  }, []); // Remove connectWallet dependency

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchToKaiaNetwork,
    switchToKairosNetwork,
    isKaiaNetwork,
  };
};
