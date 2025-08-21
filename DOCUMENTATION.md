# 🚀 Shinrai Protocol - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Smart Contracts](#smart-contracts)
5. [Frontend](#frontend)
6. [Deployment](#deployment)
7. [Testing](#testing)
8. [Usage Guide](#usage-guide)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)
11. [Development](#development)

---

## 🎯 Project Overview

**Shinrai Protocol** is a DeFi platform built on the Kaia network, offering liquid staking, collateralized borrowing, token swapping and yield farming. The platform is designed to provide users with a complete DeFi experience with real smart contract integration.

### 🌟 Key Features
- **Liquid Staking**: Stake KAIA tokens and receive stKAIA
- **Token Swapping**: Swap between KAIA, KUSD, and WKAIA
- **Yield Farming**: Provide liquidity and earn rewards
- **Collateralized Borrowing**: Borrow against staked assets
- **Portfolio Management**: Track all positions and earnings

### 🔗 Live URLs
- **🌐 Production**: https://shinraiprotocol-l9q5hk0vp-shaygps-projects.vercel.app
- **🔍 Inspect**: https://vercel.com/shaygps-projects/shinraiprotocol/GPcvAgoQFX17S3SeJVuTtrNFRSw9

---

## 🏗️ Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart         │    │   Kaia          │
│   (React + TS)  │◄──►│   Contracts     │◄──►│   Network       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Hardhat       │    │   Kairos        │
│   Deployment    │    │   Deployment    │    │   Testnet       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Shadcn UI + Tailwind CSS
- **Blockchain**: Ethers.js v5
- **Smart Contracts**: Solidity 0.8.10 + OpenZeppelin
- **Deployment**: Hardhat + Vercel
- **State Management**: React Hooks + Context API

---

## ✨ Features

### 1. 🏦 Liquid Staking
- **Contract**: `StakingContract.sol`
- **Address**: `0x1A42907c51923D98EF39A25C28ffCe06dbA90517` (Kairos)
- **Features**:
  - Stake KAIA tokens
  - Receive stKAIA tokens
  - Earn staking rewards
  - Unstake anytime
  - 100% APY (testnet)

### 2. 💱 Token Swapping
- **Supported Tokens**: KAIA, KUSD, WKAIA
- **Features**:
  - Real-time price calculations
  - Slippage protection
  - Gas estimation
  - Balance checking

### 3. 🌾 Yield Farming
- **Available Farms**:
  - KAIA/KUSD (45.2% APY)
  - stKAIA/KAIA (38.5% APY)
  - KUSD/KAIA (28.7% APY)
  - WKAIA/KAIA (52.1% APY)
- **Features**:
  - Stake/unstake LP tokens
  - Harvest rewards
  - Risk level indicators

### 4. 💰 Collateralized Borrowing
- **Supported Collateral**: stKAIA, KAIA, WKAIA
- **Borrow Assets**: KUSD
- **Features**:
  - Up to 90% LTV
  - Health factor monitoring
  - Liquidation protection

### 5. 📊 Portfolio Dashboard
- **Features**:
  - Total portfolio value
  - Position overview
  - Transaction history
  - Real-time balances
  - Performance metrics

---

## 🔐 Smart Contracts

### Deployed Contracts (Kairos Testnet)

| Contract | Address | Purpose |
|----------|---------|---------|
| **KUSD** | `0xa83F9277F984DF0056E7E690016c1eb4FC5757ca` | Kaia USD Stablecoin |
| **KAIA** | `0x6f98B89E70aCb7FE3b8f07BAAb54bF15Ff3e21e6` | Native Kaia Token |
| **WKAIA** | `0x5ED23A5b8f76E202De46a608a66e6FE25060f4A6` | Wrapped Kaia Token |
| **Staking** | `0x1A42907c51923D98EF39A25C28ffCe06dbA90517` | Liquid Staking |

### Contract Architecture

#### KUSD.sol (Kaia USD Stablecoin)
```solidity
// Features:
- ERC20 standard with 18 decimals
- Mintable by authorized accounts
- Burnable by token holders
- Initial supply: 1 billion KUSD
- Network-specific initialization
```

#### KAIA.sol (Native Kaia Token)
```solidity
// Features:
- ERC20 standard with 18 decimals
- Mintable by authorized accounts
- Burnable by token holders
- Initial supply: 1 billion KAIA
- Network-specific initialization
```

#### WKAIA.sol (Wrapped Kaia)
```solidity
// Features:
- WETH-like functionality
- Deposit/withdraw native KAIA
- ERC20 compatibility
- 1:1 backing with native KAIA
```

#### StakingContract.sol
```solidity
// Features:
- Stake KAIA tokens
- Receive stKAIA tokens
- Automatic reward calculation
- Emergency withdrawal functions
- Reentrancy protection
```

---

## 🎨 Frontend

### Component Structure
```
src/
├── components/
│   ├── ui/           # Shadcn UI components
│   ├── Header.tsx    # Navigation + wallet connection
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   └── StatsSection.tsx
├── hooks/
│   ├── useWallet.ts      # Wallet management
│   ├── useStaking.ts     # Staking functionality
│   ├── useSwap.ts        # Token swapping
│   ├── useBorrow.ts      # Borrowing functionality
│   ├── useFarms.ts       # Yield farming
│   └── usePortfolio.ts   # Portfolio management
├── pages/
│   ├── Index.tsx         # Landing page
│   ├── Stake.tsx         # Staking interface
│   ├── Swap.tsx          # Token swapping
│   ├── Borrow.tsx        # Borrowing interface
│   ├── Farms.tsx         # Yield farming
│   └── Portfolio.tsx     # Portfolio dashboard
├── services/
│   └── contracts.ts      # Contract interaction service
├── contexts/
│   └── WalletContext.tsx # Global wallet state
└── config/
    └── kaia.ts           # Network configuration
```

### Key Hooks

#### useWallet
```typescript
// Manages wallet connection and network state
const {
  address,           // Connected wallet address
  chainId,          // Current network ID
  isConnected,      // Wallet connection status
  isConnecting,     // Connection in progress
  connectWallet,    // Connect wallet function
  disconnectWallet, // Disconnect wallet function
  switchToKaiaNetwork,    // Switch to Kaia mainnet
  switchToKairosNetwork,  // Switch to Kairos testnet
  isKaiaNetwork     // Check if on Kaia network
} = useWallet();
```

#### useStaking
```typescript
// Manages staking operations
const {
  stakedAmount,     // User's staked amount
  stKAIABalance,    // stKAIA token balance
  totalStaked,      // Total protocol TVL
  apy,             // Annual percentage yield
  stakeKAIA,       // Stake function
  unstakeKAIA,     // Unstake function
  claimRewards,    // Claim rewards function
  loadStakingData  // Load staking data
} = useStaking(walletState);
```

#### useSwap
```typescript
// Manages token swapping
const {
  fromToken,        // Token to swap from
  toToken,          // Token to swap to
  fromAmount,       // Amount to swap
  toAmount,         // Expected output
  slippage,         // Slippage tolerance
  swapTokens,       // Execute swap
  getTokenBalance   // Get token balance
} = useSwap(walletState);
```

---

## 🚀 Deployment

### Smart Contract Deployment

#### Prerequisites
```bash
# Install dependencies
cd contracts
npm install

# Set up environment variables
cp .env.example .env
# Add your private key and RPC URLs
```

#### Environment Variables
```env
DEPLOYER_PRIVATE_KEY=0x1824fec805082d0ec3416b0040e82729d01c2930b16460d8906c3499b0d535e0
KAIA_RPC=https://public-en.node.kaia.io
KAIROS_RPC=https://public-en-kairos.node.kaia.io
```

#### Deploy Commands
```bash
# Deploy tokens to Kairos testnet
npx hardhat run scripts/deploy_kaia_tokens.js --network kairos

# Deploy staking contract
npx hardhat run scripts/deploy_staking_contract.js --network kairos

# Deploy to Kaia mainnet (when ready)
npx hardhat run scripts/deploy_kaia_tokens.js --network kaia
```

### Frontend Deployment

#### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

#### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

---

## 🧪 Testing

### Smart Contract Testing
```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/StakingContract.test.js

# Run with coverage
npx hardhat coverage

# Run on specific network
npx hardhat test --network kairos
```

### Frontend Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Manual Testing Checklist

#### Wallet Connection
- [ ] MetaMask connection works
- [ ] Network switching works (Kaia/Kairos)
- [ ] Account switching works
- [ ] Disconnection works

#### Staking
- [ ] View staking stats
- [ ] Stake KAIA tokens
- [ ] View stKAIA balance
- [ ] Unstake tokens
- [ ] Claim rewards

#### Swapping
- [ ] Select tokens
- [ ] Enter amounts
- [ ] View exchange rate
- [ ] Execute swap
- [ ] View updated balances

#### Farming
- [ ] View available farms
- [ ] Stake in farms
- [ ] View earned rewards
- [ ] Harvest rewards
- [ ] Unstake from farms

#### Portfolio
- [ ] View total value
- [ ] View positions
- [ ] View transaction history
- [ ] Refresh data

---

## 📖 Usage Guide

### Getting Started

#### 1. Connect Wallet
1. Visit the application
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. Switch to Kairos testnet (Chain ID: 1001)

#### 2. Get Test Tokens
1. Navigate to the staking page
2. View your KAIA balance
3. If balance is 0, you'll need testnet tokens

#### 3. Start Staking
1. Enter amount to stake
2. Click "Stake KAIA"
3. Approve token spending
4. Confirm transaction
5. View your stKAIA balance

#### 4. Explore Other Features
- **Swap**: Exchange tokens
- **Farm**: Provide liquidity
- **Borrow**: Use staked assets as collateral
- **Portfolio**: Track all positions

### Network Configuration

#### Kairos Testnet
- **Chain ID**: 1001
- **RPC URL**: https://public-en-kairos.node.kaia.io
- **Explorer**: https://kairos.kaiascan.io
- **Currency**: KAIA

#### Kaia Mainnet
- **Chain ID**: 8217
- **RPC URL**: https://public-en.node.kaia.io
- **Explorer**: https://kaiascan.io
- **Currency**: KAIA

---

## 🔌 API Reference

### Contract Service

#### getKAIABalance(address, chainId)
```typescript
// Get KAIA token balance for an address
const balance = await contractService.getKAIABalance(
  "0x1234...", 
  1001
);
// Returns: "1000.0" (string)
```

#### getKUSDBalance(address, chainId)
```typescript
// Get KUSD token balance for an address
const balance = await contractService.getKUSDBalance(
  "0x1234...", 
  1001
);
// Returns: "500.0" (string)
```

#### approveKAIA(spender, amount, chainId)
```typescript
// Approve spender to spend KAIA tokens
const tx = await contractService.approveKAIA(
  "0x5678...", 
  "100.0", 
  1001
);
// Returns: Transaction object
```

### Wallet Hook

#### connectWallet()
```typescript
// Connect to MetaMask or other Web3 wallet
await connectWallet();
// Updates wallet state automatically
```

#### switchToKairosNetwork()
```typescript
// Switch to Kairos testnet
await switchToKairosNetwork();
// Adds network if not present
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Wallet Connection Problems
**Problem**: "Connect Wallet" button stuck in loading
**Solution**: 
1. Check MetaMask installation
2. Ensure MetaMask is unlocked
3. Check browser console for errors
4. Try refreshing the page

#### Network Issues
**Problem**: Wrong network error
**Solution**:
1. Switch to Kairos testnet (Chain ID: 1001)
2. Add network manually if not present
3. Check RPC URL configuration

#### Transaction Failures
**Problem**: Transactions failing
**Solution**:
1. Check wallet balance
2. Ensure sufficient gas
3. Verify network connection
4. Check contract addresses

#### Build Errors
**Problem**: Build fails
**Solution**:
1. Clear node_modules and reinstall
2. Check TypeScript errors
3. Verify import paths
4. Check for syntax errors

### Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `HH8` | Invalid private key | Check .env file format |
| `HH9` | Network not found | Verify network configuration |
| `HH12` | Insufficient funds | Add funds to deployer account |
| `HH15` | Contract deployment failed | Check contract code and gas |

---

## 👨‍💻 Development

### Development Environment Setup

#### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask browser extension
- Git

#### Local Setup
```bash
# Clone repository
git clone <repository-url>
cd kaia-launchpad-studio

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

#### Code Style
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent formatting
- **Husky**: Pre-commit hooks

### Adding New Features

#### 1. Create Hook
```typescript
// src/hooks/useNewFeature.ts
export const useNewFeature = (walletState) => {
  // Implementation
};
```

#### 2. Create Component
```typescript
// src/components/NewFeature.tsx
import { useNewFeature } from '@/hooks/useNewFeature';

export const NewFeature = () => {
  // Component implementation
};
```

#### 3. Add Route
```typescript
// src/App.tsx
<Route path="/new-feature" element={<NewFeature />} />
```

#### 4. Update Navigation
```typescript
// src/components/Header.tsx
<Link to="/new-feature">New Feature</Link>
```

### Testing New Features

#### Unit Tests
```bash
# Run specific test
npm test -- useNewFeature.test.ts

# Run with coverage
npm run test:coverage
```

#### Integration Tests
```bash
# Test with real contracts
npm run test:integration
```

---

## 📈 Performance & Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports for routes
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo and useMemo
- **Bundle Analysis**: Webpack bundle analyzer

### Smart Contract Optimization
- **Gas Optimization**: Efficient storage patterns
- **Batch Operations**: Multiple operations in single transaction
- **View Functions**: Read-only functions for data
- **Events**: Efficient event logging

### Network Optimization
- **RPC Caching**: Cache frequently accessed data
- **Batch Requests**: Multiple RPC calls in single request
- **Connection Pooling**: Reuse connections
- **Fallback RPCs**: Multiple RPC endpoints

---

## 🔒 Security

### Smart Contract Security
- **OpenZeppelin**: Battle-tested contracts
- **Reentrancy Protection**: Prevent reentrancy attacks
- **Access Control**: Role-based permissions
- **Emergency Functions**: Pause and emergency withdrawal
- **Audit Ready**: Clean, documented code

### Frontend Security
- **Input Validation**: Client-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Secure API calls
- **Secure Storage**: Encrypted local storage

### Network Security
- **HTTPS Only**: Secure connections
- **RPC Validation**: Verified RPC endpoints
- **Transaction Signing**: Secure wallet integration
- **Network Verification**: Chain ID validation

---

## 🚀 Future Roadmap

### Phase 1 (Current)
- [x] Basic DeFi functionality
- [x] Smart contract deployment
- [x] Frontend integration
- [x] Testnet launch

### Phase 2 (Next)
- [ ] Advanced farming strategies
- [ ] Governance token (SHINRAI)
- [ ] Cross-chain bridges
- [ ] Mobile app

### Phase 3 (Future)
- [ ] DAO governance
- [ ] Advanced DeFi products
- [ ] Institutional features
- [ ] Multi-chain expansion

---

## 📞 Support & Community

### Getting Help
- **Documentation**: This document
- **GitHub Issues**: Report bugs and feature requests
- **Discord**: Community discussions
- **Telegram**: Announcements and support

### Contributing
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code of Conduct
- Be respectful and inclusive
- Help others learn
- Follow best practices
- Maintain code quality

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Kaia Network**: For blockchain infrastructure
- **OpenZeppelin**: For secure smart contracts
- **Shadcn UI**: For beautiful UI components
- **Vercel**: For hosting and deployment
- **Hardhat**: For development framework

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready (Testnet)
