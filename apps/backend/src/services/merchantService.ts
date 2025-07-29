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
      const merchantId = `merchant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const merchantData: MerchantData = {
        id: merchantId,
        name: registration.name,
        email: registration.email,
        businessType: registration.businessType,
        fiatPaymentStatus: 'paid', // Assuming payment completed before registration
        onboardingStatus: 'pending',
        createdAt: new Date().toISOString()
      };

      this.merchantStorage.set(merchantId, merchantData);
      
      console.log(`✅ Registered new merchant: ${registration.name} (${merchantId})`);
      
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
      const merchant = this.merchantStorage.get(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Convert hex public key to Hedera format
      const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
      const hederaPublicKey = PublicKey.fromBytes(publicKeyBytes);

      // Create merchant account (we pay the fee)
      const accountCreateTx = new AccountCreateTransaction()
        .setKey(hederaPublicKey) // Use THEIR public key
        .setInitialBalance(new Hbar(2)) // Give merchant some starting HBAR
        .setMaxAutomaticTokenAssociations(100) // Allow auto-association of tokens
        .setMaxTransactionFee(new Hbar(2)); // We pay up to 2 HBAR for account creation

      const accountCreateResponse = await accountCreateTx.execute(this.client);
      const accountCreateReceipt = await accountCreateResponse.getReceipt(this.client);
      
      if (!accountCreateReceipt.accountId) {
        throw new Error('Failed to create merchant account');
      }

      // Update merchant data (NO private key stored - it stays on device!)
      merchant.hederaAccountId = accountCreateReceipt.accountId.toString();
      merchant.hederaPublicKey = publicKeyHex; // Store public key for verification
      merchant.onboardingStatus = 'account_created';
      
      this.merchantStorage.set(merchantId, merchant);

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
   * Legacy method: Create Hedera account for merchant (we pay the fees)
   */
  async createMerchantAccount(merchantId: string): Promise<{
    success: boolean;
    accountId?: string;
    publicKey?: string;
    privateKey?: string; // Added for demo co-signing
    error?: string;
  }> {
    try {
      const merchant = this.merchantStorage.get(merchantId);
      if (!merchant) {
        throw new Error('Merchant not found');
      }

      // Generate new key pair for the merchant
      const merchantPrivateKey = PrivateKey.generateED25519();
      const merchantPublicKey = merchantPrivateKey.publicKey;

      // Create merchant account (we pay the fee)
      const accountCreateTx = new AccountCreateTransaction()
        .setKey(merchantPublicKey)
        .setInitialBalance(new Hbar(2)) // Give merchant some starting HBAR
        .setMaxAutomaticTokenAssociations(100) // Allow auto-association of tokens
        .setMaxTransactionFee(new Hbar(2)); // We pay up to 2 HBAR for account creation

      const accountCreateResponse = await accountCreateTx.execute(this.client);
      const accountCreateReceipt = await accountCreateResponse.getReceipt(this.client);
      
      if (!accountCreateReceipt.accountId) {
        throw new Error('Failed to create merchant account');
      }

      // Update merchant data (store private key for demo co-signing)
      merchant.hederaAccountId = accountCreateReceipt.accountId.toString();
      merchant.hederaPublicKey = merchantPublicKey.toStringDer();
      merchant.onboardingStatus = 'account_created';
      
      // Store private key in merchant data for demo (NEVER do this in production!)
      (merchant as any).privateKey = merchantPrivateKey.toStringDer();
      
      this.merchantStorage.set(merchantId, merchant);

      console.log(`✅ Created Hedera account for merchant ${merchant.name}: ${merchant.hederaAccountId}`);
      console.log(`🔐 Merchant private key stored for demo co-signing`);

      return {
        success: true,
        accountId: merchant.hederaAccountId,
        publicKey: merchant.hederaPublicKey,
        privateKey: merchantPrivateKey.toStringDer() // Return for immediate use
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
      const merchant = this.merchantStorage.get(merchantId);
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
      merchant.onboardingStatus = 'collection_created';
      
      this.merchantStorage.set(merchantId, merchant);

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
      const merchant = this.merchantStorage.get(merchantId);
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
      
      this.merchantStorage.set(merchantId, merchant);

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
      const merchant = this.merchantStorage.get(merchantId);
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
      
      this.merchantStorage.set(merchantId, merchant);

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
   * Get merchant data
   */
  getMerchant(merchantId: string): MerchantData | undefined {
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