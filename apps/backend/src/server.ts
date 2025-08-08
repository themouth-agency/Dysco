import dotenv from 'dotenv';
dotenv.config(); // Load environment variables FIRST!

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
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

// Serve static metadata files for HIP-412 compliance
app.use('/metadata', express.static(path.join(__dirname, '../metadata')));

// Utility function to save metadata files
async function saveMetadataFile(nftId: string, metadata: any): Promise<string> {
  try {
    const metadataDir = path.join(__dirname, '../metadata');
    await fs.mkdir(metadataDir, { recursive: true });
    
    const filename = `${nftId}.json`;
    const filepath = path.join(metadataDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(metadata, null, 2));
    
    // Return the public URL (auto-detect environment)
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://dysco-production.up.railway.app'
      : 'http://192.168.0.49:3001';
    return `${baseUrl}/metadata/${filename}`;
  } catch (error) {
    console.error('❌ Failed to save metadata file:', error);
    throw error;
  }
}

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

  // Create Hedera account for user wallet
  app.post('/api/users/create-account', async (req, res) => {
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
      
      console.log('🔐 Creating user Hedera account...');
      
      // Create account on Hedera - user pays their own fees via operator
      const accountCreateTx = new AccountCreateTransaction()
        .setKey(hederaPublicKey)
        .setInitialBalance(new Hbar(1)) // Give 1 HBAR for initial operations
        .setMaxAutomaticTokenAssociations(100); // Allow token associations for coupons

      const accountCreateResponse = await accountCreateTx.execute(hederaClient);
      const accountCreateReceipt = await accountCreateResponse.getReceipt(hederaClient);
      const newAccountId = accountCreateReceipt.accountId;

      console.log(`✅ Created user Hedera account: ${newAccountId?.toString()}`);

      res.json({
        success: true,
        accountId: newAccountId?.toString(),
        transactionId: accountCreateResponse.transactionId.toString()
      });

    } catch (error) {
      console.error('Error creating user Hedera account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create user Hedera account',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get user's owned NFT coupons from Mirror Node
  app.get('/api/users/:accountId/coupons', async (req, res) => {
    try {
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          error: 'Account ID is required'
        });
      }

      console.log(`🔍 Fetching NFT coupons for user: ${accountId}`);

      // Query user's NFTs from Mirror Node
      const userNFTs = await MirrorNodeService.getAccountNFTs(accountId);
      
      // Filter only coupon NFTs and get their metadata
      const couponNFTs = [];
      
      for (const nft of userNFTs) {
        const nftId = `${nft.token_id}:${nft.serial_number}`;
        
        try {
          // Get metadata URL from the NFT (HIP-412 format)
          const metadataUrl = Buffer.from(nft.metadata, 'base64').toString('utf-8');
          
          if (metadataUrl && metadataUrl.startsWith('http')) {
            console.log(`🔍 Fetching metadata from: ${metadataUrl}`);
            
            // Fetch metadata from external URL
            const metadataResponse = await fetch(metadataUrl);
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json() as any;
              
              // Get campaign information if campaignId is available
              let campaignActive = true; // Default to true for legacy coupons
              const campaignId = metadata.properties?.campaignId;
              
              if (campaignId) {
                try {
                  const campaign = await databaseService.getCampaign(campaignId);
                  if (campaign) {
                    campaignActive = campaign.is_active;
                  }
                } catch (error) {
                  console.error(`Error fetching campaign ${campaignId}:`, error);
                }
              }

              // Convert to Coupon format
              const coupon = {
                id: nftId,
                name: metadata.name || 'Unknown Coupon',
                description: metadata.description || '',
                merchant: metadata.properties?.merchant || 'Unknown',
                value: metadata.properties?.discountValue || 0,
                discountType: metadata.properties?.discountType || 'unknown',
                category: metadata.properties?.category || 'general',
                validUntil: metadata.properties?.expiresAt || metadata.properties?.validUntil,
                imageUrl: metadata.image || '',
                termsAndConditions: metadata.properties?.termsAndConditions || '',
                isAvailable: false, // User already owns this
                tokenId: nft.token_id,
                serialNumber: nft.serial_number,
                status: 'owned',
                // Campaign information for redemption flow
                campaignType: metadata.properties?.redemptionType || 'qr_redeem',
                discountCode: metadata.properties?.discountCode || null,
                redemptionType: metadata.properties?.redemptionType || 'qr_redeem',
                // Campaign status
                campaignActive: campaignActive,
                campaignId: campaignId
              };
              couponNFTs.push(coupon);
              console.log(`✅ Added coupon: ${metadata.name || 'Unknown'}`);
            } else {
              console.log(`❌ Failed to fetch metadata from ${metadataUrl}`);
            }
          } else {
            console.log(`⚠️ NFT ${nftId} has invalid metadata URL: ${metadataUrl}`);
          }
        } catch (error) {
          console.error(`❌ Error processing NFT ${nftId}:`, error);
        }
      }

      console.log(`✅ Found ${couponNFTs.length} coupon NFTs for user ${accountId}`);

      res.json({
        success: true,
        coupons: couponNFTs,
        count: couponNFTs.length
      });

    } catch (error) {
      console.error('Error getting user coupons:', error);
      
      // If account doesn't exist yet, return empty array instead of error
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`User ${req.params.accountId} not found in Mirror Node yet, returning empty coupons`);
        res.json({
          success: true,
          coupons: [],
          count: 0
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to get user coupons',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
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

// Get available campaigns for discovery (instead of individual coupons)
app.get('/api/campaigns/discover', async (req, res) => {
  try {
    console.log('🔍 Fetching discoverable campaigns...');
    
    // Get all active campaigns from all merchants
    const allMerchants = await databaseService.getAllMerchants();
    const discoverableCampaigns = [];
    
    for (const merchant of allMerchants) {
      try {
        const campaigns = await databaseService.getMerchantCampaigns(merchant.id);
        
        for (const campaign of campaigns) {
          // Only include active campaigns that haven't expired
          const now = new Date();
          const endDate = new Date(campaign.end_date);
          
          if (campaign.is_active && campaign.is_discoverable && now <= endDate) {
            // Count available coupons for this campaign
            const campaignCoupons = await databaseService.getCampaignCoupons(campaign.id);
            const availableCount = campaignCoupons.filter(coupon => 
              coupon.redemption_status === 'active' && !coupon.owner_account_id
            ).length;
            
            if (availableCount > 0) {
              discoverableCampaigns.push({
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                merchant: merchant.name || 'Unknown Merchant',
                merchantId: merchant.hedera_account_id,
                discountType: campaign.discount_type,
                discountValue: campaign.discount_value,
                imageUrl: campaign.image_url,
                expiresAt: campaign.end_date,
                availableCount: availableCount,
                maxRedemptionsPerUser: campaign.max_redemptions_per_user,
                totalLimit: campaign.total_limit,
                status: 'active'
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching campaigns for merchant ${merchant.hedera_account_id}:`, error);
      }
    }
    
    console.log(`✅ Found ${discoverableCampaigns.length} discoverable campaigns`);
    
    res.json({ 
      success: true,
      campaigns: discoverableCampaigns,
      count: discoverableCampaigns.length
    });
    
  } catch (error) {
    console.error('Error fetching discoverable campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch discoverable campaigns'
    });
  }
});

// Claim coupon (transfer NFT to user)
app.post('/api/coupons/claim', async (req, res) => {
  try {
    const { nftId, userAccountId } = req.body;

    if (!nftId || !userAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nftId, userAccountId'
      });
    }

    if (!nftService) {
      return res.status(500).json({
        success: false,
        error: 'NFT service not initialized'
      });
    }

    // Parse NFT ID to get token ID and serial number
    const [tokenId, serialNumberStr] = nftId.split(':');
    const serialNumber = parseInt(serialNumberStr);

    if (!tokenId || isNaN(serialNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid NFT ID format'
      });
    }

    console.log(`🎫 Transferring coupon NFT: ${nftId} to user: ${userAccountId}`);

    // First, associate the token with the user's account (if not already associated)
    const { TokenAssociateTransaction, TransferTransaction, AccountId, TokenId } = await import('@hashgraph/sdk');

    // Note: In a real implementation, you'd want to check if the token is already associated
    // For now, we'll try to associate and ignore errors if already associated
    try {
      console.log(`🔗 Associating token ${tokenId} with user account ${userAccountId}`);
      
      // Create association transaction (user would need to sign this in a real app)
      // For demo purposes, we'll skip this step as it requires user's private key
      console.log(`⚠️ Token association skipped - would require user signature in production`);
    } catch (associateError) {
      console.log(`ℹ️ Token association may have failed (likely already associated): ${associateError}`);
    }

    // Transfer NFT from operator (treasury) to user
    const transferTransaction = new TransferTransaction()
      .addNftTransfer(
        TokenId.fromString(tokenId),
        serialNumber,
        hederaClient.operatorAccountId!, // From operator (current owner)
        AccountId.fromString(userAccountId) // To user
      )
      .setMaxTransactionFee(20); // 20 HBAR max fee

    const transferResponse = await transferTransaction.execute(hederaClient);
    const transferReceipt = await transferResponse.getReceipt(hederaClient);

    console.log(`✅ Successfully transferred NFT ${nftId} to user ${userAccountId}, transaction: ${transferResponse.transactionId.toString()}`);

    res.json({
      success: true,
      message: 'Coupon claimed successfully',
      nftId,
      userAccountId,
      transactionId: transferResponse.transactionId.toString(),
      claimedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error claiming coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim coupon',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Redeem coupon (burn/wipe NFT)
app.post('/api/coupons/redeem', async (req, res) => {
  try {
    const { nftId, userAccountId, merchantScan, scannedAt } = req.body;

    if (!nftId || !userAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nftId, userAccountId'
      });
    }

    if (!nftService) {
      return res.status(500).json({
        success: false,
        error: 'NFT service not initialized'
      });
    }

    // Parse NFT ID to get token ID and serial number
    const [tokenId, serialNumberStr] = nftId.split(':');
    const serialNumber = parseInt(serialNumberStr);

    if (!tokenId || isNaN(serialNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid NFT ID format'
      });
    }

    console.log(`🔥 Redeeming coupon NFT: ${nftId} from user: ${userAccountId}`);

    // SECURITY CHECK: Verify user still owns this NFT before redemption
    try {
      const { MirrorNodeService } = await import('./services/mirrorNode');
      const userNFTs = await MirrorNodeService.getAccountNFTs(userAccountId);
      
      // Check if this specific NFT is still owned by the user
      const ownsNFT = userNFTs.some(nft => 
        nft.token_id === tokenId && nft.serial_number === serialNumber
      );

      if (!ownsNFT) {
        console.warn(`⚠️ User ${userAccountId} no longer owns NFT ${nftId}`);
        return res.status(400).json({
          success: false,
          error: 'NFT ownership verification failed - coupon may have been transferred',
          code: 'NFT_NOT_OWNED'
        });
      }

      console.log(`✅ Verified user ${userAccountId} still owns NFT ${nftId}`);
    } catch (verificationError) {
      console.error('Error verifying NFT ownership:', verificationError);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify NFT ownership',
        code: 'OWNERSHIP_VERIFICATION_FAILED'
      });
    }

    // Import TokenWipeTransaction for burning NFTs
    const { TokenWipeTransaction } = await import('@hashgraph/sdk');

    // Wipe (burn) the NFT from the user's account
    const wipeTransaction = new TokenWipeTransaction()
      .setTokenId(tokenId)
      .setAccountId(userAccountId)
      .setSerials([serialNumber])
      .setMaxTransactionFee(20); // 20 HBAR max fee

    const wipeResponse = await wipeTransaction.execute(hederaClient);
    const wipeReceipt = await wipeResponse.getReceipt(hederaClient);

    console.log(`✅ Successfully burned NFT ${nftId}, transaction: ${wipeResponse.transactionId.toString()}`);

    // Store redemption record in database if connected
    if (databaseService.isConnected()) {
      try {
        // Get coupon details to find the actual merchant ID
        const couponRecord = await databaseService.getNFTCoupon(nftId);
        if (couponRecord) {
          // Get merchant record using the merchant account ID from the coupon
          const merchants = await databaseService.getAllMerchants();
          const merchant = merchants.find(m => m.hedera_account_id === couponRecord.merchant_account_id);
          
          if (merchant) {
            // Store redemption record
            await databaseService.recordRedemption({
              nftId,
              userAccountId,
              merchantAccountId: merchant.id, // Use the merchant's Supabase UUID
              redemptionTransactionId: wipeResponse.transactionId.toString(),
              scannedAt: scannedAt || new Date().toISOString(),
              redemptionMethod: merchantScan ? 'qr_scan' : 'direct'
            });
            console.log(`📝 Stored redemption record for ${nftId}`);
          } else {
            console.warn(`⚠️ Could not find merchant for coupon ${nftId}`);
          }
        } else {
          console.warn(`⚠️ Could not find coupon record for ${nftId}`);
        }
      } catch (dbError) {
        console.error('Failed to store redemption record:', dbError);
        // Don't fail the transaction for DB errors
      }
    }

    res.json({
      success: true,
      message: 'Coupon redeemed successfully',
      nftId,
      userAccountId,
      transactionId: wipeResponse.transactionId.toString(),
      scannedAt: scannedAt || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error redeeming coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redeem coupon',
      details: error instanceof Error ? error.message : 'Unknown error'
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

// Simple Merchant Registration (Backend-managed Hedera accounts)
app.post('/api/merchants/register-with-key', async (req, res) => {
  try {
    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    const { name, email, businessType, userId } = req.body;

    if (!name || !email || !businessType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, businessType'
      });
    }

    console.log(`🆔 Supabase User ID: ${userId}`);

    console.log(`🏢 Registering merchant (backend-managed): ${name}`);

    // Generate a unique merchant ID if not provided
    const merchantId = userId || `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Step 1: Create Hedera account using OPERATOR'S key (pure representation)
    const { AccountCreateTransaction } = await import('@hashgraph/sdk');
    
    console.log('🔐 Creating Hedera representation account with operator key...');
    console.log(`🔑 Using operator public key: ${hederaClient.operatorPublicKey!.toString()}`);
    
    // Create new account with SAME keys as operator (pure representation)
    if (!hederaClient.operatorPublicKey) {
      throw new Error('Operator public key not available');
    }
    
    const newAccount = new AccountCreateTransaction()
      .setKey(hederaClient.operatorPublicKey) // Same key as operator
      .setInitialBalance(0) // No HBAR needed - operator pays everything
      .setMaxTransactionFee(20); // Operator pays this fee too

    const createResponse = await newAccount.execute(hederaClient);
    const createReceipt = await createResponse.getReceipt(hederaClient);
    const hederaAccountId = createReceipt.accountId!.toString();
    
    console.log(`✅ Created Hedera account: ${hederaAccountId}`);

    // Step 2: Store merchant info in database
    if (databaseService.isConnected()) {
      await databaseService.createMerchant({
        hedera_account_id: hederaAccountId,
        id: merchantId,
        name,
        email,
        business_type: businessType,
        hedera_public_key: hederaClient.operatorPublicKey!.toString(),
        fiat_payment_status: 'pending',
        onboarding_status: 'active', // Set to active immediately - ready to create coupons
      });

      console.log(`💾 Stored merchant in database: ${merchantId}`);
      console.log(`✅ Merchant marked as active - ready to create coupons`);
    }

    const merchant = {
      id: merchantId,
      name,
      email,
      businessType,
      hederaAccountId,
      onboardingStatus: 'active'
    };

    res.json({
      success: true,
      message: 'Merchant registered successfully (backend-managed)',
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        businessType: merchant.businessType,
        hederaAccountId: merchant.hederaAccountId,
        nftCollectionId: null, // Collection created on first coupon mint
        onboardingStatus: merchant.onboardingStatus
      }
    });

  } catch (error) {
    console.error('Error in merchant registration:', error);
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

// Get merchant redemption history
app.get('/api/merchants/:merchantId/redemptions', async (req, res) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        error: 'Merchant ID is required'
      });
    }

    if (!databaseService.isConnected()) {
      return res.status(500).json({
        success: false,
        error: 'Database not connected'
      });
    }

    console.log(`📊 Fetching redemption history for merchant: ${merchantId}`);
    const redemptions = await databaseService.getRedemptionHistory(merchantId);

    res.json({
      success: true,
      redemptions,
      count: redemptions.length
    });

  } catch (error) {
    console.error('Error getting merchant redemption history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get redemption history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user redemption history
app.get('/api/users/:userAccountId/redemptions', async (req, res) => {
  try {
    const { userAccountId } = req.params;

    if (!userAccountId) {
      return res.status(400).json({
        success: false,
        error: 'User account ID is required'
      });
    }

    if (!databaseService.isConnected()) {
      return res.status(500).json({
        success: false,
        error: 'Database not connected'
      });
    }

    console.log(`📊 Fetching redemption history for user: ${userAccountId}`);
    const redemptions = await databaseService.getUserRedemptionHistory(userAccountId);

    res.json({
      success: true,
      redemptions,
      count: redemptions.length
    });

  } catch (error) {
    console.error('Error getting user redemption history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user redemption history',
      details: error instanceof Error ? error.message : 'Unknown error'
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

// ==========================================
// CAMPAIGN MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Create a new campaign for a merchant
 */
app.post('/api/merchants/:merchantId/campaigns', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { name, description, campaignType, discountType, discountValue, startDate, endDate, imageUrl, maxRedemptionsPerUser, totalLimit, isDiscoverable } = req.body;

    // Validate required fields
    if (!name || !campaignType || !discountType || !discountValue || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, campaignType, discountType, discountValue, startDate, endDate'
      });
    }

    // Generate campaign ID
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const campaign = await databaseService.createCampaign({
      id: campaignId,
      merchant_id: merchantId,
      name,
      description: description || '',
      campaign_type: campaignType,
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      start_date: startDate,
      end_date: endDate,
      image_url: imageUrl,
      max_redemptions_per_user: maxRedemptionsPerUser || 1,
      total_limit: totalLimit,
      is_active: true,
      is_discoverable: isDiscoverable !== undefined ? isDiscoverable : true
    });

    console.log(`✅ Created campaign: ${campaign.name} for merchant ${merchantId}`);

    res.json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign'
    });
  }
});

/**
 * Get all campaigns for a merchant
 */
app.get('/api/merchants/:merchantId/campaigns', async (req, res) => {
  try {
    const { merchantId } = req.params;
    
    const campaigns = await databaseService.getMerchantCampaigns(merchantId);
    
    console.log(`📋 Retrieved ${campaigns.length} campaigns for merchant ${merchantId}`);

    res.json({
      success: true,
      campaigns
    });

  } catch (error) {
    console.error('Error getting merchant campaigns:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get campaigns'
    });
  }
});

/**
 * Get a specific campaign
 */
app.get('/api/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const campaign = await databaseService.getCampaign(campaignId);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      campaign
    });

  } catch (error) {
    console.error('Error getting campaign:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get campaign'
    });
  }
});

/**
 * Toggle campaign active status
 */
app.put('/api/campaigns/:campaignId/toggle-status', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_active must be a boolean value'
      });
    }

    // Update campaign status in database
    const updated = await databaseService.updateCampaign(campaignId, { is_active });
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    console.log(`🔄 Campaign ${campaignId} status updated to: ${is_active ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      message: `Campaign ${is_active ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('Error toggling campaign status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update campaign status'
    });
  }
});

