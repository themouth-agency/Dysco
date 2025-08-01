import 'react-native-get-random-values';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { ed25519 } from '@noble/curves/ed25519';
import { randomBytes } from '@noble/hashes/utils';

export interface MerchantWalletData {
  merchantId: string;
  name: string;
  email: string;
  hederaAccountId: string;
  hederaPublicKey: string;
  nftCollectionId?: string;
  businessType: string;
  onboardingStatus: string;
  createdAt: string;
}

export interface MerchantCredentials {
  privateKey: string;
  walletData: MerchantWalletData;
}

export interface CouponMintData {
  name: string;
  description: string;
  value: string;
  category: string;
  validUntil: string;
  imageUrl?: string;
}

const MERCHANT_STORAGE_KEY = 'merchant_wallet_data';
const MERCHANT_PRIVATE_KEY = 'merchant_private_key';

export class MerchantWalletService {
  private static instance: MerchantWalletService;
  private merchantCredentials: MerchantCredentials | null = null;

  private constructor() {}

  static getInstance(): MerchantWalletService {
    if (!MerchantWalletService.instance) {
      MerchantWalletService.instance = new MerchantWalletService();
    }
    return MerchantWalletService.instance;
  }

  /**
   * Check if merchant is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if merchant wallet exists in the new cryptoWalletService storage
      const { cryptoWalletService } = await import('./cryptoWallet');
      const merchantWallet = await cryptoWalletService.getMerchantWallet();
      return !!merchantWallet;
    } catch (error) {
      console.error('Error checking merchant authentication:', error);
      return false;
    }
  }

  /**
   * Store merchant credentials securely
   */
  async storeMerchantCredentials(
    privateKey: string, 
    walletData: MerchantWalletData
  ): Promise<void> {
    try {
      await SecureStore.setItemAsync(MERCHANT_PRIVATE_KEY, privateKey);
      await SecureStore.setItemAsync(MERCHANT_STORAGE_KEY, JSON.stringify(walletData));
      
      this.merchantCredentials = {
        privateKey,
        walletData
      };
      
      console.log('✅ Merchant credentials stored securely');
    } catch (error) {
      console.error('Error storing merchant credentials:', error);
      throw new Error('Failed to store merchant credentials');
    }
  }

  /**
   * Get merchant credentials (with biometric auth if enabled)
   */
  async getMerchantCredentials(): Promise<MerchantCredentials | null> {
    try {
      if (this.merchantCredentials) {
        return this.merchantCredentials;
      }

      // Get merchant wallet from the new cryptoWalletService storage
      const { cryptoWalletService } = await import('./cryptoWallet');
      const merchantWallet = await cryptoWalletService.getMerchantWallet();

      if (!merchantWallet || !merchantWallet.merchantData.merchantId) {
        return null;
      }

      // Ensure all required fields are present
      const walletData: MerchantWalletData = {
        merchantId: merchantWallet.merchantData.merchantId,
        name: merchantWallet.merchantData.name || '',
        email: merchantWallet.merchantData.email || '',
        hederaAccountId: merchantWallet.merchantData.hederaAccountId || '',
        hederaPublicKey: merchantWallet.merchantData.hederaPublicKey || '',
        nftCollectionId: merchantWallet.merchantData.nftCollectionId,
        businessType: merchantWallet.merchantData.businessType || '',
        onboardingStatus: merchantWallet.merchantData.onboardingStatus || 'pending',
        createdAt: merchantWallet.merchantData.createdAt || new Date().toISOString()
      };

      this.merchantCredentials = {
        privateKey: merchantWallet.privateKey,
        walletData
      };

      return this.merchantCredentials;
    } catch (error) {
      console.error('Error getting merchant credentials:', error);
      return null;
    }
  }

  /**
   * Get merchant wallet data only (no private key)
   */
  async getMerchantWalletData(): Promise<MerchantWalletData | null> {
    try {
      const walletDataStr = await SecureStore.getItemAsync(MERCHANT_STORAGE_KEY);
      if (!walletDataStr) return null;
      
      return JSON.parse(walletDataStr) as MerchantWalletData;
    } catch (error) {
      console.error('Error getting merchant wallet data:', error);
      return null;
    }
  }

  /**
   * Create a pre-signed transaction for coupon minting
   * This creates the transaction structure that will be sent to backend
   */
  async createCouponMintRequest(couponData: CouponMintData): Promise<{
    success: boolean;
    signedRequest?: any;
    error?: string;
  }> {
    try {
      const credentials = await this.getMerchantCredentials();
      if (!credentials) {
        throw new Error('Merchant not authenticated');
      }

              // Collection will be created automatically on first coupon mint
        if (!credentials.walletData.nftCollectionId) {
          console.log('📝 Collection will be created on first coupon mint');
        }

      // Create the mint request that will be sent to backend
              const mintRequest = {
          merchantId: credentials.walletData.merchantId,
          collectionId: credentials.walletData.nftCollectionId || 'CREATE_NEW', // Signal to create new collection
          merchantAccountId: credentials.walletData.hederaAccountId,
        couponData: {
          name: couponData.name,
          description: couponData.description,
          merchant: credentials.walletData.name,
          value: couponData.value,
          category: couponData.category,
          validUntil: couponData.validUntil,
          imageUrl: couponData.imageUrl
        },
        timestamp: new Date().toISOString(),
        // In a real implementation, we would create and sign the actual Hedera transaction here
        // For now, we'll send the request data and let the backend handle transaction creation
      };

      // Create a signature of the request data
      const requestString = JSON.stringify(mintRequest);
      console.log('🔍 Mobile signing request string:', requestString);
      const requestBytes = new TextEncoder().encode(requestString);
      
      // Convert private key from hex to bytes
      const privateKeyBytes = new Uint8Array(
        credentials.privateKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      // Sign the request
      const signature = ed25519.sign(requestBytes, privateKeyBytes);
      const signatureHex = Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');

      const signedRequest = {
        ...mintRequest,
        signature: signatureHex,
        publicKey: credentials.walletData.hederaPublicKey
      };

      console.log('✅ Created signed coupon mint request');
      
      return {
        success: true,
        signedRequest
      };
    } catch (error) {
      console.error('Error creating signed mint request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear merchant credentials (logout)
   */
  async clearCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(MERCHANT_STORAGE_KEY);
      await SecureStore.deleteItemAsync(MERCHANT_PRIVATE_KEY);
      this.merchantCredentials = null;
      console.log('✅ Merchant credentials cleared');
    } catch (error) {
      console.error('Error clearing merchant credentials:', error);
      throw new Error('Failed to clear merchant credentials');
    }
  }

  /**
   * Update merchant wallet data (e.g., after collection creation)
   */
  async updateMerchantWalletData(updates: Partial<MerchantWalletData>): Promise<void> {
    try {
      const currentData = await this.getMerchantWalletData();
      if (!currentData) {
        throw new Error('No merchant wallet data found');
      }

      const updatedData = { ...currentData, ...updates };
      await SecureStore.setItemAsync(MERCHANT_STORAGE_KEY, JSON.stringify(updatedData));
      
      if (this.merchantCredentials) {
        this.merchantCredentials.walletData = updatedData;
      }
      
      console.log('✅ Merchant wallet data updated');
    } catch (error) {
      console.error('Error updating merchant wallet data:', error);
      throw new Error('Failed to update merchant wallet data');
    }
  }
}

export const merchantWalletService = MerchantWalletService.getInstance(); 