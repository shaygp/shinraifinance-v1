export const KAIA_CONFIG = {
  // Network Information
  networks: {
    kaia: {
      chainId: 8217,
      name: "Kaia",
      rpcUrl: "https://public-en.node.kaia.io",
      explorer: "https://kaiascan.io",
      nativeCurrency: {
        name: "Kaia",
        symbol: "KAIA",
        decimals: 18,
      },
    },
    kairos: {
      chainId: 1001,
      name: "Kairos",
      rpcUrl: "https://public-en-kairos.node.kaia.io",
      explorer: "https://kairos.kaiascan.io",
      nativeCurrency: {
        name: "Kaia",
        symbol: "KAIA",
        decimals: 18,
      },
    },
  },

  // Token Addresses (updated with working deployed contracts)
  tokens: {
    kaia: {
      // Mainnet addresses - Using testnet addresses for now since contracts are deployed there
      KUSD: "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E",
      KAIA: "0xb9563C346537427aa41876aa4720902268dCdB40",
      WKAIA: "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773",
    },
    kairos: {
      // Testnet addresses - Working deployed contracts
      KUSD: "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E",
      KAIA: "0xb9563C346537427aa41876aa4720902268dCdB40",
      WKAIA: "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773",
    },
  },

  // Token Metadata
  tokenMetadata: {
    KUSD: {
      name: "Kaia USD",
      symbol: "KUSD",
      decimals: 18,
      logo: "/tokens/kusd.svg",
      description: "Kaia network stablecoin",
    },
    KAIA: {
      name: "Kaia",
      symbol: "KAIA",
      decimals: 18,
      logo: "/tokens/kaia.svg",
      description: "Native Kaia token",
    },
    WKAIA: {
      name: "Wrapped Kaia",
      symbol: "WKAIA",
      decimals: 18,
      logo: "/tokens/wkaia.svg",
      description: "Wrapped Kaia token for DeFi",
    },
  },

  // DeFi Protocol Addresses (updated with working deployed contracts)
  protocols: {
    kaia: {
      // Mainnet protocol addresses - Using testnet addresses for now since contracts are deployed there
      staking: "0x311E5D3aFd3DA55Eea05258754bD48606d8cfd7f",
      lending: "0x98534Ec8Ad5aE171920Bfb32B12F0486Bf13075a",
      swap: "0x0D797f37aC13B410ADa04743B5CFf34C4dDD7Fbb",
      farms: "0xff04F73911ed0270f0B91A1e5d51f5DcF9d5C489",
    },
    kairos: {
      // Testnet protocol addresses - Working deployed contracts
      staking: "0x311E5D3aFd3DA55Eea05258754bD48606d8cfd7f",
      lending: "0x98534Ec8Ad5aE171920Bfb32B12F0486Bf13075a",
      swap: "0x0D797f37aC13B410ADa04743B5CFf34C4dDD7Fbb",
      farms: "0xff04F73911ed0270f0B91A1e5d51f5DcF9d5C489",
    },
  },

  // Default Network (using testnet for development/testing)
  defaultNetwork: "kairos",

  // RPC Endpoints
  rpcEndpoints: {
    kaia: "https://public-en.node.kaia.io",
    kairos: "https://public-en-kairos.node.kaia.io",
  },

  // Explorer URLs
  explorers: {
    kaia: "https://kaiascan.io",
    kairos: "https://kairos.kaiascan.io",
  },
};

export const getNetworkConfig = (chainId: number) => {
  switch (chainId) {
    case 8217:
      return KAIA_CONFIG.networks.kaia;
    case 1001:
      return KAIA_CONFIG.networks.kairos;
    default:
      return KAIA_CONFIG.networks.kaia;
  }
};

export const getTokenAddress = (token: string, chainId: number) => {
  const network = chainId === 8217 ? "kaia" : "kairos";
  return KAIA_CONFIG.tokens[network][token];
};

export const getTokenMetadata = (token: string) => {
  return KAIA_CONFIG.tokenMetadata[token];
};

export const getProtocolAddress = (protocol: string, chainId: number) => {
  const network = chainId === 8217 ? "kaia" : "kairos";
  const address = KAIA_CONFIG.protocols[network]?.[protocol];
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error(`Protocol ${protocol} not deployed on ${network} (chainId: ${chainId})`);
  }
  return address;
};
