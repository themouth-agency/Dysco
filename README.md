# Dysco - Decentralized Coupon Platform on Hedera

**A revolutionary coupon platform leveraging Hedera's NFT technology to create authentic, tradeable, and secure digital coupons.**

### Quick demo instruction: go to [Dysco.at](https://Dysco.at/)

### Hashscan links of scenarios
- [Custodial wallet creation -> same keys as operator 0.0.1293](https://hashscan.io/testnet/transaction/1754694135.076115000)
- [Non-Custodial wallet creation -> newly generated keys, user owned](https://hashscan.io/testnet/transaction/1754681559.442265156)
- [NFT collection create](https://hashscan.io/testnet/transaction/1754211846.115015241)
- [Coupon minting](https://hashscan.io/testnet/transaction/1754679995.398662627)
- [Coupon claim](https://hashscan.io/testnet/transaction/1754681632.177182914)
- [Coupon redeem -> wipe](https://hashscan.io/testnet/transaction/1754681664.687032000)

ALL FEES ABSTRACTED, PAID FOR BY DYSCO OPERATOR


## 🏆 Hackathon Submission Overview

Dysco transforms traditional coupon marketing by making digital coupons:
- **Authentic** - Each coupon is a unique NFT on Hedera, preventing counterfeiting
- **Tradeable** - Users can trade coupons in secondary markets
- **Secure** - Hedera's hashgraph consensus ensures tamper-proof redemption
- **Instant** - Near-zero transaction fees and 3-5 second finality
- **Discoverable** - Users can explore campaigns from multiple merchants

## 🌟 How Dysco Leverages Hedera Network

### 1. **NFT-Based Coupons**
- Each coupon is minted as a unique NFT (HTS - Hedera Token Service)
- Prevents duplication and counterfeiting
- Enables ownership verification and transfer

### 2. **Merchant Collections**
- Each merchant has their own NFT collection
- Branded collections build merchant identity
- Easy campaign management and analytics

### 3. **Hedera Mirror Node Integration**
- Real-time NFT ownership verification
- Fast coupon discovery and user portfolio tracking
- No need for centralized coupon database

### 4. **Instant Redemption**
- NFT burning/wiping for coupon redemption
- 3-5 second transaction finality
- Near-zero fees for Dysco, zero fees for user

### 5. **Full Abstraction**
- Consumer has non-custodial wallet, but fees are abstracted and covered by Dysco
- Merchant does not have to worry about complicated web3 tech: custodial wallet with fee abstraction
- We don't talk about HBAR-no-no, fueling the infrastructure without the user knowing it

## 🚀 Key Features

### For Merchants
- **Campaign Creation**: Create time-limited coupon campaigns
- **Bulk Minting**: Mint multiple coupons with a single button
- **Real-time Analytics**: Track redemptions and campaign performance
- **Flexible Discounts**: Percentage or fixed amount discounts
- **E-Commerce Ready**: with the couponcode function

### For Users
- **Coupon Discovery**: Browse available campaigns from  merchants
- **Digital Hedera Wallet**: Store and manage NFT coupons
- **QR Code Redemption**: Easy in-store redemption via QR codes
- **Tradeable Assets**: Transfer coupons to other users (future functionality)

## 🏗️ Technical Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │     Backend     │    │  Hedera Network │
│   (React Native)│◄──►│   (Node.js)     │◄──►│   (Testnet)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐             ┌─────────┐             ┌─────────┐
    │ Supabase│             │ Railway │             │ Mirror  │
    │ (Auth)  │             │ (Host)  │             │  Node   │
    └─────────┘             └─────────┘             └─────────┘
```

### Tech Stack
- **Frontend**: React Native (Expo) - Cross-platform mobile app
- **Backend**: Node.js + Express - API server and Hedera integration
- **Database**: Supabase - User authentication and merchant data
- **DLT**: Hedera (Testnet) - NFT minting and management, accounts
- **Hosting**: Railway (Backend), Digital Ocean (Mobile)

## 📱 Demo Instructions

### Prerequisites
- Expo Go app on your mobile device
- Hedera testnet account (we can provide test accounts)

### Live Demo
1. **User Experience**:
   - Scan QR code: (Dysco.at)[https://dysco.at]
   - Browse "Discover" tab to see available campaigns
   - Claim a coupon to receive NFT in your wallet
   - View "My Coupons" to see your NFT collection

2. **Merchant Experience**:
   - Create merchant account in the app (or fill in using demo details)
   - Create a new campaign with discount details
   - Mint coupons for your campaign
   - manage campaigns

## 🔧 Development Setup

### Backend Setup
```bash
cd apps/backend
npm install
# Set environment variables (Hedera keys, Supabase config)
npm run dev
```

### Mobile App Setup
```bash
cd apps/mobile
npm install
npx expo start
```

### Environment Variables Required

apps/backend/.env
```bash
# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.xxxx
HEDERA_PRIVATE_KEY=302...
HEDERA_NETWORK=testnet

# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=your_secret_key

```

apps/mobile/.env
```bash
# Mobile App
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_public_key

```

## 🎯 Hedera-Specific 

### 1. **Bulk NFT Minting Optimization**
- Batch mint per 10 NFTs per transaction (Hedera limit), automatically split up when minted more than 10
- Optimized for cost efficiency and speed

### 2. **Metadata Management**
- Relative URL paths, in future this will be permanently hosted at Dysco domain
- HIP-412 compliant metadata structure

### 3. **Mirror Node Real-time Sync**
- Direct integration with Hedera Mirror Node API
- Real-time NFT ownership verification
- No reliance on centralized databases for NFT state


## 🌐 Business Model & Scalability

### Revenue Streams
1. **Transaction Fees**: Small fee per coupon minted
2. **Premium Features**: Advanced analytics, custom branding
3. **Marketplace Fees**: Commission on secondary market trades
4. **Single NFT collection**: limiting token associations and token creation costs

## 🎉 What Makes This Special

1. **First-of-Kind**: Novel application of NFTs for marketing/loyalty
2. **Real Utility**: Solves actual business problems (coupon fraud, tracking)
3. **User Experience**: Seamless mobile experience hiding blockchain complexity
4. **Hedera Native**: Built specifically for Hedera's unique advantages

## 🔮 Future Roadmap

- **Loyalty Programs**: NFT-based loyalty point systems
- **Cross-Merchant Offers**: Collaborative campaigns between merchants
- **AI Recommendations**: Personalized coupon discovery
- **Web3 Social**: Community-driven coupon sharing
- **secondary market**: opportunities for vibrant secondary trading



