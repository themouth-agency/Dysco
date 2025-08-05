import 'react-native-get-random-values';
import { generateMnemonic, mnemonicToSeed, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { ed25519 } from '@noble/curves/ed25519';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export interface WalletData {
  mnemonic: string;
  privateKey: string;
  publicKey: string;
  address: string; // Hedera account ID when created
  createdAt: string;
}

export interface MerchantWalletData {
  merchantId?: string;
  name?: string;
  email?: string;
  hederaAccountId?: string;
  hederaPublicKey?: string;
  nftCollectionId?: string;
  businessType?: string;
  onboardingStatus?: string;
  createdAt?: string;
}

export interface UserWalletData {
  hederaAccountId?: string;
  hederaPublicKey?: string;
  balance?: number;
  createdAt?: string;
}

class CryptoWalletService {
  private readonly WALLET_KEY = 'crypto_wallet_data';
  private readonly MERCHANT_WALLET_KEY = 'merchant_wallet_data';
  private readonly USER_WALLET_KEY = 'user_wallet_data';

  /**
   * Generate a new 12-word mnemonic phrase
   */
  generateMnemonic(): string {
    return generateMnemonic(wordlist, 128); // 128 bits = 12 words
  }

  /**
   * Validate a mnemonic phrase
   */
  validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic, wordlist);
  }

  /**
   * Derive private key from mnemonic using BIP32/BIP44 path
   */
  private async deriveKeyFromMnemonic(mnemonic: string): Promise<{ privateKey: string; publicKey: string }> {
    try {
      // Convert mnemonic to seed
      const seed = await mnemonicToSeed(mnemonic);
      
      // Derive HD key using BIP44 path for Hedera (coin type 3030)
      // m/44'/3030'/0'/0/0
      const hdkey = HDKey.fromMasterSeed(seed);
      const derived = hdkey.derive("m/44'/3030'/0'/0/0");
      
      if (!derived.privateKey) {
        throw new Error('Failed to derive private key');
      }

      // Use the first 32 bytes for ed25519
      const privateKeyBytes = derived.privateKey.slice(0, 32);
      const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);

      return {
        privateKey: Array.from(privateKeyBytes, byte => byte.toString(16).padStart(2, '0')).join(''),
        publicKey: Array.from(publicKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('')
      };
    } catch (error) {
      console.error('Error deriving key from mnemonic:', error);
      throw new Error('Failed to derive keys from mnemonic');
    }
  }

  /**
   * Create a new wallet with mnemonic phrase
   */
  async createWallet(): Promise<{ wallet: WalletData; mnemonic: string }> {
    try {
      const mnemonic = this.generateMnemonic();
      const { privateKey, publicKey } = await this.deriveKeyFromMnemonic(mnemonic);

      const wallet: WalletData = {
        mnemonic,
        privateKey,
        publicKey,
        address: '', // Will be set when Hedera account is created
        createdAt: new Date().toISOString()
      };

      return { wallet, mnemonic };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Restore wallet from mnemonic phrase
   */
  async restoreWalletFromMnemonic(mnemonic: string): Promise<WalletData> {
    try {
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      const { privateKey, publicKey } = await this.deriveKeyFromMnemonic(mnemonic);

      const wallet: WalletData = {
        mnemonic,
        privateKey,
        publicKey,
        address: '', // Will be restored from backend if exists
        createdAt: new Date().toISOString()
      };

      return wallet;
    } catch (error) {
      console.error('Error restoring wallet from mnemonic:', error);
      throw new Error('Failed to restore wallet from mnemonic');
    }
  }

  /**
   * Store wallet securely (requires biometric auth)
   */
  async storeWallet(wallet: WalletData): Promise<void> {
    try {
      const isBiometricAvailable = await this.isBiometricAvailable();
      
      await SecureStore.setItemAsync(
        this.WALLET_KEY,
        JSON.stringify(wallet),
        isBiometricAvailable ? {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to secure your wallet'
        } : undefined
      );
      console.log(`✅ Wallet stored securely ${isBiometricAvailable ? 'with biometric protection' : 'in secure storage'}`);
    } catch (error) {
      console.error('Error storing wallet:', error);
      throw new Error('Failed to store wallet securely');
    }
  }

  /**
   * Store merchant wallet data
   */
  async storeMerchantWallet(privateKey: string, merchantData: MerchantWalletData): Promise<void> {
    try {
      const walletData = {
        privateKey,
        merchantData,
        storedAt: new Date().toISOString()
      };

      const isBiometricAvailable = await this.isBiometricAvailable();

      await SecureStore.setItemAsync(
        this.MERCHANT_WALLET_KEY,
        JSON.stringify(walletData),
        isBiometricAvailable ? {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to secure your merchant wallet'
        } : undefined
      );
      console.log(`✅ Merchant wallet stored securely ${isBiometricAvailable ? 'with biometric protection' : 'in secure storage'}`);
    } catch (error) {
      console.error('Error storing merchant wallet:', error);
      throw new Error('Failed to store merchant wallet securely');
    }
  }

  /**
   * Get wallet (requires biometric auth if available)
   */
  async getWallet(): Promise<WalletData | null> {
    try {
      const isBiometricAvailable = await this.isBiometricAvailable();
      
      const walletJson = await SecureStore.getItemAsync(
        this.WALLET_KEY, 
        isBiometricAvailable ? {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to access your wallet'
        } : undefined
      );

      if (!walletJson) {
        return null;
      }

      return JSON.parse(walletJson) as WalletData;
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  /**
   * Get merchant wallet credentials
   */
  async getMerchantWallet(): Promise<{ privateKey: string; merchantData: MerchantWalletData } | null> {
    try {
      const isBiometricAvailable = await this.isBiometricAvailable();
      
      const walletJson = await SecureStore.getItemAsync(
        this.MERCHANT_WALLET_KEY, 
        isBiometricAvailable ? {
          requireAuthentication: true,
          authenticationPrompt: 'Authenticate to access your merchant wallet'
        } : undefined
      );

      if (!walletJson) {
        return null;
      }

      return JSON.parse(walletJson);
    } catch (error) {
      console.error('Error getting merchant wallet:', error);
      return null;
    }
  }

  /**
   * Get mnemonic phrase for backup (requires biometric auth)
   */
  async getMnemonicPhrase(): Promise<string | null> {
    try {
      const wallet = await this.getWallet();
      return wallet?.mnemonic || null;
    } catch (error) {
      console.error('Error getting mnemonic phrase:', error);
      return null;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      // Temporarily disable biometric auth for development
      // TODO: Re-enable after adding proper iOS permissions
      return false;
      
      // const hasHardware = await LocalAuthentication.hasHardwareAsync();
      // const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      // return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Clear all wallet data (logout)
   */
  async clearWallet(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.WALLET_KEY);
      console.log('✅ Wallet data cleared');
    } catch (error) {
      console.error('Error clearing wallet:', error);
    }
  }

  /**
   * Clear merchant wallet data
   */
  async clearMerchantWallet(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.MERCHANT_WALLET_KEY);
      console.log('✅ Merchant wallet data cleared');
    } catch (error) {
      console.error('Error clearing merchant wallet:', error);
    }
  }

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    try {
      const walletJson = await SecureStore.getItemAsync(this.WALLET_KEY);
      return !!walletJson;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if merchant wallet exists
   */
  async hasMerchantWallet(): Promise<boolean> {
    try {
      const walletJson = await SecureStore.getItemAsync(this.MERCHANT_WALLET_KEY);
      return !!walletJson;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test mnemonic knowledge with random words
   */
  getTestWords(mnemonic: string): { positions: number[]; words: string[] } {
    const words = mnemonic.split(' ');
    
    // Randomly select 3 positions to test (0-indexed)
    const allPositions = Array.from({ length: words.length }, (_, i) => i);
    const shuffled = allPositions.sort(() => Math.random() - 0.5);
    const selectedPositions = shuffled.slice(0, 3).sort((a, b) => a - b);
    
    return {
      positions: selectedPositions, // Keep 0-indexed for array access
      words: selectedPositions.map(p => words[p])
    };
  }

  // ============================================================================
  // USER WALLET METHODS
  // ============================================================================

  /**
   * Generate a new user wallet with mnemonic phrase
   */
  async generateUserWallet(): Promise<{ mnemonic: string; privateKey: string; publicKey: string }> {
    const mnemonic = this.generateMnemonic();
    const { privateKey, publicKey } = await this.deriveKeyFromMnemonic(mnemonic);
    
    console.log('✅ Generated user wallet with mnemonic');
    return { mnemonic, privateKey, publicKey };
  }

  /**
   * Store user wallet securely with mnemonic phrase
   */
  async storeUserWallet(walletData: {
    mnemonic: string;
    privateKey: string;
    publicKey: string;
    userData: UserWalletData;
  }): Promise<void> {
    try {
      const userWallet = {
        mnemonic: walletData.mnemonic,
        privateKey: walletData.privateKey,
        publicKey: walletData.publicKey,
        userData: walletData.userData,
        createdAt: new Date().toISOString()
      };

      const walletJson = JSON.stringify(userWallet);
      
      // Store with biometric authentication if available
      const isBiometricAvailable = await this.isBiometricAvailable();
      await SecureStore.setItemAsync(this.USER_WALLET_KEY, walletJson, {
        requireAuthentication: isBiometricAvailable,
        authenticationPrompt: 'Authenticate to save your user wallet'
      });

      console.log('✅ User wallet stored securely');
    } catch (error) {
      console.error('Error storing user wallet:', error);
      throw new Error('Failed to store user wallet');
    }
  }

  /**
   * Get user wallet (with biometric auth if enabled)
   */
  async getUserWallet(): Promise<{
    mnemonic: string;
    privateKey: string;
    publicKey: string;
    userData: UserWalletData;
  } | null> {
    try {
      const isBiometricAvailable = await this.isBiometricAvailable();
      const walletJson = await SecureStore.getItemAsync(this.USER_WALLET_KEY, {
        requireAuthentication: isBiometricAvailable,
        authenticationPrompt: 'Authenticate to access your user wallet'
      });
      
      if (!walletJson) {
        return null;
      }
      
      const wallet = JSON.parse(walletJson);
      return wallet;
    } catch (error) {
      console.error('Error getting user wallet:', error);
      return null;
    }
  }

  /**
   * Clear user wallet from secure storage
   */
  async clearUserWallet(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.USER_WALLET_KEY);
      console.log('✅ User wallet cleared');
    } catch (error) {
      console.error('Error clearing user wallet:', error);
    }
  }

  /**
   * Check if user wallet exists
   */
  async hasUserWallet(): Promise<boolean> {
    try {
      const walletJson = await SecureStore.getItemAsync(this.USER_WALLET_KEY);
      return !!walletJson;
    } catch (error) {
      return false;
    }
  }

  /**
   * Recover user wallet from mnemonic phrase
   */
  async recoverUserWallet(mnemonic: string): Promise<{ privateKey: string; publicKey: string } | null> {
    try {
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      const { privateKey, publicKey } = await this.deriveKeyFromMnemonic(mnemonic);
      console.log('✅ User wallet recovered from mnemonic');
      
      return { privateKey, publicKey };
    } catch (error) {
      console.error('Error recovering user wallet:', error);
      return null;
    }
  }
}

export const cryptoWalletService = new CryptoWalletService(); 