/**
 * Get coupons for a specific campaign
 */
app.get('/api/campaigns/:campaignId/coupons', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const coupons = await databaseService.getCampaignCoupons(campaignId);
    
    console.log(`🎫 Retrieved ${coupons.length} coupons for campaign ${campaignId}`);

    res.json({
      success: true,
      coupons
    });

  } catch (error) {
    console.error('Error getting campaign coupons:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get campaign coupons'
    });
  }
});

/**
 * Mint multiple coupons for a campaign
 */
app.post('/api/campaigns/:campaignId/coupons/mint', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { quantity = 1 } = req.body;

    // Get campaign details
    const campaign = await databaseService.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Get merchant details
    const merchant = await databaseService.getMerchantById(campaign.merchant_id);
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    console.log(`🎫 Minting ${quantity} coupons for campaign: ${campaign.name}`);

    if (!merchantService) {
      return res.status(500).json({
        success: false,
        error: 'Merchant service not initialized'
      });
    }

    // Use the new bulk minting method for efficiency and HIP-412 compliance
    const bulkResult = await merchantService.bulkMintCouponsForCampaign(
      merchant.id,
      campaign,
      merchant.nft_collection_id!,
      merchant.hedera_account_id,
      quantity
    );

    if (bulkResult.success) {
      const successCount = bulkResult.mintedCoupons?.length || 0;
      console.log(`✅ Successfully bulk minted ${successCount}/${quantity} coupons`);
      
      res.json({
        success: true,
        message: `Successfully minted ${successCount}/${quantity} coupons`,
        mintedCoupons: bulkResult.mintedCoupons,
        errors: bulkResult.errors,
        campaign: campaign.name
      });
    } else {
      console.error(`❌ Bulk minting failed:`, bulkResult.error);
      res.status(500).json({
        success: false,
        error: bulkResult.error || 'Bulk minting failed'
      });
    }

  } catch (error) {
    console.error('Error minting campaign coupons:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mint coupons'
    });
  }
});

