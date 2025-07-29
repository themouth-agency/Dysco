import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  AccountId,
  TokenId,
  TokenAssociateTransaction,
  PrivateKey
} from '@hashgraph/sdk';

export interface CouponMetadata {
  name: string;
  description: string;
  image: string;
  type: string;
  properties: {
    merchant: string;
    value: string;
    category: string;
    validUntil: string;
    termsAndConditions: string;
    // Enhanced campaign properties
    campaign?: string;
    campaignType?: string;
    validFrom?: string;
    maxUsesPerCustomer?: number;
    targetAudience?: string;
    totalLimit?: number;
  };
}

export interface CouponData {
  name: string;
  description: string;
  merchant: string;
  value: string;
  category: string;
  validUntil: string;
  imageUrl?: string;
  // Campaign-specific properties
  campaign?: string; // e.g., "Summer2025", "BlackFriday2025"
  campaignType?: 'percentage' | 'fixed_amount' | 'bogo' | 'free_shipping';
  validFrom?: string;
  maxUsesPerCustomer?: number;
  targetAudience?: 'all' | 'new_customers' | 'vip' | 'repeat_customers';
  totalLimit?: number; // Total campaign limit
}

export class NFTService {
  private client: Client;
  private operatorAccountId: AccountId;
  private operatorPrivateKey: PrivateKey;
  private couponCollectionId?: TokenId;
  private metadataStorage: Map<string, CouponMetadata> = new Map();

  constructor(client: Client, operatorAccountId: AccountId, operatorPrivateKey: PrivateKey) {
    this.client = client;
    this.operatorAccountId = operatorAccountId;
    this.operatorPrivateKey = operatorPrivateKey;
  }

