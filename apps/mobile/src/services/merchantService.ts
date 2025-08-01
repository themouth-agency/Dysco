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
      if (!user) return null;

      let profile = await supabaseAuthService.getMerchantProfile(user.id);
      
      // If no profile exists, create one
      if (!profile) {
        console.log('No merchant profile found, creating one...');
        const API_BASE_URL = 'http://192.168.0.162:3001';
        const response = await fetch(`${API_BASE_URL}/api/merchants/create-record`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email
          }),
        });

        const result = await response.json();
        if (result.success) {
          // Try to get the profile again
          profile = await supabaseAuthService.getMerchantProfile(user.id);
        } else {
          console.error('Failed to create merchant record:', result.error);
        }
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
      const profile = await this.getMerchantProfile();
      if (!profile) {
        return {
          success: false,
          error: 'Merchant profile not found'
        };
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