/**
 * Burn expired coupons for a campaign
 */
app.post('/api/campaigns/:campaignId/burn-expired', async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Get expired coupons
    const expiredCoupons = await databaseService.getExpiredCoupons(campaignId);
    
    console.log(`🔥 Found ${expiredCoupons.length} expired coupons for campaign ${campaignId}`);

    const burnedCoupons = [];

    for (const coupon of expiredCoupons) {
      try {
        // Burn NFT on Hedera using wipe transaction
        const { TokenWipeTransaction } = await import('@hashgraph/sdk');
        
        const wipeTransaction = new TokenWipeTransaction()
          .setTokenId(coupon.token_id)
          .setAccountId(coupon.owner_account_id || hederaClient.operatorAccountId!)
          .setSerials([coupon.serial_number])
          .setMaxTransactionFee(new Hbar(10));

        await wipeTransaction.execute(hederaClient);

        // Update database status
        await databaseService.updateNFTCoupon(coupon.nft_id, {
          redemption_status: 'burned'
        });

        burnedCoupons.push(coupon.nft_id);
        console.log(`🔥 Burned expired coupon: ${coupon.nft_id}`);

      } catch (error) {
        console.error(`❌ Failed to burn coupon ${coupon.nft_id}:`, error);
        // Continue with next coupon
      }
    }

    res.json({
      success: true,
      message: `Successfully burned ${burnedCoupons.length}/${expiredCoupons.length} expired coupons`,
      burnedCoupons
    });

  } catch (error) {
    console.error('Error burning expired coupons:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to burn expired coupons'
    });
  }
});

