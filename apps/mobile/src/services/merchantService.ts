import { supabaseAuthService } from './supabaseAuth';

export interface CouponMintRequest {
  name: string;
  description: string;
  value: string;
  category: string;
  validUntil: string;
  imageUrl: string;
}

export interface SignedCouponRequest {
  merchantId: string;
  collectionId: string;
  merchantAccountId: string;
  couponData: CouponMintRequest;
  timestamp: string;
  signature: string;
  publicKey: string;
}

class MerchantService {
  private static instance: MerchantService;

  private constructor() {}

  static getInstance(): MerchantService {
    if (!MerchantService.instance) {
      MerchantService.instance = new MerchantService();
    }
    return MerchantService.instance;
  }

  /**
   * Check if merchant is authenticated via Supabase
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      return await supabaseAuthService.isAuthenticated();
    } catch (error) {
      console.error('Error checking merchant authentication:', error);
      return false;
    }
  }

  /**
   * Get current merchant user
   */
  async getCurrentUser() {
    try {
      return await supabaseAuthService.getCurrentUser();
    } catch (error) {
      console.error('Error getting current merchant user:', error);
      return null;
    }
  }

  /**
   * Get merchant profile from Supabase
   */
  async getMerchantProfile() {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        console.log('❌ No current user found');
        return null;
      }

      console.log(`🔍 Looking for merchant profile for user: ${user.id}`);
      const profile = await supabaseAuthService.getMerchantProfile(user.id);
      
      if (!profile) {
        console.log('❌ No merchant profile found in database');
        console.log('💡 Profile should have been created during registration');
      } else {
        console.log(`✅ Found merchant profile: ${profile.name} (${profile.hedera_account_id})`);
      }

      return profile;
    } catch (error) {
      console.error('Error getting merchant profile:', error);
      return null;
    }
  }

  /**
   * Create a coupon mint request (without signing - backend will handle)
   */
  async createCouponMintRequest(couponData: CouponMintRequest): Promise<{
    success: boolean;
    request?: any;
    error?: string;
  }> {
    try {
      // Check if merchant is authenticated
      const isAuthenticated = await this.isAuthenticated();
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Merchant not authenticated'
        };
      }

      // Get merchant profile
      let profile = await this.getMerchantProfile();
      if (!profile) {
        // Try to refresh the profile - might have been created recently
        console.log('🔄 Profile not found, attempting to fetch from backend...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        profile = await this.getMerchantProfile();
        
        if (!profile) {
          return {
            success: false,
            error: 'Merchant profile not found. Please log out and log back in.'
          };
        }
      }

      // Create request object (backend will handle signing)
      const request = {
        merchantId: profile.id,
        collectionId: profile.nft_collection_id || 'CREATE_NEW',
        merchantAccountId: profile.hedera_account_id,
        couponData,
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        request
      };
    } catch (error) {
      console.error('Error creating coupon mint request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Sign out merchant
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      return await supabaseAuthService.signOut();
    } catch (error) {
      console.error('Error signing out merchant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const merchantService = MerchantService.getInstance(); 