import dotenv from 'dotenv';
dotenv.config(); // Load environment variables FIRST!

import express from 'express';
import cors from 'cors';
import { Client, TokenCreateTransaction, TokenType, TokenSupplyType, PrivateKey, PublicKey, AccountId, TokenMintTransaction, AccountCreateTransaction, Hbar } from '@hashgraph/sdk';
import { MirrorNodeService } from './services/mirrorNode';
import { NFTService, CouponData } from './services/nftService';
import { MerchantService, MerchantRegistration } from './services/merchantService';
import { databaseService } from './services/databaseService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
async function initializeDatabase() {
  try {
    if (databaseService.isConnected()) {
      await databaseService.initializeTables();
      console.log('🗄️ Database service initialized');
    } else {
      console.log('🗄️ Using memory storage (no database configured)');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Hedera client setup
const hederaClient = Client.forTestnet();
let nftService: NFTService | null = null;
let merchantService: MerchantService | null = null;

if (process.env.HEDERA_PRIVATE_KEY && process.env.HEDERA_ACCOUNT_ID) {
  const privateKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);
  const accountId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
  hederaClient.setOperator(accountId, privateKey);
  
  // Initialize services
  nftService = new NFTService(hederaClient, accountId, privateKey);
  merchantService = new MerchantService(hederaClient, accountId, privateKey);
  
  // Initialize database
  initializeDatabase();
  
  // Set existing collection ID if provided (legacy support)
  if (process.env.COUPON_COLLECTION_ID) {
    nftService.setCouponCollectionId(process.env.COUPON_COLLECTION_ID);
    console.log(`🎫 Using existing coupon collection: ${process.env.COUPON_COLLECTION_ID}`);
  }
  
  console.log(`🚀 Operator account: ${accountId.toString()}`);
}

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      hedera: hederaClient.operatorAccountId ? 'Connected' : 'Not configured'
    });
  });

  // Create Hedera account
  app.post('/api/wallet/create', async (req, res) => {
    try {
      const { publicKey } = req.body;

      if (!publicKey) {
        return res.status(400).json({
          success: false,
          error: 'Public key is required'
        });
      }

      // Convert hex public key to proper format for Hedera
      const publicKeyBytes = Buffer.from(publicKey, 'hex');
      const hederaPublicKey = PublicKey.fromBytes(publicKeyBytes);
      
      // Create account on Hedera
      const accountCreateTx = new AccountCreateTransaction()
        .setKey(hederaPublicKey)
        .setInitialBalance(new Hbar(0)) // no need for hbar
        .setMaxAutomaticTokenAssociations(0); //no need

      const accountCreateResponse = await accountCreateTx.execute(hederaClient);
      const accountCreateReceipt = await accountCreateResponse.getReceipt(hederaClient);
      const newAccountId = accountCreateReceipt.accountId;

      res.json({
        success: true,
        accountId: newAccountId?.toString(),
        transactionId: accountCreateResponse.transactionId.toString()
      });

    } catch (error) {
      console.error('Error creating Hedera account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create Hedera account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get account balance from Mirror Node
  app.get('/api/wallet/balance/:accountId', async (req, res) => {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          error: 'Account ID is required'
        });
      }

      // Query account balance from Mirror Node
      const balanceData = await MirrorNodeService.getAccountBalance(accountId);

      res.json({
        success: true,
        accountId: accountId,
        balance: balanceData.balanceInHbar.toString(),
        balanceInTinybars: balanceData.balance.toString(),
        tokens: balanceData.tokens
      });

    } catch (error) {
      console.error('Error querying account balance from Mirror Node:', error);
      
      // If account doesn't exist yet, return 0 balance instead of error
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`Account ${req.params.accountId} not found in Mirror Node yet, returning 0 balance`);
        res.json({
          success: true,
          accountId: req.params.accountId,
          balance: '0',
          balanceInTinybars: '0',
          tokens: []
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to query account balance',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
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

// NFT Collection Management
app.post('/api/nft/create-collection', async (req, res) => {
  try {
    if (!nftService) {
      return res.status(500).json({
        success: false,
        error: 'NFT service not initialized - check Hedera credentials'
      });
    }

    const tokenId = await nftService.createCouponCollection();
    
    res.json({
      success: true,
      message: 'Coupon NFT collection created successfully',
      tokenId: tokenId.toString()
    });

  } catch (error) {
    console.error('Error creating NFT collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create NFT collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mint coupon NFT
app.post('/api/nft/mint-coupon', async (req, res) => {
  try {
    if (!nftService) {
      return res.status(500).json({
        success: false,
        error: 'NFT service not initialized - check Hedera credentials'
      });
    }

    const { name, description, merchant, value, category, validUntil, imageUrl } = req.body;

    if (!name || !description || !merchant || !value || !category || !validUntil) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, merchant, value, category, validUntil'
      });
    }

    const couponData: CouponData = {
      name,
      description,
      merchant,
      value,
      category,
      validUntil,
      imageUrl
    };

    const result = await nftService.mintCoupon(couponData);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Coupon NFT minted successfully',
        tokenId: result.tokenId,
        serialNumber: result.serialNumber,
        transactionId: result.transactionId,
        nftId: `${result.tokenId}:${result.serialNumber}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to mint coupon NFT'
      });
    }

  } catch (error) {
    console.error('Error minting coupon NFT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mint coupon NFT',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get collection info
app.get('/api/nft/collection-info', (req, res) => {
  try {
    if (!nftService) {
      return res.status(500).json({
        success: false,
        error: 'NFT service not initialized'
      });
    }

    const collectionId = nftService.getCouponCollectionId();
    
    res.json({
      success: true,
      collectionId: collectionId || null,
      collectionName: 'Dysco Coupons',
      symbol: 'COUPO'
    });

  } catch (error) {
    console.error('Error getting collection info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection info'
    });
  }
});

// NFT Metadata endpoints
app.get('/api/nft/metadata/:tokenId/:serialNumber', (req, res) => {
  try {
    if (!nftService) {
      return res.status(500).json({
        success: false,
        error: 'NFT service not initialized'
      });
    }

    const { tokenId, serialNumber } = req.params;
    const nftId = `${tokenId}:${serialNumber}`;
    const metadata = nftService.getMetadata(nftId);

    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Metadata not found for this NFT'
      });
    }

    res.json(metadata);

  } catch (error) {
    console.error('Error getting NFT metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get NFT metadata'
    });
  }
});

// Get all NFT metadata (for development/debugging)
app.get('/api/nft/metadata', (req, res) => {
  try {
    if (!nftService) {
      return res.status(500).json({
        success: false,
        error: 'NFT service not initialized'
      });
    }

    const allMetadata = nftService.getAllMetadata();
    const metadataArray = Array.from(allMetadata.entries()).map(([nftId, metadata]) => ({
      nftId,
      metadata
    }));

    res.json({
      success: true,
      count: metadataArray.length,
      metadata: metadataArray
    });

  } catch (error) {
    console.error('Error getting all NFT metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get NFT metadata'
    });
  }
});

// Merchant Registration with Device-Generated Keys (Secure!)
app.post('/api/merchants/register-with-key', async (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { name, email, businessType, fiatPaymentAmount, publicKey } = req.body;

    if (!name || !email || !businessType || !fiatPaymentAmount || !publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, businessType, fiatPaymentAmount, publicKey'
      });
    }

    console.log(`🔐 Registering merchant with device-generated key: ${name}`);

    // Step 1: Register merchant
    const registration = { name, email, businessType, fiatPaymentAmount };
    const registerResult = await merchantService.registerMerchant(registration);
    
    if (!registerResult.success) {
      throw new Error(registerResult.error || 'Failed to register merchant');
    }

    const merchantId = registerResult.merchantId!;

    // Step 2: Create Hedera account using the PROVIDED public key
    const accountResult = await merchantService.createMerchantAccountWithKey(merchantId, publicKey);
    
    if (!accountResult.success) {
      throw new Error(accountResult.error || 'Failed to create merchant account');
    }

    // Step 3: Mark merchant as ready (collection created when first coupon is minted)
    console.log(`🎫 Merchant registered - collection will be created on first coupon mint`);

    // Step 4: Activate merchant
    const activateResult = await merchantService.activateMerchant(merchantId);
    
    if (!activateResult.success) {
      throw new Error(activateResult.error || 'Failed to activate merchant');
    }

    const merchant = await merchantService.getMerchantAsync(merchantId);

    res.json({
      success: true,
      message: 'Merchant registered successfully with device-generated keys',
      merchant: {
        id: merchant!.id,
        name: merchant!.name,
        email: merchant!.email,
        businessType: merchant!.businessType,
        hederaAccountId: merchant!.hederaAccountId,
        nftCollectionId: null, // Collection created on first coupon mint
        onboardingStatus: merchant!.onboardingStatus
      }
    });

  } catch (error) {
    console.error('Error in secure merchant registration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register merchant'
    });
  }
});

// Legacy Merchant Onboarding Endpoints (DEPRECATED - keeping for backwards compatibility)
app.post('/api/merchants/register', async (req, res) => {
  console.warn('⚠️  DEPRECATED: /api/merchants/register - Use /api/merchants/register-with-key instead');
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { name, email, businessType, fiatPaymentAmount } = req.body;

    if (!name || !email || !businessType || !fiatPaymentAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, businessType, fiatPaymentAmount'
      });
    }

    const registration: MerchantRegistration = {
      name,
      email,
      businessType,
      fiatPaymentAmount
    };

    const result = await merchantService.registerMerchant(registration);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Merchant registered successfully',
        merchantId: result.merchantId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to register merchant'
      });
    }

  } catch (error) {
    console.error('Error registering merchant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register merchant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/merchants/:merchantId/create-account', async (req, res) => {
  console.warn('⚠️  DEPRECATED: /api/merchants/:merchantId/create-account - Use /api/merchants/register-with-key instead');
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { merchantId } = req.params;
    const result = await merchantService.createMerchantAccount(merchantId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Merchant Hedera account created successfully',
        accountId: result.accountId,
        publicKey: result.publicKey
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create merchant account'
      });
    }

  } catch (error) {
    console.error('Error creating merchant account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create merchant account',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/merchants/:merchantId/create-collection', async (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { merchantId } = req.params;
    const result = await merchantService.createMerchantCollection(merchantId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Merchant NFT collection created successfully',
        collectionId: result.collectionId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to create merchant collection'
      });
    }

  } catch (error) {
    console.error('Error creating merchant collection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create merchant collection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/merchants/:merchantId/activate', async (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { merchantId } = req.params;
    const result = await merchantService.activateMerchant(merchantId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Merchant activated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to activate merchant'
      });
    }

  } catch (error) {
    console.error('Error activating merchant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate merchant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Complete merchant onboarding (one-shot endpoint)
app.post('/api/merchants/onboard', async (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { name, email, businessType, fiatPaymentAmount } = req.body;

    if (!name || !email || !businessType || !fiatPaymentAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, businessType, fiatPaymentAmount'
      });
    }

    // Step 1: Register merchant
    const registration: MerchantRegistration = { name, email, businessType, fiatPaymentAmount };
    const registerResult = await merchantService.registerMerchant(registration);
    
    if (!registerResult.success) {
      throw new Error(registerResult.error || 'Failed to register merchant');
    }

    const merchantId = registerResult.merchantId!;

    // Step 2: Create Hedera account
    const accountResult = await merchantService.createMerchantAccount(merchantId);
    
    if (!accountResult.success) {
      throw new Error(accountResult.error || 'Failed to create merchant account');
    }

    // Step 3: Create NFT collection
    const collectionResult = await merchantService.createMerchantCollection(merchantId);
    
    if (!collectionResult.success) {
      throw new Error(collectionResult.error || 'Failed to create merchant collection');
    }

    // Step 4: Activate merchant
    const activateResult = await merchantService.activateMerchant(merchantId);
    
    if (!activateResult.success) {
      throw new Error(activateResult.error || 'Failed to activate merchant');
    }

    const merchant = await merchantService.getMerchantAsync(merchantId);

    res.json({
      success: true,
      message: 'Merchant onboarded successfully',
      merchant: {
        id: merchant!.id,
        name: merchant!.name,
        email: merchant!.email,
        businessType: merchant!.businessType,
        hederaAccountId: merchant!.hederaAccountId,
        nftCollectionId: merchant!.nftCollectionId,
        onboardingStatus: merchant!.onboardingStatus
      }
    });

  } catch (error) {
    console.error('Error onboarding merchant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to onboard merchant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get merchant info
app.get('/api/merchants/:merchantId', async (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { merchantId } = req.params;
    const merchant = await merchantService.getMerchantAsync(merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        businessType: merchant.businessType,
        hederaAccountId: merchant.hederaAccountId,
        nftCollectionId: merchant.nftCollectionId,
        onboardingStatus: merchant.onboardingStatus,
        fiatPaymentStatus: merchant.fiatPaymentStatus,
        createdAt: merchant.createdAt,
        activatedAt: merchant.activatedAt
      }
    });

  } catch (error) {
    console.error('Error getting merchant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get merchant'
    });
  }
});

// Get all merchants
app.get('/api/merchants', (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const merchants = merchantService.getAllMerchants().map(merchant => ({
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      businessType: merchant.businessType,
      hederaAccountId: merchant.hederaAccountId,
      nftCollectionId: merchant.nftCollectionId,
      onboardingStatus: merchant.onboardingStatus,
      fiatPaymentStatus: merchant.fiatPaymentStatus,
      createdAt: merchant.createdAt,
      activatedAt: merchant.activatedAt
    }));

    res.json({
      success: true,
      count: merchants.length,
      merchants
    });

  } catch (error) {
    console.error('Error getting merchants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get merchants'
    });
  }
});

// Supabase-authenticated merchant coupon minting endpoint
app.post('/api/merchants/mint-coupon', async (req, res) => {
  try {
    if (!merchantService || !nftService) {
      return res.status(500).json({
        success: false,
        error: 'Services not initialized'
      });
    }

    const {
      merchantId,
      merchantAccountId,
      couponData,
      timestamp
    } = req.body;
    
    let { collectionId } = req.body; // Mutable for collection creation

    // Validate required fields
    if (!merchantId || !merchantAccountId || !couponData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: merchantId, merchantAccountId, couponData'
      });
    }
    
    // collectionId can be 'CREATE_NEW' for first-time merchants
    if (!collectionId) {
      collectionId = 'CREATE_NEW';
    }

    // Get merchant data for validation (check database first)
    console.log(`🔍 Looking up merchant with ID: ${merchantId}`);
    const merchant = await merchantService.getMerchantAsync(merchantId);
    if (!merchant) {
      console.log(`❌ Merchant not found in database: ${merchantId}`);
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }
    
    console.log(`✅ Found merchant: ${merchant.name}, status: ${merchant.onboardingStatus}`);
    console.log(`🔍 Merchant data:`, {
      id: merchant.id,
      hederaAccountId: merchant.hederaAccountId,
      onboardingStatus: merchant.onboardingStatus,
      nftCollectionId: merchant.nftCollectionId
    });

    // Validate merchant is active (auto-fix collection_created merchants)
    if (merchant.onboardingStatus === 'collection_created') {
      // Auto-activate merchants who have collections but weren't properly activated
      console.log(`🔧 Auto-activating merchant with collection: ${merchant.name}`);
      await merchantService.activateMerchant(merchantId);
      merchant.onboardingStatus = 'active'; // Update local object
    } else if (merchant.onboardingStatus !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Merchant is not active'
      });
    }

    // For Supabase auth, we trust the merchant ID from the request
    // No signature validation needed since merchants don't have private keys
    console.log('✅ Supabase-authenticated merchant request validated');

    // Create collection if this is merchant's first coupon
    if (!merchant.nftCollectionId || collectionId === 'CREATE_NEW') {
      console.log(`🎫 Creating first NFT collection for merchant: ${merchant.name}`);
      
      const collectionResult = await merchantService.createMerchantCollectionForDevice(merchantId);
      if (!collectionResult.success) {
        return res.status(500).json({
          success: false,
          error: `Failed to create NFT collection: ${collectionResult.error}`
        });
      }
      
      // Update the collectionId for this request
      const newCollectionId = collectionResult.collectionId!;
      console.log(`✅ Created collection ${newCollectionId} for merchant's first coupon`);
      
      // Update the merchant data and use new collection ID for validation
      merchant.nftCollectionId = newCollectionId;
      collectionId = newCollectionId; // Update the request collectionId
    }

    // Validate collection belongs to merchant (either existing or just created)
    if (merchant.nftCollectionId !== collectionId) {
      return res.status(400).json({
        success: false,
        error: `Collection ID mismatch. Expected: ${merchant.nftCollectionId}, Got: ${collectionId}`
      });
    }

    // Validate account ID matches
    if (merchant.hederaAccountId !== merchantAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID does not match merchant'
      });
    }

    // All validations passed - mint the NFT
    console.log(`🎫 Minting coupon for merchant ${merchant.name}: ${couponData.name}`);
    
    const mintResult = await nftService.mintCouponForMerchant(couponData, collectionId);
    
    if (mintResult.success) {
      res.json({
        success: true,
        message: 'Coupon NFT minted successfully',
        nftId: `${mintResult.tokenId}:${mintResult.serialNumber}`,
        tokenId: mintResult.tokenId,
        serialNumber: mintResult.serialNumber,
        transactionId: mintResult.transactionId,
        merchantName: merchant.name
      });
      
      console.log(`✅ Successfully minted coupon NFT for ${merchant.name}: ${mintResult.tokenId}:${mintResult.serialNumber}`);
    } else {
      res.status(500).json({
        success: false,
        error: mintResult.error || 'Failed to mint NFT'
      });
    }

  } catch (error) {
    console.error('Error in merchant mint endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process mint request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Merchant recovery endpoint (by public key)
app.post('/api/merchants/recover', async (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Public key is required for recovery'
      });
    }

    // Find merchant by public key
    const merchant = merchantService.getMerchantByPublicKey(publicKey);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'No merchant account found for this recovery phrase'
      });
    }

    res.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        businessType: merchant.businessType,
        hederaAccountId: merchant.hederaAccountId,
        nftCollectionId: merchant.nftCollectionId,
        onboardingStatus: merchant.onboardingStatus,
        createdAt: merchant.createdAt
      }
    });

  } catch (error) {
    console.error('Error in merchant recovery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recover merchant account'
    });
  }
});

// Create merchant record for Supabase user (called when they first try to create coupon)
app.post('/api/merchants/create-record', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, email'
      });
    }

    console.log(`🔐 Creating merchant record for Supabase user: ${email} (${userId})`);

    if (databaseService.isConnected()) {
      try {
        const merchant = await databaseService.createMerchantFromAuth(userId, email);
        console.log(`✅ Created merchant record for user: ${userId}`);
        
        res.json({
          success: true,
          message: 'Merchant record created',
          merchant: {
            id: merchant.id,
            email: merchant.email,
            onboardingStatus: merchant.onboarding_status
          }
        });
      } catch (error) {
        console.error('Error creating merchant record:', error);
        res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    } else {
      res.status(500).json({ success: false, error: 'Database not connected' });
    }

  } catch (error) {
    console.error('Error creating merchant record:', error);
    res.status(500).json({ success: false, error: 'Failed to create merchant record' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dysco backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Hedera status: ${hederaClient.operatorAccountId ? 'Connected' : 'Not configured'}`);
}); 