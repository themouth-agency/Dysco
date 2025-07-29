import 'react-native-get-random-values';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { ed25519 } from '@noble/curves/ed25519';
import { randomBytes } from '@noble/hashes/utils';
import { createHederaAccount, getAccountBalance } from './api';

export interface WalletData {
  accountId: string;
  privateKey: string;
  publicKey: string;
  balance: number;
  createdAt: string;
}

export interface WalletBackupData {
  accountId: string;
  privateKey: string;
  publicKey: string;
}

const WALLET_STORAGE_KEY = 'dysco_wallet';
const BIOMETRIC_ENABLED_KEY = 'dysco_biometric_enabled';

export class WalletService {
  private static instance: WalletService;
  private walletData: WalletData | null = null;

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Generate a new Hedera wallet
   */
  async generateWallet(): Promise<WalletData> {
    try {
      // Generate a new private key using ed25519
      const privateKeyBytes = randomBytes(32);
      const publicKeyBytes = ed25519.getPublicKey(privateKeyBytes);
      
      // Convert to hex strings for storage
      const privateKeyHex = Array.from(privateKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      const publicKeyHex = Array.from(publicKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('');
      
      // Create real Hedera account using the public key
      const accountResult = await createHederaAccount(publicKeyHex);
      
      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to create Hedera account');
      }
      
      const walletData: WalletData = {
        accountId: accountResult.accountId!,
        privateKey: privateKeyHex,
        publicKey: publicKeyHex,
        balance: 1, // Initial balance from account creation
        createdAt: new Date().toISOString(),
      };

      // Store wallet securely
      await this.storeWallet(walletData);
      this.walletData = walletData;

      return walletData;
    } catch (error) {
      console.error('Error generating wallet:', error);
      throw new Error('Failed to generate wallet');
    }
  }

  /**
   * Get the current wallet data
   */
  async getWallet(): Promise<WalletData | null> {
    if (this.walletData) {
      return this.walletData;
    }

    try {
      const storedWallet = await SecureStore.getItemAsync(WALLET_STORAGE_KEY);
      if (storedWallet) {
        this.walletData = JSON.parse(storedWallet);
        return this.walletData;
      }
      return null;
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  /**
   * Store wallet data securely
   */
  private async storeWallet(walletData: WalletData): Promise<void> {
    try {
      await SecureStore.setItemAsync(WALLET_STORAGE_KEY, JSON.stringify(walletData));
    } catch (error) {
      console.error('Error storing wallet:', error);
      throw new Error('Failed to store wallet');
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Authenticate using biometrics
   */
  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your wallet',
        fallbackLabel: 'Use passcode',
      });
      return result.success;
    } catch (error) {
      console.error('Error with biometric authentication:', error);
      return false;
    }
  }

  /**
   * Enable/disable biometric authentication
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.error('Error setting biometric enabled:', error);
      throw new Error('Failed to set biometric preference');
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled:', error);
      return false;
    }
  }

  /**
   * Get wallet backup data for QR code generation
   */
  async getWalletBackupData(): Promise<WalletBackupData | null> {
    try {
      const wallet = await this.getWallet();
      if (!wallet) return null;

      return {
        accountId: wallet.accountId,
        privateKey: wallet.privateKey,
        publicKey: wallet.publicKey,
      };
    } catch (error) {
      console.error('Error getting wallet backup data:', error);
      return null;
    }
  }

  /**
   * Import wallet from backup data
   */
  async importWallet(backupData: WalletBackupData): Promise<WalletData> {
    try {
      const walletData: WalletData = {
        accountId: backupData.accountId,
        privateKey: backupData.privateKey,
        publicKey: backupData.publicKey,
        balance: 0,
        createdAt: new Date().toISOString(),
      };

      await this.storeWallet(walletData);
      this.walletData = walletData;

      return walletData;
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw new Error('Failed to import wallet');
    }
  }

  /**
   * Delete wallet data
   */
  async deleteWallet(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(WALLET_STORAGE_KEY);
      this.walletData = null;
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw new Error('Failed to delete wallet');
    }
  }

  /**
   * Update wallet balance from Hedera
   */
  async updateBalance(): Promise<number> {
    try {
      const wallet = await this.getWallet();
      if (!wallet) {
        console.log('No wallet found, returning balance 0');
        return 0;
      }

      if (!wallet.accountId) {
        console.error('Wallet found but accountId is missing:', wallet);
        return 0;
      }

      // Query real balance from Hedera
      console.log('Fetching balance for account:', wallet.accountId);
      const balanceResult = await getAccountBalance(wallet.accountId);
      
      if (!balanceResult.success) {
        throw new Error(balanceResult.error || 'Failed to get balance');
      }

      const balanceInHbar = parseFloat(balanceResult.balance);
      
      if (this.walletData) {
        this.walletData.balance = balanceInHbar;
        await this.storeWallet(this.walletData);
      }

      return balanceInHbar;
    } catch (error) {
      console.error('Error updating balance:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance(); 