import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountCreateTransaction,
  Hbar,
  PrivateKey,
  PublicKey,
  AccountId,
  TokenId
} from '@hashgraph/sdk';
import { databaseService, MerchantRecord } from './databaseService';

export interface MerchantData {
  id: string;
  name: string;
  email: string;
  businessType: string;
  hederaAccountId?: string;
  hederaPublicKey?: string;
  nftCollectionId?: string;
  fiatPaymentStatus: 'pending' | 'paid' | 'failed';
  onboardingStatus: 'pending' | 'account_created' | 'collection_created' | 'active';
  createdAt: string;
  activatedAt?: string;
  // Recovery data (encrypted)
  encryptedRecoveryData?: string; // Encrypted backup of merchant keys
  recoveryEmail?: string; // For email-based recovery
}

export interface MerchantRegistration {
  name: string;
  email: string;
  businessType: string;
  fiatPaymentAmount: number; // USD amount paid for service
}

export class MerchantService {
  private client: Client;
  private operatorAccountId: AccountId;
  private operatorPrivateKey: PrivateKey;
  private merchantStorage: Map<string, MerchantData> = new Map();

  constructor(client: Client, operatorAccountId: AccountId, operatorPrivateKey: PrivateKey) {
    this.client = client;
    this.operatorAccountId = operatorAccountId;
    this.operatorPrivateKey = operatorPrivateKey;
  }

