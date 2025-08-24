# Shinrai Protocol - Kaia DeFi Platform

[![Shinrai Protocol](https://img.shields.io/badge/Shinrai-Protocol-00FF66?style=for-the-badge&logo=shield&logoColor=black)](https://github.com/shaygp/shinraiprotocol)
[![Kaia Network](https://img.shields.io/badge/Kaia-Network-00FF66?style=for-the-badge&logo=ethereum&logoColor=black)](https://kaia.io)
[![DeFi Platform](https://img.shields.io/badge/DeFi-Platform-00FF66?style=for-the-badge&logo=coins&logoColor=black)](https://shinraiprotocol.com)

> **The Future of Decentralized Finance on Kaia Blockchain**

Shinrai Protocol is a DeFi platform built on the Kaia blockchain, offering liquid staking, leveraged borrowing, token swaps and yield farming in one (HANA) interface.

## 🚀 Features

### DeFi Services
- **🔄 Liquid Staking** - Stake KAIA tokens with no lock-up periods (8.5% APY)
- **💰 Leveraged Borrowing** - Borrow stablecoins against staked assets (3.2% APR)
- **🔄 Token Swaps** - Optimized AMM with minimal slippage (0.3% fee)
- **🌱 Yield Farming** - Multiple liquidity pools with up to 45% APY

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **Ethers.js** for blockchain interaction
- **React Query** for state management

### Smart Contracts
- **KaiaDEX** - Automated Market Maker for token swaps
- **FarmContract** - Yield farming with multiple pools
- **LendingContract** - Collateralized borrowing system
- **Token Contracts** - KAIA, KUSD, WKAIA with full ERC-20 compliance

## 🌐 Networks

### Mainnet (Kaia)
- **Chain ID**: 8217
- **RPC URL**: `https://public-en.node.kaia.io`
- **Explorer**: [Kaiascan](https://kaiascan.io)

### Testnet (Kairos)
- **Chain ID**: 1001
- **RPC URL**: `https://public-en-kairos.node.kaia.io`
- **Explorer**: [Kairos Kaiascan](https://kairos.kaiascan.io)

## 📍 Contract Addresses

### Kairos Testnet (Latest Deployment)
```json
{
  "KaiaDEX": "0xB6cD8565eB7e01382F6e2c6c355Ca58446faC688",
  "FarmContract": "0x297A22d10b56A5523C20a489404F24e018656601",
  "LendingContract": "0x78893fE1DDb2148249DedE89fb618D8d53E9aaa4",
  "StakingContract": "0x1A42907c51923D98EF39A25C28ffCe06dbA90517",
  "KAIA": "0xb9563C346537427aa41876aa4720902268dCdB40",
  "KUSD": "0xD404E8AA4C73238CCFe5F1E61128015525DB4f4E",
  "WKAIA": "0x45A6c5faf002f1844E6Ef17dC11fA3FE76Adf773",
  "USDT": "0x0236e4da096053856cb659d628d7012cdf4b2985"
}
```

### Liquidity Pools
- **KAIA/KUSD LP** - Active with liquidity (Pool ID: `0x2d2074fd590e4f34a1b70de4466db80f792f1db086d8fb3aa15b523b129d55c9`)
- **KAIA/USDT LP** - Created, awaiting liquidity (Pool ID: `0x...`)
- **KAIA/WKAIA LP** - Available for creation
- **KUSD/WKAIA LP** - Available for creation

## 📊 Current Status

### Deployment Status
- ✅ **Smart Contracts**: Deployed and verified on Kairos testnet
- ✅ **Frontend**: Deployed on Vercel
- ✅ **DEX**: Functional with KAIA/KUSD liquidity
- ✅ **Staking**: Ready for testing
- 🔄 **USDT Swaps**: Pool created, awaiting USDT liquidity

### Test Results
- **Network Connection**: ✅ Connected to Kairos testnet (Chain ID: 1001)
- **Contract Verification**: ✅ All contracts verified and functional
- **Liquidity Addition**: ✅ Successfully added 1000 KAIA + 1000 KUSD
- **Pool Creation**: ✅ KAIA/USDT pool created successfully

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- KAIA tokens for testing (available on Kairos testnet)

### Installation
```bash
# Clone the repository
git clone https://github.com/shaygp/shinraiprotocol.git
cd shinraiprotocol

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── hooks/              # Custom React hooks
├── services/           # Blockchain and API services
├── config/             # Configuration files
├── contexts/           # React contexts
└── assets/             # Static assets
```

### Key Components
- **Header** - Navigation and wallet connection
- **HeroSection** - Landing page hero with CTA
- **FeaturesSection** - DeFi features overview
- **Stake** - Liquid staking interface
- **Borrow** - Lending and borrowing
- **Swap** - Token exchange
- **Farms** - Yield farming
- **Portfolio** - User asset management

## 🔐 Security

### Smart Contract Security
- Built on OpenZeppelin's secure implementations
   error handling and validation
- Supply caps prevent unlimited minting
- Authorization controls on critical functions

### Frontend Security
- Secure wallet integration
- Input validation and sanitization
- HTTPS enforcement
- Regular dependency updates

## 📊 Tokenomics

### KAIA Token
- **Symbol**: KAIA
- **Decimals**: 18
- **Purpose**: Native network token for staking and governance
- **Supply Cap**: Managed through smart contracts

### USDT Stablecoin
- **Symbol**: USDT
- **Decimals**: 18
- **Purpose**: Stable value token for DeFi operations
- **Peg**: USD equivalent

### WKAIA (Wrapped KAIA)
- **Symbol**: WKAIA
- **Decimals**: 18
- **Purpose**: ERC-20 wrapper for native KAIA
- **Features**: Deposit/withdraw functionality


## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines and submit pull requests for any improvements.

### Development Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Website**: (https://shinraiprotocol.vercel.app/))
- **Documentation**: [docs.shinraiprotocol.com](https://docs.shinraiprotocol.com)
- **DoraHacks Build**: (https://dorahacks.io/buidl/31428)
- **Kaia Network**: [kaia.io](https://kaia.io)


---

<div align="center">


[![Shinrai Protocol](https://img.shields.io/badge/Shinrai-Protocol-00FF66?style=for-the-badge&logo=shield&logoColor=black)](https://github.com/shaygp/shinraiprotocol)

</div>