/**
 * Public claim endpoint - allows users to claim a coupon from a campaign
 */
app.post('/api/campaigns/:campaignId/claim', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { userAccountId } = req.body;

    if (!userAccountId) {
      return res.status(400).json({
        success: false,
        error: 'User account ID is required'
      });
    }

    // Get campaign details
    const campaign = await databaseService.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Check if campaign is active and not expired
    const now = new Date();
    const endDate = new Date(campaign.end_date);
    if (!campaign.is_active || now > endDate) {
      return res.status(400).json({
        success: false,
        error: 'Campaign is not active or has expired'
      });
    }

    // Check how many coupons this user has already claimed from this campaign
    const allCampaignCoupons = await databaseService.getCampaignCoupons(campaignId);
    const userClaimedCoupons = allCampaignCoupons.filter(coupon => 
      coupon.owner_account_id === userAccountId
    );
    const userClaimedCount = userClaimedCoupons.length;

    console.log(`📊 User ${userAccountId} has already claimed ${userClaimedCount}/${campaign.max_redemptions_per_user} coupons from campaign ${campaignId}`);
    console.log(`📊 Campaign details:`, {
      campaignId: campaign.id,
      campaignName: campaign.name,
      maxRedemptions: campaign.max_redemptions_per_user,
      totalCouponsInCampaign: allCampaignCoupons.length
    });
    console.log(`📊 User's claimed coupons:`, userClaimedCoupons.map(c => ({
      nftId: c.nft_id,
      tokenId: c.token_id,
      serialNumber: c.serial_number,
      claimedAt: c.created_at
    })));

    // Check if user has reached their limit
    if (userClaimedCount >= campaign.max_redemptions_per_user) {
      return res.status(400).json({
        success: false,
        error: `You have already claimed the maximum number of coupons (${campaign.max_redemptions_per_user}) from this campaign`
      });
    }

    // Get available (unclaimed) coupons for this campaign
    const unclaimedCoupons = allCampaignCoupons.filter(coupon => 
      coupon.redemption_status === 'active' && !coupon.owner_account_id
    );

    if (unclaimedCoupons.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No coupons available for this campaign'
      });
    }

    // Get the first available coupon
    const couponToClaim = unclaimedCoupons[0];

    console.log(`🎫 Claiming coupon ${couponToClaim.nft_id} for user ${userAccountId}`);

    // Transfer NFT from merchant (treasury) to user
    try {
      const { TransferTransaction } = await import('@hashgraph/sdk');
      
      const transferTx = new TransferTransaction()
        .addNftTransfer(
          couponToClaim.token_id,
          couponToClaim.serial_number,
          couponToClaim.merchant_account_id,  // From merchant
          userAccountId                       // To user
        )
        .setMaxTransactionFee(new Hbar(5));

      const transferResponse = await transferTx.execute(hederaClient);
      const transferReceipt = await transferResponse.getReceipt(hederaClient);

      if (transferReceipt.status.toString() !== 'SUCCESS') {
        throw new Error(`Transfer failed with status: ${transferReceipt.status.toString()}`);
      }

      // Update database - mark as claimed by user
      await databaseService.updateNFTCoupon(couponToClaim.nft_id, {
        owner_account_id: userAccountId,
        redemption_status: 'active' // Still active, just now owned by user
      });

      console.log(`✅ Successfully claimed coupon ${couponToClaim.nft_id} for user ${userAccountId}`);

      res.json({
        success: true,
        message: 'Coupon claimed successfully!',
        coupon: {
          nftId: couponToClaim.nft_id,
          campaignName: campaign.name,
          discountType: campaign.discount_type,
          discountValue: campaign.discount_value,
          expiresAt: campaign.end_date,
          discountCode: couponToClaim.discount_code
        }
      });

    } catch (transferError) {
      console.error('❌ Failed to transfer coupon:', transferError);
      res.status(500).json({
        success: false,
        error: 'Failed to transfer coupon to user'
      });
    }

  } catch (error) {
    console.error('Error claiming coupon:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to claim coupon'
    });
  }
});

