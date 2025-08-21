# Shinrai Protocol - Smart Contracts

Shinrai Protocol is a comprehensive DeFi platform built natively for the Kaia blockchain. This repository contains all the smart contracts that power the Shinrai ecosystem, including liquid staking, lending, swapping, and yield farming.

## Overview

Shinrai Protocol is designed from the ground up for the Kaia blockchain, offering:
- **Liquid Staking**: Stake KAIA tokens with no lock-up periods
- **Lending & Borrowing**: Collateralized lending against staked assets
- **Token Swaps**: Automated market maker for token exchanges
- **Yield Farming**: Multiple liquidity pools with competitive APY

## Network Configuration

### Supported Networks
- **Kaia Mainnet**: Chain ID 8217
- **Kairos Testnet**: Chain ID 1001 (recommended for development)

### Environment Variables
Create a `.env` file with the following variables:

```bash
# Private key without 0x prefix
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Kaia mainnet RPC
KAIA_RPC=https://public-en.node.kaia.io

# Kairos testnet RPC
KAIROS_RPC=https://public-en-kairos.node.kaia.io

# Optional: Kaiascan API key for contract verification
KAIASCAN_API_KEY=your_api_key_here
```

## Smart Contracts

### Core Tokens
* **KAIA** — Native Kaia token (equivalent to ETH)
* **KUSD** — Stablecoin pegged to USD
* **WKAIA** — Wrapped Kaia for DeFi compatibility

### DeFi Protocols
* **KaiaDEX** — Automated Market Maker for token swaps
* **FarmContract** — Yield farming with multiple pools
* **LendingContract** — Collateralized lending system
* **StakingContract** — Liquid staking for KAIA tokens

### Core Infrastructure
* **Interaction** — Main user interface for deposits, withdrawals, and borrowing
* **Vault** — Core collateral management system
* **Oracle** — Price feeds for collateral assets

## Installation

```bash
# Clone the repository
git clone https://github.com/shaygp/shinraiv1.git
cd shinraiv1/contracts

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your variables
```

## Development

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Kairos Testnet
```bash
npx hardhat run scripts/deploy_kaia_tokens.js --network kairos
```

### Deploy to Kaia Mainnet
```bash
npx hardhat run scripts/deploy_kaia_tokens.js --network kaia
```

## Contract Addresses

### Kairos Testnet (Latest)
```json
{
  "KaiaDEX": "0xB6cD8565eB7e01382F6e2c6c355Ca58446faC688",
  "FarmContract": "0x297A22d10b56A5523C20a489404F24e018656601",
  "LendingContract": "0x78893fE1DDb2148249DedE89fb618D8d53E9aaa4",
  "KAIA": "0xb9563C346537427aa41876aa4720902268dCdB40",
  "KUSD": "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E",
  "WKAIA": "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773"
}
```

## Architecture

Shinrai Protocol follows a modular architecture:
- **Token Layer**: KAIA, KUSD, and WKAIA tokens
- **Protocol Layer**: Core DeFi functionality (staking, lending, swapping)
- **Interface Layer**: User-facing contracts for easy interaction
- **Oracle Layer**: Price feeds and market data

## Security

- All contracts inherit from OpenZeppelin's secure implementations
- Comprehensive testing suite with high coverage
- Supply caps and authorization controls
- Regular security audits and reviews

## Contributing

We welcome contributions from the community! Please see our contributing guidelines for more information.

## License

Shinrai Protocol is licensed under the MIT License.

## Support

- **Documentation**: [GitHub Wiki](https://github.com/shaygp/shinraiv1/wiki)
- **Issues**: [GitHub Issues](https://github.com/shaygp/shinraiv1/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shaygp/shinraiv1/discussions)

