import { Coupon } from '../types';

const API_BASE_URL = 'http://192.168.0.162:3001'; // Your computer's IP address

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const fetchAvailableCoupons = async (): Promise<{ coupons: Coupon[] }> => {
  try {
    // Fetch all NFT metadata from our backend
    const response = await fetch(`${API_BASE_URL}/api/nft/metadata`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch NFT metadata');
    }

    // Transform NFT metadata to Coupon format
    const coupons: Coupon[] = data.metadata.map((item: any) => ({
      id: item.nftId,
      name: item.metadata.name,
      description: item.metadata.description,
      merchant: item.metadata.properties.merchant,
      value: item.metadata.properties.value,
      category: item.metadata.properties.category,
      validUntil: item.metadata.properties.validUntil,
      imageUrl: item.metadata.image,
      termsAndConditions: item.metadata.properties.termsAndConditions,
      isAvailable: true, // All minted NFTs are available for claiming
      tokenId: item.nftId.split(':')[0],
      serialNumber: parseInt(item.nftId.split(':')[1])
    }));

    return { coupons };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw new Error('Failed to fetch coupons');
  }
};

export const claimCoupon = async (couponId: string, userWalletAddress: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/coupons/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        couponId,
        userWalletAddress,
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