import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database interfaces
export interface MerchantRecord {
  hedera_account_id: string; // Primary key in database
  id: string; // Supabase user ID
  email: string;
  name: string;
  business_type: string;
  hedera_public_key: string;
  nft_collection_id?: string;
  fiat_payment_status: 'pending' | 'paid' | 'failed';
  onboarding_status: 'pending' | 'account_created' | 'collection_created' | 'active';
  created_at: string;
  activated_at?: string;
}

export interface NFTCouponRecord {
  nft_id: string;
  token_id: string;
  serial_number: number;
  merchant_account_id: string;
  metadata: any; // JSONB field for HIP-412 metadata
  created_at: string;
}

class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Supabase credentials not found - using memory storage');
      this.supabase = null as any;
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase database');
  }

  /**
   * Initialize database tables (development helper)
   */
  async initializeTables(): Promise<void> {
    if (!this.supabase) {
      console.log('📝 Skipping table initialization - no database connection');
      return;
    }

    try {
      // Check if tables exist by trying to select from them
      const { error: merchantError } = await this.supabase
        .from('merchants')
        .select('hedera_account_id')
        .limit(1);

      if (merchantError?.code === 'PGRST116') {
        console.log('📊 Tables need to be created. Please run the SQL setup in Supabase dashboard.');
        console.log(`
=== SUPABASE SQL SETUP ===
Run this in your Supabase SQL editor:

-- Merchants table
CREATE TABLE merchants (
  id VARCHAR(50) PRIMARY KEY, -- Supabase user ID
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  business_name VARCHAR(255),
  business_type VARCHAR(100),
  hedera_account_id VARCHAR(20),
  hedera_public_key VARCHAR(128),
  nft_collection_id VARCHAR(20),
  fiat_payment_status VARCHAR(20) DEFAULT 'pending',
  onboarding_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP
);

-- NFT Coupons table
CREATE TABLE nft_coupons (
  nft_id VARCHAR(30) PRIMARY KEY,
  token_id VARCHAR(20) NOT NULL,
  serial_number INTEGER NOT NULL,
  merchant_account_id VARCHAR(20),
  metadata JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_merchants_email ON merchants(email);
CREATE INDEX idx_merchants_hedera_account ON merchants(hedera_account_id);
CREATE INDEX idx_nft_merchant ON nft_coupons(merchant_account_id);
CREATE INDEX idx_nft_token_serial ON nft_coupons(token_id, serial_number);

=== END SQL SETUP ===
        `);
      } else {
        console.log('✅ Database tables are ready');
      }
    } catch (error) {
      console.error('Error checking tables:', error);
    }
  }

  // === MERCHANT OPERATIONS ===

  async createMerchant(merchant: Omit<MerchantRecord, 'created_at'>): Promise<MerchantRecord> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .insert([merchant])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create merchant: ${error.message}`);
    }

    return data;
  }

  async getMerchantByAccountId(accountId: string): Promise<MerchantRecord | null> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .select('*')
      .eq('hedera_account_id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get merchant: ${error.message}`);
    }

    return data;
  }

  async getMerchantById(id: string): Promise<MerchantRecord | null> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get merchant: ${error.message}`);
    }

    return data;
  }

  async getMerchantByPublicKey(publicKey: string): Promise<MerchantRecord | null> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .select('*')
      .eq('hedera_public_key', publicKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get merchant: ${error.message}`);
    }

    return data;
  }

  async getMerchantByEmail(email: string): Promise<MerchantRecord | null> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get merchant: ${error.message}`);
    }

    return data;
  }

  async updateMerchant(merchantId: string, updates: Partial<MerchantRecord>): Promise<MerchantRecord> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .update(updates)
      .eq('id', merchantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update merchant: ${error.message}`);
    }

    return data;
  }

  async getAllMerchants(): Promise<MerchantRecord[]> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get merchants: ${error.message}`);
    }

    return data || [];
  }

  // === NFT COUPON OPERATIONS ===

  async createNFTCoupon(coupon: Omit<NFTCouponRecord, 'created_at'>): Promise<NFTCouponRecord> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('nft_coupons')
      .insert([coupon])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create NFT coupon: ${error.message}`);
    }

    return data;
  }

  async getNFTCoupon(nftId: string): Promise<NFTCouponRecord | null> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('nft_coupons')
      .select('*')
      .eq('nft_id', nftId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to get NFT coupon: ${error.message}`);
    }

    return data;
  }

  async getAllNFTCoupons(): Promise<NFTCouponRecord[]> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('nft_coupons')
      .select(`
        *,
        merchants (
          name,
          business_type
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get NFT coupons: ${error.message}`);
    }

    return data || [];
  }

  async getNFTCouponsByMerchant(merchantAccountId: string): Promise<NFTCouponRecord[]> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('nft_coupons')
      .select('*')
      .eq('merchant_account_id', merchantAccountId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get merchant NFT coupons: ${error.message}`);
    }

    return data || [];
  }

  // === UTILITY METHODS ===

  async getStats(): Promise<{
    totalMerchants: number;
    activeMerchants: number;
    totalCoupons: number;
    totalCollections: number;
  }> {
    if (!this.supabase) {
      return {
        totalMerchants: 0,
        activeMerchants: 0,
        totalCoupons: 0,
        totalCollections: 0
      };
    }

    try {
      const [merchantsResult, activeMerchantsResult, couponsResult] = await Promise.all([
        this.supabase.from('merchants').select('hedera_account_id', { count: 'exact', head: true }),
        this.supabase.from('merchants').select('hedera_account_id', { count: 'exact', head: true }).eq('onboarding_status', 'active'),
        this.supabase.from('nft_coupons').select('nft_id', { count: 'exact', head: true })
      ]);

      const collectionsResult = await this.supabase
        .from('merchants')
        .select('nft_collection_id')
        .not('nft_collection_id', 'is', null);

      return {
        totalMerchants: merchantsResult.count || 0,
        activeMerchants: activeMerchantsResult.count || 0,
        totalCoupons: couponsResult.count || 0,
        totalCollections: collectionsResult.data?.length || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalMerchants: 0,
        activeMerchants: 0,
        totalCoupons: 0,
        totalCollections: 0
      };
    }
  }

  /**
   * Create merchant record from Supabase auth user
   */
  async createMerchantFromAuth(userId: string, email: string): Promise<MerchantRecord> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('merchants')
      .insert({
        id: userId,
        email: email,
        name: null,
        business_type: null,
        hedera_account_id: null,
        hedera_public_key: null,
        nft_collection_id: null,
        onboarding_status: 'pending',
        fiat_payment_status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create merchant record: ${error.message}`);
    }

    return data;
  }

  /**
   * Record a coupon redemption
   */
  async recordRedemption(redemptionData: {
    nftId: string;
    userAccountId: string;
    merchantAccountId: string;
    redemptionTransactionId: string;
    scannedAt: string;
    redemptionMethod: string;
  }): Promise<void> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { error } = await this.supabase
      .from('coupon_redemptions')
      .insert({
        nft_id: redemptionData.nftId,
        user_account_id: redemptionData.userAccountId,
        merchant_account_id: redemptionData.merchantAccountId,
        redemption_transaction_id: redemptionData.redemptionTransactionId,
        scanned_at: redemptionData.scannedAt,
        redeemed_at: new Date().toISOString(),
        redemption_method: redemptionData.redemptionMethod
      });

    if (error) {
      throw new Error(`Failed to record redemption: ${error.message}`);
    }
  }

  /**
   * Record user wallet activity
   */
  async recordUserActivity(activityData: {
    userAccountId: string;
    activityType: 'claim' | 'redeem' | 'transfer';
    nftId?: string;
    transactionId?: string;
    details?: any;
  }): Promise<void> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { error } = await this.supabase
      .from('user_wallet_activity')
      .insert({
        user_account_id: activityData.userAccountId,
        activity_type: activityData.activityType,
        nft_id: activityData.nftId,
        transaction_id: activityData.transactionId,
        details: activityData.details,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to record user activity: ${error.message}`);
    }
  }

  /**
   * Get redemption history for a merchant
   */
  async getRedemptionHistory(merchantAccountId: string): Promise<any[]> {
    if (!this.supabase) {
      throw new Error('Database not connected');
    }

    const { data, error } = await this.supabase
      .from('coupon_redemptions')
      .select('*')
      .eq('merchant_account_id', merchantAccountId)
      .order('redeemed_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get redemption history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if database is connected and ready
   */
  isConnected(): boolean {
    return !!this.supabase;
  }
}

export const databaseService = new DatabaseService(); 