/**
 * Generate secure redemption token for an NFT coupon
 */
app.post('/api/coupons/generate-redemption-token', async (req, res) => {
  try {
    const { nftId, userAccountId } = req.body;

    if (!nftId || !userAccountId) {
      return res.status(400).json({
        success: false,
        error: 'NFT ID and user account ID are required'
      });
    }

    // Verify user owns this NFT by checking database
    const couponRecord = await databaseService.getNFTCoupon(nftId);
    if (!couponRecord || couponRecord.owner_account_id !== userAccountId) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this NFT coupon'
      });
    }

    if (couponRecord.redemption_status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'This coupon has already been redeemed'
      });
    }

    // Generate secure redemption token (signed data)
    const redemptionData = {
      nftId,
      userAccountId,
      merchantAccountId: couponRecord.merchant_account_id,
      tokenId: couponRecord.token_id,
      serialNumber: couponRecord.serial_number,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minute expiry
    };

    // In production, you'd sign this with a private key
    // For demo, we'll use a simple hash-based verification
    const crypto = await import('crypto');
    const dataString = JSON.stringify(redemptionData);
    const signature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'demo-secret')
      .update(dataString)
      .digest('hex');

    const secureToken = {
      data: redemptionData,
      signature: signature
    };

    console.log(`🎫 Generated secure redemption token for NFT ${nftId}`);

    res.json({
      success: true,
      redemptionToken: Buffer.from(JSON.stringify(secureToken)).toString('base64'),
      expiresAt: redemptionData.expiresAt
    });

  } catch (error) {
    console.error('Error generating redemption token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate redemption token'
    });
  }
});