  /**
   * Register a new merchant (after they pay fiat)
   */
  async registerMerchant(registration: MerchantRegistration): Promise<{
    success: boolean;
    merchantId?: string;
    error?: string;
  }> {
    try {
      // Check if email already exists
      if (databaseService.isConnected()) {
        const existingMerchant = await databaseService.getMerchantByEmail(registration.email);
        if (existingMerchant) {
          return {
            success: false,
            error: `A merchant account already exists with email ${registration.email}. Please use a different email or contact support if this is your account.`
          };
        }
      }

      const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const tempAccountId = `tmp_${Date.now()}`;
      const merchantData: MerchantData = {
        id: merchantId,
        name: registration.name,
        email: registration.email,
        businessType: registration.businessType,
        fiatPaymentStatus: 'paid', // Assuming payment completed before registration
        onboardingStatus: 'pending',
        createdAt: new Date().toISOString(),
        hederaAccountId: tempAccountId // Store temp ID so we can update it later
      };

      // Store merchant in database instead of memory
      if (databaseService.isConnected()) {
        await databaseService.createMerchant({
          hedera_account_id: tempAccountId, // Short temporary unique ID until real account is created
          id: merchantId,
          name: registration.name,
          email: registration.email,
          business_type: registration.businessType,
          hedera_public_key: '', // Will be set when key is provided
          fiat_payment_status: 'paid',
          onboarding_status: 'pending'
        });
        console.log(`✅ Registered new merchant in database: ${registration.name} (${merchantId})`);
      } else {
        // Fallback to memory storage
        this.merchantStorage.set(merchantId, merchantData);
        console.log(`✅ Registered new merchant in memory: ${registration.name} (${merchantId})`);
      }
      
      return {
        success: true,
        merchantId
      };
    } catch (error) {
      console.error('Error registering merchant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create Hedera account for merchant using device-generated public key (SECURE!)
   */
  async createMerchantAccountWithKey(merchantId: string, publicKeyHex: string): Promise<{
    success: boolean;
    accountId?: string;
    error?: string;
  }> {
    try {
      // Get merchant from database instead of memory
      const merchant = await this.getMerchantAsync(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Convert hex public key to Hedera format
      const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
      const hederaPublicKey = PublicKey.fromBytes(publicKeyBytes);

      // Create merchant account (we pay the fee)
      const accountCreateTx = new AccountCreateTransaction()
        .setKey(hederaPublicKey) // Use THEIR public key --> this should be the DYSCO public key, same as all merchants!
        .setInitialBalance(new Hbar(2)) // Give merchant some starting HBAR --> no, it doesnt need hbar
        .setMaxAutomaticTokenAssociations(100) // Allow auto-association of tokens --> no it doesnt need this
        .setMaxTransactionFee(new Hbar(2)); // We pay up to 2 HBAR for account creation

      const accountCreateResponse = await accountCreateTx.execute(this.client);
      const accountCreateReceipt = await accountCreateResponse.getReceipt(this.client);
      
      if (!accountCreateReceipt.accountId) {
        throw new Error('Failed to create merchant account');
      }

      // Update merchant data (NO private key stored - it stays on device!)
      const newAccountId = accountCreateReceipt.accountId.toString();
      const oldTempId = merchant.hederaAccountId!; // Save the old temp ID before updating (must exist)
      
      merchant.hederaAccountId = newAccountId;
      merchant.hederaPublicKey = publicKeyHex; // Store public key for verification
      merchant.onboardingStatus = 'account_created';
      
      // Update in database instead of memory
      if (databaseService.isConnected()) {
        // Update using the old temporary ID to find the record
        await databaseService.updateMerchant(oldTempId, {
          hedera_account_id: newAccountId,
          hedera_public_key: publicKeyHex,
          onboarding_status: 'account_created'
        });
        console.log(`✅ Updated merchant in database: ${oldTempId} → ${newAccountId}`);
      } else {
        // Fallback to memory storage
        this.merchantStorage.set(merchantId, merchant);
      }

      console.log(`✅ Created Hedera account for merchant ${merchant.name}: ${merchant.hederaAccountId}`);
      console.log(`🔐 Private key remains secure on merchant's device`);

      return {
        success: true,
        accountId: merchant.hederaAccountId
      };
    } catch (error) {
      console.error('Error creating merchant account with device key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create Hedera representation account for merchant using operator's key
   */
  async createMerchantAccount(merchantId: string): Promise<{
    success: boolean;
    accountId?: string;
    publicKey?: string;
    error?: string;
  }> {
    try {
      const merchant = await this.getMerchantAsync(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      console.log(`🏢 Creating representation account for merchant: ${merchant.name}`);
      console.log(`🔑 Using operator's key (no new keys generated)`);

      // Use operator's public key (same key as Dysco's account 0.0.1293)
      if (!this.client.operatorPublicKey) {
        throw new Error('Operator public key not available');
      }

      // Create merchant account using OPERATOR'S key (pure representation)
      const accountCreateTx = new AccountCreateTransaction()
        .setKey(this.client.operatorPublicKey) // Same key as operator
        .setInitialBalance(0) // No HBAR needed - operator pays everything
        .setMaxTransactionFee(20); // Operator pays this fee

      const accountCreateResponse = await accountCreateTx.execute(this.client);
      const accountCreateReceipt = await accountCreateResponse.getReceipt(this.client);
      
      if (!accountCreateReceipt.accountId) {
        throw new Error('Failed to create merchant account');
      }

      // Update merchant data (NO private key storage - use operator's)
      merchant.hederaAccountId = accountCreateReceipt.accountId.toString();
      merchant.hederaPublicKey = this.client.operatorPublicKey.toString(); // Same as operator
      merchant.onboardingStatus = 'account_created';
      
      // Update in database instead of memory
      if (databaseService.isConnected()) {
        await databaseService.updateMerchant(merchant.id, {
          hedera_account_id: merchant.hederaAccountId!,
          hedera_public_key: merchant.hederaPublicKey!,
          onboarding_status: 'account_created'
        });
        console.log(`✅ Updated merchant account in database: ${merchant.hederaAccountId}`);
      } else {
        // Fallback to memory storage
        this.merchantStorage.set(merchantId, merchant);
      }

      console.log(`✅ Created Hedera representation account: ${merchant.hederaAccountId}`);
      console.log(`🔐 Account uses operator's key (${this.client.operatorAccountId}) - no separate keys`);
      console.log(`💰 No HBAR balance needed - operator pays all transactions`);

      return {
        success: true,
        accountId: merchant.hederaAccountId,
        publicKey: merchant.hederaPublicKey
        // NO privateKey returned - operator handles all signing
      };
    } catch (error) {
      console.error('Error creating merchant account:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create NFT collection for device-key merchants (operator as treasury - simpler for demo)
   */
  async createMerchantCollectionForDevice(merchantId: string): Promise<{
    success: boolean;
    collectionId?: string;
    error?: string;
  }> {
    try {
      const merchant = await this.getMerchantAsync(merchantId);
      if (!merchant || !merchant.hederaAccountId) {
        throw new Error('Merchant account not found or not created');
      }

      // For device-generated keys, we'll use operator as treasury to avoid co-signing complexity
      // In production, you'd implement proper co-signing flow here
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(`${merchant.name} Coupons`)
        .setTokenSymbol(`${merchant.name.replace(/\s+/g, '').substring(0, 5).toUpperCase()}`)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.operatorAccountId) // Operator as treasury (simpler)
        .setAdminKey(this.operatorPrivateKey) // We maintain admin control
        .setSupplyKey(this.operatorPrivateKey) // We can mint for them
        .setWipeKey(this.operatorPrivateKey) // We can wipe if needed
        .setMaxTransactionFee(new Hbar(50)); // We pay up to 50 HBAR for collection creation

      const tokenCreateResponse = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      
      if (!tokenCreateReceipt.tokenId) {
        throw new Error('Failed to create NFT collection');
      }

      // Update merchant data
      merchant.nftCollectionId = tokenCreateReceipt.tokenId.toString();
      // Only update status if not already active (preserve active status)
      if (merchant.onboardingStatus !== 'active') {
        merchant.onboardingStatus = 'collection_created';
      }
      
      // Update in database instead of memory
      if (databaseService.isConnected()) {
        const updateData: any = {
          nft_collection_id: merchant.nftCollectionId
        };
        // Only update status if not already active
        if (merchant.onboardingStatus !== 'active') {
          updateData.onboarding_status = 'collection_created';
        }
        await databaseService.updateMerchant(merchant.id, updateData);
        console.log(`✅ Updated merchant collection ID in database: ${merchant.hederaAccountId}`);
      } else {
        // Fallback to memory storage
        this.merchantStorage.set(merchantId, merchant);
      }

      console.log(`✅ Created NFT collection for ${merchant.name}: ${merchant.nftCollectionId}`);
      console.log(`🏦 Using operator as treasury for simplified demo flow`);
      
      return {
        success: true,
        collectionId: merchant.nftCollectionId
      };
    } catch (error) {
      console.error('Error creating merchant collection for device keys:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Legacy method: Create NFT collection for merchant (merchant account as treasury with co-signing)
   */
  async createMerchantCollection(merchantId: string): Promise<{
    success: boolean;
    collectionId?: string;
    error?: string;
  }> {
    try {
      const merchant = await this.getMerchantAsync(merchantId);
      if (!merchant || !merchant.hederaAccountId) {
        throw new Error('Merchant account not found or not created');
      }

      // Get the merchant's private key for co-signing
      const merchantPrivateKeyStr = (merchant as any).privateKey;
      if (!merchantPrivateKeyStr) {
        throw new Error('Merchant private key not found for co-signing');
      }

      const merchantAccountId = AccountId.fromString(merchant.hederaAccountId);
      const merchantPrivateKey = PrivateKey.fromString(merchantPrivateKeyStr);

      // Create NFT collection with merchant as treasury (requires co-signing)
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(`${merchant.name} Coupons`)
        .setTokenSymbol(`${merchant.name.replace(/\s+/g, '').substring(0, 5).toUpperCase()}`)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setInitialSupply(0)
        .setTreasuryAccountId(merchantAccountId) // Merchant is the treasury!
        .setAdminKey(this.operatorPrivateKey) // We maintain admin control
        .setSupplyKey(this.operatorPrivateKey) // We can mint for them
        .setWipeKey(this.operatorPrivateKey) // We can wipe if needed
        .setMaxTransactionFee(new Hbar(50)) // We pay up to 50 HBAR for collection creation
        .freezeWith(this.client); // Freeze before signing

      // Sign with both operator and merchant keys
      const operatorSignedTx = await tokenCreateTx.sign(this.operatorPrivateKey);
      const fullySignedTx = await operatorSignedTx.sign(merchantPrivateKey);

      const tokenCreateResponse = await fullySignedTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      
      if (!tokenCreateReceipt.tokenId) {
        throw new Error('Failed to create NFT collection');
      }

      // Update merchant data
      merchant.nftCollectionId = tokenCreateReceipt.tokenId.toString();
      merchant.onboardingStatus = 'collection_created';
      
      // Update in database instead of memory
      if (databaseService.isConnected()) {
        await databaseService.updateMerchant(merchant.id, {
          nft_collection_id: merchant.nftCollectionId,
          onboarding_status: 'collection_created'
        });
        console.log(`✅ Updated merchant collection ID in database: ${merchant.hederaAccountId}`);
      } else {
        // Fallback to memory storage
        this.merchantStorage.set(merchantId, merchant);
      }

      console.log(`✅ Created NFT collection for ${merchant.name}: ${merchant.nftCollectionId}`);
      console.log(`🔐 Transaction co-signed by merchant account: ${merchant.hederaAccountId}`);
      
      return {
        success: true,
        collectionId: merchant.nftCollectionId
      };
    } catch (error) {
      console.error('Error creating merchant collection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete merchant onboarding (mark as active)
   */
  async activateMerchant(merchantId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const merchant = await this.getMerchantAsync(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // For device-generated keys, we only require account creation
      if (!merchant.hederaAccountId) {
        throw new Error('Merchant account creation not complete');
      }
      
      // NFT collection is created lazily on first coupon mint
      console.log(`📝 Merchant will create NFT collection on first coupon mint`);

      merchant.onboardingStatus = 'active';
      merchant.activatedAt = new Date().toISOString();
      
      // Update in database instead of memory
      if (databaseService.isConnected() && merchant.id) {
        await databaseService.updateMerchant(merchant.id, {
          onboarding_status: 'active',
          activated_at: merchant.activatedAt
        });
        console.log(`✅ Updated merchant activation status in database: ${merchant.id}`);
      } else {
        // Fallback to memory storage
        this.merchantStorage.set(merchantId, merchant);
      }

      console.log(`✅ Activated merchant: ${merchant.name}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error activating merchant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get merchant data (legacy sync method - checks memory only)
   */
  getMerchant(merchantId: string): MerchantData | undefined {
    return this.merchantStorage.get(merchantId);
  }

  /**
   * Get merchant by ID (async - checks database first, then memory)
   */
  async getMerchantAsync(merchantId: string): Promise<MerchantData | undefined> {
    if (databaseService.isConnected()) {
      try {
        const dbMerchant = await databaseService.getMerchantById(merchantId);
        if (dbMerchant) {
                  // Convert database format to internal format
        return {
          id: dbMerchant.id,
          name: dbMerchant.name || '',
          email: dbMerchant.email,
          businessType: dbMerchant.business_type || '',
          hederaAccountId: dbMerchant.hedera_account_id,
          hederaPublicKey: dbMerchant.hedera_public_key,
          nftCollectionId: dbMerchant.nft_collection_id,
          fiatPaymentStatus: dbMerchant.fiat_payment_status as any,
          onboardingStatus: dbMerchant.onboarding_status as any,
          createdAt: dbMerchant.created_at
        };
        }
      } catch (error) {
        console.error('Error getting merchant from database:', error);
      }
    }
    
    // Fallback to memory storage
    return this.merchantStorage.get(merchantId);
  }

  /**
   * Get all merchants
   */
  getAllMerchants(): MerchantData[] {
    return Array.from(this.merchantStorage.values());
  }

  /**
   * Get merchants by status
   */
  getMerchantsByStatus(status: MerchantData['onboardingStatus']): MerchantData[] {
    return Array.from(this.merchantStorage.values())
      .filter(merchant => merchant.onboardingStatus === status);
  }

  /**
   * Get merchant by collection ID
   */
  getMerchantByCollection(collectionId: string): MerchantData | undefined {
    return Array.from(this.merchantStorage.values())
      .find(merchant => merchant.nftCollectionId === collectionId);
  }

  /**
   * Get merchant by public key (for recovery)
   */
  getMerchantByPublicKey(publicKey: string): MerchantData | undefined {
    return Array.from(this.merchantStorage.values())
      .find(merchant => merchant.hederaPublicKey === publicKey);
  }
} 