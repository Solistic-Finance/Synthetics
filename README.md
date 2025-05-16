# Solistic Finance: Decentralized Synthetic Assets on Solana

## 🚀 Overview
Solistic Finance is a decentralized protocol on Solana that enables users to mint, trade, and redeem synthetic assets that track real-world securities, commodities, and other financial instruments—all without requiring direct ownership of the underlying assets.

## 💡 How It Works
### Non-Custodial Synthetic Assets

**Order Placement & Matching:**
When a user places an order to buy a synthetic asset, it gets matched via a broker who:
- Purchases the underlying asset
- Posts collateral to issue an inverse synthetic asset
- Maintains delta neutrality while earning fees

Alternatively, bearish users can purchase inverse synthetic assets, resulting in the minting of synthetic assets.

**Market Creation:**
Using price feeds, we can easily enable any global market on-chain, making previously inaccessible markets available to anyone.

**Asset Utility:**
Synthetic assets are fully transferable and composable throughout the entire Solana ecosystem:
- Trade on DEXs like Raydium and Jupiter
- Use as collateral on lending platforms like Solend and Kamino
- Integrate with other DeFi protocols

**Trustless Architecture:**
Our model eliminates the need for a central custodian holding assets, removing counterparty risk and creating a truly decentralized financial system.

## 🏆 Hackathon Sprint
For the hackathon, we've built three synthetic stocks on testnet:
- Apple (AAPL)
- Tesla (TSLA)
- NVIDIA (NVDA)

**Features include:**
- Complete order matching system
- Liquidity pools for each asset
- Ability to mint synthetic assets
- Ability to mint inverse synthetic assets
- Redemption functionality for converting back to USD

## 🌎 Vision
Solistic Finance aims to bridge global financial markets by serving two key user segments:

### Emerging Market Users
Users in developing economies can gain exposure to US and European markets that may be otherwise difficult to access due to:
- Capital controls
- High fees from traditional brokers
- Limited market access
- Currency restrictions

### Developed Market Users
Investors in the US and Europe can easily access exposure to Chinese markets and other international opportunities that face:
- Regulatory hurdles
- Limited trading hours
- Complex account requirements
- High minimum investments

By democratizing access to global markets through our synthetic assets platform, we're creating a borderless financial system where anyone can participate in worldwide economic growth.

## 📋 Technology Stack
- **Solana Blockchain**
- **Rust** (for on-chain programs)
- **TypeScript** (for frontend and SDK)
- **Oracle Integration** for Price Feeds

## 📁 Repository Structure
- **backend/**: High-performance backend API
- **client-app/**: Modern frontend client
- **smart-contracts/**: On-chain Solana programs
