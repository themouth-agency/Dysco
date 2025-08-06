import { Coupon } from '../types';
import { API_BASE_URL } from '../config/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const fetchAvailableCoupons = async (): Promise<{ campaigns: any[] }> => {
  try {
    // Fetch discoverable campaigns from our backend
    const response = await fetch(`${API_BASE_URL}/api/campaigns/discover`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch discoverable campaigns');
    }

    return { campaigns: data.campaigns };
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error('Failed to fetch campaigns');
  }
};

export const claimCoupon = async (nftId: string, userAccountId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coupons/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nftId,
        userAccountId,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error claiming coupon:', error);
    throw new Error('Failed to claim coupon');
  }
};

export const redeemCoupon = async (couponId: string, merchantId: string, qrData: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coupons/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        couponId,
        merchantId,
        qrData,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    throw new Error('Failed to redeem coupon');
  }
};

export const createHederaAccount = async (publicKey: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/wallet/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicKey,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating Hedera account:', error);
    throw new Error('Failed to create Hedera account');
  }
};

export const getAccountBalance = async (accountId: string): Promise<{ success: boolean; balance: number; error?: string }> => {
  try {
    if (!accountId) {
      throw new Error('Account ID is required but was undefined or empty');
    }

    console.log('Fetching balance for account ID:', accountId);
    const response = await fetch(`${API_BASE_URL}/api/wallet/balance/${accountId}`);
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        balance: parseFloat(data.balance) || 0
      };
    } else {
      return {
        success: false,
        balance: 0,
        error: data.error || 'Failed to get balance'
      };
    }
  } catch (error) {
    console.error('Error getting account balance:', error);
    return {
      success: false,
      balance: 0,
      error: 'Failed to get account balance'
    };
  }
};

export const getUserCoupons = async (accountId: string): Promise<{ success: boolean; coupons?: Coupon[]; error?: string }> => {
  try {
    if (!accountId) {
      throw new Error('Account ID is required but was undefined or empty');
    }

    console.log('Fetching user coupons for account ID:', accountId);
    const response = await fetch(`${API_BASE_URL}/api/users/${accountId}/coupons`);
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        coupons: data.coupons || []
      };
    } else {
      return {
        success: false,
        coupons: [],
        error: data.error || 'Failed to get user coupons'
      };
    }
  } catch (error) {
    console.error('Error getting user coupons:', error);
    return {
      success: false,
      coupons: [],
      error: 'Failed to get user coupons'
    };
  }
};

// Claim a coupon from a campaign
export const claimCampaignCoupon = async (campaignId: string, userAccountId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAccountId,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to claim coupon');
    }
    
    return data;
  } catch (error) {
    console.error('Error claiming coupon:', error);
    throw error;
  }
};

// Get shareable link for a campaign
export const getCampaignShareLink = async (campaignId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/share-link`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get share link');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting share link:', error);
    throw error;
  }
};

// Generate secure redemption token for a coupon
export const generateRedemptionToken = async (nftId: string, userAccountId: string) => {
  try {
    console.log('🌐 API: Calling generate-redemption-token with:', { nftId, userAccountId });
    const response = await fetch(`${API_BASE_URL}/api/coupons/generate-redemption-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nftId,
        userAccountId,
      }),
    });

    const data = await response.json();
    console.log('🌐 API: Raw response from backend:', data);
    
    if (!response.ok) {
      console.log('❌ API: Response not ok:', response.status, data);
      return {
        success: false,
        error: data.error || 'Failed to generate redemption token'
      };
    }
    
    // Backend returns { redemptionToken: "..." }
    return {
      success: true,
      token: data.redemptionToken,
      ...data
    };
  } catch (error) {
    console.error('❌ API: Error generating redemption token:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate redemption token'
    };
  }
};

// Verify redemption token (for merchants)
export const verifyRedemptionToken = async (redemptionToken: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coupons/verify-redemption-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redemptionToken,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify redemption token');
    }
    
    return data;
  } catch (error) {
    console.error('Error verifying redemption token:', error);
    throw error;
  }
};

// User wipes their own coupon (permanent destruction)
export const burnCoupon = async (nftId: string, userAccountId: string, userPrivateKey: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coupons/burn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nftId,
        userAccountId,
        userPrivateKey,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to burn coupon');
    }
    
    return data;
  } catch (error) {
    console.error('Error burning coupon:', error);
    throw error;
  }
};

// Get merchant redemption history
export const getMerchantRedemptionHistory = async (merchantId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/merchants/${merchantId}/redemptions`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch redemption history');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching merchant redemption history:', error);
    throw error;
  }
};

// Get user redemption history
export const getUserRedemptionHistory = async (userAccountId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userAccountId}/redemptions`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user redemption history');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user redemption history:', error);
    throw error;
  }
};

// Redeem discount code coupon (burn NFT and get discount code)
export const redeemDiscountCodeCoupon = async (nftId: string, userAccountId: string, userPrivateKey: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coupons/redeem-discount-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nftId,
        userAccountId,
        userPrivateKey,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to redeem discount code coupon');
    }
    
    return data;
  } catch (error) {
    console.error('Error redeeming discount code coupon:', error);
    throw error;
  }
}; 