/**
 * User burns their own coupon (permanent destruction)
 */
app.post('/api/coupons/burn', async (req, res) => {
  try {
    const { nftId, userAccountId, userPrivateKey } = req.body;

    if (!nftId || !userAccountId || !userPrivateKey) {
      return res.status(400).json({
        success: false,
        error: 'NFT ID, user account ID, and private key are required'
      });
    }

    // Verify user owns this NFT by checking database
    const couponRecord = await databaseService.getNFTCoupon(nftId);
    if (!couponRecord || couponRecord.owner_account_id !== userAccountId) {
      return res.status(403).json({
        success: false,
        error: 'You do not own this NFT coupon'
      });
    }

    if (couponRecord.redemption_status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'This coupon has already been redeemed or burned'
      });
    }

    const { TokenWipeTransaction, PrivateKey } = await import('@hashgraph/sdk');

    // User wipes their own NFT (permanent destruction from their account)
    console.log(`🧹 User ${userAccountId} wiping coupon ${nftId}`);
    
    const wipeTransaction = new TokenWipeTransaction()
      .setTokenId(couponRecord.token_id)
      .setAccountId(userAccountId) // Account to wipe NFT from
      .setSerials([couponRecord.serial_number])
      .setMaxTransactionFee(new Hbar(2))
      .freezeWith(hederaClient); // Freeze with operator client

    // Execute with operator (who has wipe key and pays the fee)
    const wipeResponse = await wipeTransaction.execute(hederaClient);
    const wipeReceipt = await wipeResponse.getReceipt(hederaClient);

    if (wipeReceipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Wipe failed with status: ${wipeReceipt.status.toString()}`);
    }

    // Update database - mark as burned
    await databaseService.updateNFTCoupon(nftId, {
      redemption_status: 'burned',
      redeemed_at: new Date().toISOString()
    });

    console.log(`✅ Successfully wiped coupon ${nftId} from user ${userAccountId}`);

    res.json({
      success: true,
      message: 'Coupon wiped successfully',
      transactionId: wipeResponse.transactionId.toString()
    });

  } catch (error) {
    console.error('Error burning coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to burn coupon',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Redeem discount code coupon (burn NFT and get discount code)
app.post('/api/coupons/redeem-discount-code', async (req, res) => {
  try {
    const { nftId, userAccountId } = req.body;

    if (!nftId || !userAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nftId, userAccountId'
      });
    }

    // Get coupon details to verify it's a discount code campaign
    const couponRecord = await databaseService.getNFTCoupon(nftId);
    if (!couponRecord || couponRecord.owner_account_id !== userAccountId) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found or not owned by user'
      });
    }

    if (couponRecord.redemption_status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Coupon is not active for redemption'
      });
    }

    // Get campaign details to check if it's a discount code campaign
    const campaign = await databaseService.getCampaign(couponRecord.campaign_id);
    if (!campaign || campaign.campaign_type !== 'discount_code') {
      return res.status(400).json({
        success: false,
        error: 'This coupon is not a discount code campaign'
      });
    }

    console.log(`💳 Redeeming discount code coupon ${nftId} for user ${userAccountId}`);

    // SECURITY CHECK: Verify user still owns this NFT before redemption
    try {
      const { MirrorNodeService } = await import('./services/mirrorNode');
      const userNFTs = await MirrorNodeService.getAccountNFTs(userAccountId);
      
      const ownsNFT = userNFTs.some(nft => 
        nft.token_id === couponRecord.token_id && nft.serial_number === couponRecord.serial_number
      );

      if (!ownsNFT) {
        return res.status(400).json({
          success: false,
          error: 'NFT ownership verification failed - coupon may have been transferred'
        });
      }
    } catch (verificationError) {
      console.error('Error verifying NFT ownership:', verificationError);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify NFT ownership'
      });
    }

    // Burn the NFT using operator account (more secure than requiring user's private key)
    const { TokenWipeTransaction, Hbar } = await import('@hashgraph/sdk');

    const wipeTransaction = new TokenWipeTransaction()
      .setTokenId(couponRecord.token_id)
      .setAccountId(userAccountId)
      .setSerials([couponRecord.serial_number])
      .setMaxTransactionFee(new Hbar(2));

    const wipeResponse = await wipeTransaction.execute(hederaClient);
    const wipeReceipt = await wipeResponse.getReceipt(hederaClient);

    if (wipeReceipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Wipe failed with status: ${wipeReceipt.status.toString()}`);
    }

    // Update database
    await databaseService.updateNFTCoupon(nftId, { 
      redemption_status: 'redeemed', 
      redeemed_at: new Date().toISOString() 
    });

    // (Redemption will be recorded below with the discount code)

    // Generate a secure, unique discount code (not stored in metadata)
    const discountCode = `${campaign.discount_type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Update the redemption record to include the generated discount code
    if (databaseService.isConnected()) {
      try {
        const merchants = await databaseService.getAllMerchants();
        const merchant = merchants.find(m => m.hedera_account_id === couponRecord.merchant_account_id);
        
        if (merchant) {
          await databaseService.recordRedemption({
            nftId,
            userAccountId,
            merchantAccountId: merchant.id,
            redemptionTransactionId: wipeResponse.transactionId.toString(),
            scannedAt: new Date().toISOString(),
            redemptionMethod: 'discount_code',
            discountCode: discountCode, // Store the generated discount code
            campaignId: campaign.id // Add campaign ID for proper relationship
          });
        }
      } catch (dbError) {
        console.error('Failed to update redemption record with discount code:', dbError);
      }
    }

    console.log(`✅ Successfully redeemed discount code coupon ${nftId} - Generated code: ${discountCode}`);

    res.json({
      success: true,
      message: 'Discount code redeemed successfully',
      discountCode: discountCode,
      campaignName: campaign.name,
      discountType: campaign.discount_type,
      discountValue: campaign.discount_value,
      transactionId: wipeResponse.transactionId.toString()
    });

  } catch (error) {
    console.error('Error redeeming discount code coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redeem discount code coupon',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's redeemed discount codes
app.get('/api/users/:userAccountId/discount-codes', async (req, res) => {
  try {
    const { userAccountId } = req.params;
    
    if (!userAccountId) {
      return res.status(400).json({
        success: false,
        error: 'User account ID is required'
      });
    }

    if (!databaseService.isConnected()) {
      return res.status(500).json({
        success: false,
        error: 'Database not connected'
      });
    }

    // Get all discount code redemptions for this user
    const redemptions = await databaseService.getUserDiscountCodes(userAccountId);
    
    console.log(`📋 Found ${redemptions?.length || 0} discount codes for user ${userAccountId}`);

    res.json({
      success: true,
      discountCodes: redemptions
    });

  } catch (error) {
    console.error('Error fetching user discount codes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch discount codes'
    });
  }
});

/**
 * Verify and redeem a secure redemption token (for merchants)
 */
app.post('/api/coupons/verify-redemption-token', async (req, res) => {
  try {
    const { redemptionToken } = req.body;

    if (!redemptionToken) {
      return res.status(400).json({
        success: false,
        error: 'Redemption token is required'
      });
    }

    // Decode and verify the token
    let secureToken;
    try {
      secureToken = JSON.parse(Buffer.from(redemptionToken, 'base64').toString('utf-8'));
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid redemption token format'
      });
    }

    // Verify signature
    const crypto = await import('crypto');
    const dataString = JSON.stringify(secureToken.data);
    const expectedSignature = crypto.createHmac('sha256', process.env.JWT_SECRET || 'demo-secret')
      .update(dataString)
      .digest('hex');

    if (secureToken.signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        error: 'Invalid redemption token signature'
      });
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(secureToken.data.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Redemption token has expired'
      });
    }

    // Check if coupon still exists and is active
    const couponRecord = await databaseService.getNFTCoupon(secureToken.data.nftId);
    if (!couponRecord || couponRecord.redemption_status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Coupon is no longer valid or has been redeemed'
      });
    }

    // Fetch coupon details from database
    const couponDetails = await databaseService.getNFTCoupon(secureToken.data.nftId);
    if (!couponDetails) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found in database'
      });
    }

    // Fetch campaign details to get coupon name and discount info
    const campaign = await databaseService.getCampaign(couponDetails.campaign_id);
    
    console.log(`✅ Verified redemption token for NFT ${secureToken.data.nftId}`);

    res.json({
      success: true,
      message: 'Redemption token is valid',
      couponData: {
        nftId: secureToken.data.nftId,
        userAccountId: secureToken.data.userAccountId,
        merchantAccountId: secureToken.data.merchantAccountId,
        tokenId: secureToken.data.tokenId,
        serialNumber: secureToken.data.serialNumber,
        issuedAt: secureToken.data.issuedAt,
        // Add campaign details for display
        name: campaign?.name || 'Unknown Coupon',
        description: campaign?.description || '',
        discountType: campaign?.discount_type || '',
        value: campaign?.discount_value || 0,
        expiresAt: campaign?.end_date || null
      }
    });

  } catch (error) {
    console.error('Error verifying redemption token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify redemption token'
    });
  }
});

/**
 * Get shareable link for a campaign
 */
app.get('/api/campaigns/:campaignId/share-link', async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await databaseService.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Generate shareable link (you can customize the domain)
    const shareLink = `exp://192.168.0.49:8081/--/claim/${campaignId}`;
    const webLink = `https://dysco.app/claim/${campaignId}`; // For future web version

    res.json({
      success: true,
      shareLink,
      webLink,
      campaign: {
        name: campaign.name,
        description: campaign.description,
        expiresAt: campaign.end_date
      }
    });

  } catch (error) {
    console.error('Error generating share link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate share link'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Dysco backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Hedera status: ${hederaClient.operatorAccountId ? 'Connected' : 'Not configured'}`);
}); 