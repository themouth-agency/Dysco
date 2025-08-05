import { cryptoWalletService, UserWalletData } from './cryptoWallet';

export interface UserCredentials {
  privateKey: string;
  walletData: UserWalletData;
}

export interface UserSignRequest {
  success: boolean;
  signedData?: string;
  error?: string;
}

const USER_STORAGE_KEY = 'user_wallet_data';

export class UserWalletService {
  private static instance: UserWalletService;
  private userCredentials: UserCredentials | null = null;

  private constructor() {}

  static getInstance(): UserWalletService {
    if (!UserWalletService.instance) {
      UserWalletService.instance = new UserWalletService();
    }
    return UserWalletService.instance;
  }

  /**
   * Check if user is authenticated (has wallet)
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const userWallet = await cryptoWalletService.getUserWallet();
      console.log('🔍 isAuthenticated check:', {
        hasWallet: !!userWallet,
        hasAccountId: !!userWallet?.userData?.hederaAccountId,
        accountId: userWallet?.userData?.hederaAccountId
      });
      return !!userWallet && !!userWallet.userData.hederaAccountId;
    } catch (error) {
      console.error('Error checking user authentication:', error);
      return false;
    }
  }

  /**
   * Get user credentials (with biometric auth if enabled)
   */
  async getUserCredentials(): Promise<UserCredentials | null> {
    try {
      if (this.userCredentials) {
        return this.userCredentials;
      }

      const userWallet = await cryptoWalletService.getUserWallet();

      if (!userWallet || !userWallet.userData.hederaAccountId) {
        return null;
      }

      this.userCredentials = {
        privateKey: userWallet.privateKey,
        walletData: userWallet.userData
      };

      return this.userCredentials;
    } catch (error) {
      console.error('Error getting user credentials:', error);
      return null;
    }
  }

  /**
   * Store user credentials securely
   */
  async storeUserCredentials(
    mnemonic: string,
    privateKey: string,
    publicKey: string,
    userData: UserWalletData
  ): Promise<void> {
    try {
      await cryptoWalletService.storeUserWallet({
        mnemonic,
        privateKey,
        publicKey,
        userData
      });

      // Cache credentials
      this.userCredentials = {
        privateKey,
        walletData: userData
      };

      console.log('✅ User credentials stored securely');
    } catch (error) {
      console.error('Error storing user credentials:', error);
      throw new Error('Failed to store user credentials');
    }
  }

  /**
   * Generate a new user wallet
   */
  async generateUserWallet(): Promise<{
    mnemonic: string;
    privateKey: string;
    publicKey: string;
  }> {
    try {
      const walletData = await cryptoWalletService.generateUserWallet();
      console.log('✅ Generated new user wallet');
      return walletData;
    } catch (error) {
      console.error('Error generating user wallet:', error);
      throw new Error('Failed to generate user wallet');
    }
  }

  /**
   * Clear user wallet (logout)
   */
  async clearUserWallet(): Promise<void> {
    try {
      await cryptoWalletService.clearUserWallet();
      this.userCredentials = null;
      console.log('✅ User wallet cleared');
    } catch (error) {
      console.error('Error clearing user wallet:', error);
      throw new Error('Failed to clear user wallet');
    }
  }

  /**
   * Debug: Get all wallet storage keys for troubleshooting
   */
  async debugWalletStorage(): Promise<void> {
    try {
      const userWallet = await cryptoWalletService.getUserWallet();
      console.log('🐛 Debug wallet storage:', {
        userWallet: userWallet ? 'EXISTS' : 'NULL',
        userData: userWallet?.userData || 'MISSING',
        hederaAccountId: userWallet?.userData?.hederaAccountId || 'MISSING'
      });
    } catch (error) {
      console.error('🐛 Debug wallet storage error:', error);
    }
  }

  /**
   * Recover wallet from mnemonic phrase
   */
  async recoverFromMnemonic(mnemonic: string): Promise<{
    privateKey: string;
    publicKey: string;
  } | null> {
    try {
      const recovered = await cryptoWalletService.recoverUserWallet(mnemonic);
      if (recovered) {
        console.log('✅ User wallet recovered from mnemonic');
      }
      return recovered;
    } catch (error) {
      console.error('Error recovering user wallet:', error);
      return null;
    }
  }

  /**
   * Get mnemonic phrase for backup (requires authentication)
   */
  async getMnemonicPhrase(): Promise<string | null> {
    try {
      const userWallet = await cryptoWalletService.getUserWallet();
      return userWallet?.mnemonic || null;
    } catch (error) {
      console.error('Error getting mnemonic phrase:', error);
      return null;
    }
  }

  /**
   * Sign data with user's private key
   */
  async signData(data: string): Promise<UserSignRequest> {
    try {
      const credentials = await this.getUserCredentials();
      if (!credentials) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const { ed25519 } = await import('@noble/curves/ed25519');
      
      // Convert data to bytes
      const dataBytes = new TextEncoder().encode(data);
      
      // Convert private key from hex to bytes
      const privateKeyBytes = new Uint8Array(
        credentials.privateKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      // Sign the data
      const signature = ed25519.sign(dataBytes, privateKeyBytes);
      const signatureHex = Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');

      return {
        success: true,
        signedData: signatureHex
      };
    } catch (error) {
      console.error('Error signing data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign data'
      };
    }
  }

  /**
   * Test mnemonic knowledge (for backup verification)
   */
  getTestWords(mnemonic: string): { positions: number[]; words: string[] } {
    return cryptoWalletService.getTestWords(mnemonic);
  }
}

// Export singleton instance
export const userWalletService = UserWalletService.getInstance(); 