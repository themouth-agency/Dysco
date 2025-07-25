import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, TokenCreateTransaction, TokenType, TokenSupplyType, PrivateKey, AccountId, TokenMintTransaction } from '@hashgraph/sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Hedera client setup
const hederaClient = Client.forTestnet();
if (process.env.HEDERA_PRIVATE_KEY && process.env.HEDERA_ACCOUNT_ID) {
  const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  hederaClient.setOperator(accountId, privateKey);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    hedera: hederaClient.operatorAccountId ? 'Connected' : 'Not configured'
  });
});

// Create coupon NFT
app.post('/api/coupons/mint', async (req, res) => {
  try {
    const { name, description, discountPercent, merchantId, expiresAt } = req.body;

    // Create NFT token
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol('COUPON')
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1000000)
      .setTreasuryAccountId(hederaClient.operatorAccountId!)
      .setFreezeDefault(false);

    const tokenCreateResponse = await tokenCreateTx.execute(hederaClient);
    const tokenCreateReceipt = await tokenCreateResponse.getReceipt(hederaClient);
    const tokenId = tokenCreateReceipt.tokenId;

    // Mint the NFT with metadata
    const metadata = {
      name,
      description,
      discount_percent: discountPercent,
      merchant_id: merchantId,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    const tokenMintTx = new TokenMintTransaction()
      .setTokenId(tokenId!)
      .setMetadata([Buffer.from(JSON.stringify(metadata))]);

    const mintResponse = await tokenMintTx.execute(hederaClient);
    const mintReceipt = await mintResponse.getReceipt(hederaClient);

    res.json({
      success: true,
      tokenId: tokenId?.toString(),
      transactionId: mintResponse.transactionId.toString(),
      metadata
    });

  } catch (error) {
    console.error('Error minting coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint coupon',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available coupons
app.get('/api/coupons/available', (req, res) => {
  // Mock data for now - will connect to database later
  const mockCoupons = [
    {
      id: '1',
      name: '20% Off Coffee',
      description: 'Valid at Central Perk Coffee Shop',
      discountPercent: 20,
      merchantId: 'central-perk-001',
      expiresAt: '2024-12-31T23:59:59Z',
      status: 'active'
    },
    {
      id: '2',
      name: 'Free Pizza Slice',
      description: 'Buy one get one free at Pizza Palace',
      discountPercent: 50,
      merchantId: 'pizza-palace-002',
      expiresAt: '2024-11-30T23:59:59Z',
      status: 'active'
    }
  ];

  res.json({ coupons: mockCoupons });
});

// Claim coupon
app.post('/api/coupons/claim', async (req, res) => {
  try {
    const { couponId, userWalletAddress } = req.body;

    // Mock response for now - will implement actual NFT transfer later
    res.json({
      success: true,
      message: 'Coupon claimed successfully',
      couponId,
      userWalletAddress,
      transactionId: 'mock-tx-id-' + Date.now()
    });

  } catch (error) {
    console.error('Error claiming coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim coupon'
    });
  }
});

// Redeem coupon
app.post('/api/coupons/redeem', async (req, res) => {
  try {
    const { couponId, merchantId, qrData } = req.body;

    // Mock response for now - will implement actual NFT transfer later
    res.json({
      success: true,
      message: 'Coupon redeemed successfully',
      couponId,
      merchantId,
      transactionId: 'mock-tx-id-' + Date.now()
    });

  } catch (error) {
    console.error('Error redeeming coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redeem coupon'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CoupoFlow backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Hedera status: ${hederaClient.operatorAccountId ? 'Connected' : 'Not configured'}`);
}); 