  /**
   * Create the main coupon NFT collection
   */
  async createCouponCollection(): Promise<TokenId> {
    try {
      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName('Dysco Coupons')
        .setTokenSymbol('COUPO')
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.operatorAccountId)
        .setAdminKey(this.operatorPrivateKey)
        .setSupplyKey(this.operatorPrivateKey)
        .setWipeKey(this.operatorPrivateKey)
        .setFreezeKey(this.operatorPrivateKey)
        .setMaxTransactionFee(50); // 50 HBAR max fee

      const tokenCreateResponse = await tokenCreateTx.execute(this.client);
      const tokenCreateReceipt = await tokenCreateResponse.getReceipt(this.client);
      
      if (!tokenCreateReceipt.tokenId) {
        throw new Error('Failed to create NFT collection - no token ID returned');
      }

      this.couponCollectionId = tokenCreateReceipt.tokenId;
      console.log(`✅ Created Dysco NFT collection: ${this.couponCollectionId.toString()}`);
      
      return this.couponCollectionId;
    } catch (error) {
      console.error('Error creating NFT collection:', error);
      throw new Error(`Failed to create NFT collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set the collection ID if it already exists
   */
  setCouponCollectionId(tokenId: string): void {
    this.couponCollectionId = TokenId.fromString(tokenId);
  }

  /**
   * Create HIP-412 compliant metadata URL for a coupon
   */
  private createMetadataUrl(serialNumber: number): string {
    // For now, we'll use a placeholder URL structure
    // In production, this would point to your actual metadata hosting service
    return `https://api.dysco.com/metadata/${this.couponCollectionId}/${serialNumber}.json`;
  }

  /**
   * Create the full HIP-412 metadata object (for external hosting)
   */
  createFullCouponMetadata(couponData: CouponData): CouponMetadata {
    return {
      name: couponData.name,
      description: couponData.description,
      image: couponData.imageUrl || 'https://via.placeholder.com/400x300?text=Coupon',
      type: 'object',
      properties: {
        merchant: couponData.merchant,
        value: couponData.value,
        category: couponData.category,
        validUntil: couponData.validUntil,
        termsAndConditions: 'Valid for one-time use only. Cannot be combined with other offers.',
        // Enhanced campaign metadata
        campaign: couponData.campaign || 'Default',
        campaignType: couponData.campaignType || 'percentage',
        validFrom: couponData.validFrom || new Date().toISOString().split('T')[0],
        maxUsesPerCustomer: couponData.maxUsesPerCustomer || 1,
        targetAudience: couponData.targetAudience || 'all',
        totalLimit: couponData.totalLimit
      }
    };
  }

  /**
   * Mint a new coupon NFT for a specific merchant collection
   */
  async mintCouponForMerchant(couponData: CouponData, merchantCollectionId: string): Promise<{
    success: boolean;
    tokenId?: string;
    serialNumber?: number;
    transactionId?: string;
    error?: string;
  }> {
    try {
      const collectionTokenId = TokenId.fromString(merchantCollectionId);

      // First mint with a placeholder URL, then we'll store the actual metadata
      const mintTx = new TokenMintTransaction()
        .setTokenId(collectionTokenId)
        .setMetadata([Buffer.from('{"type":"coupon"}', 'utf8')]) // Minimal metadata
        .setMaxTransactionFee(20); // 20 HBAR max fee (we pay this)

      const mintResponse = await mintTx.execute(this.client);
      const mintReceipt = await mintResponse.getReceipt(this.client);

      if (!mintReceipt.serials || mintReceipt.serials.length === 0) {
        throw new Error('Failed to mint NFT - no serial number returned');
      }

      const serialNumber = mintReceipt.serials[0].toNumber();
      const nftId = `${merchantCollectionId}:${serialNumber}`;

      // Store the full metadata in our local storage
      const fullMetadata = this.createFullCouponMetadata(couponData);
      this.metadataStorage.set(nftId, fullMetadata);

      console.log(`✅ Minted coupon NFT for merchant collection: ${nftId}`);

      return {
        success: true,
        tokenId: merchantCollectionId,
        serialNumber,
        transactionId: mintResponse.transactionId.toString()
      };
    } catch (error) {
      console.error('Error minting coupon NFT for merchant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while minting'
      };
    }
  }

  /**
   * Legacy mint method (backwards compatibility)
   */
  async mintCoupon(couponData: CouponData): Promise<{
    success: boolean;
    tokenId?: string;
    serialNumber?: number;
    transactionId?: string;
    error?: string;
  }> {
    if (!this.couponCollectionId) {
      throw new Error('No default collection set. Use mintCouponForMerchant() instead.');
    }
    return this.mintCouponForMerchant(couponData, this.couponCollectionId.toString());
  }

  /**
   * Transfer a coupon NFT to a user
   */
  async transferCoupon(
    tokenId: string,
    serialNumber: number,
    fromAccountId: string,
    toAccountId: string
  ): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      const transferTx = new TransferTransaction()
        .addNftTransfer(
          TokenId.fromString(tokenId),
          serialNumber,
          AccountId.fromString(fromAccountId),
          AccountId.fromString(toAccountId)
        )
        .setMaxTransactionFee(10); // 10 HBAR max fee

      const transferResponse = await transferTx.execute(this.client);
      await transferResponse.getReceipt(this.client);

      console.log(`✅ Transferred NFT ${tokenId}:${serialNumber} from ${fromAccountId} to ${toAccountId}`);

      return {
        success: true,
        transactionId: transferResponse.transactionId.toString()
      };
    } catch (error) {
      console.error('Error transferring coupon NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during transfer'
      };
    }
  }

  /**
   * Associate a token with an account (required before receiving NFTs)
   */
  async associateToken(accountId: string, accountPrivateKey: string): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    try {
      if (!this.couponCollectionId) {
        throw new Error('Coupon collection not initialized');
      }

      const privateKey = PrivateKey.fromString(accountPrivateKey);
      
      const associateTx = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(accountId))
        .setTokenIds([this.couponCollectionId]);

      const signedTx = await associateTx.freezeWith(this.client).sign(privateKey);
      const associateResponse = await signedTx.execute(this.client);
      await associateResponse.getReceipt(this.client);

      console.log(`✅ Associated token ${this.couponCollectionId} with account ${accountId}`);

      return {
        success: true,
        transactionId: associateResponse.transactionId.toString()
      };
    } catch (error) {
      console.error('Error associating token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during token association'
      };
    }
  }

  /**
   * Get the current coupon collection ID
   */
  getCouponCollectionId(): string | undefined {
    return this.couponCollectionId?.toString();
  }

  /**
   * Get NFT metadata by NFT ID
   */
  getMetadata(nftId: string): CouponMetadata | undefined {
    return this.metadataStorage.get(nftId);
  }

  /**
   * Get all stored metadata
   */
  getAllMetadata(): Map<string, CouponMetadata> {
    return this.metadataStorage;
  }
} 