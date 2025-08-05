import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { userWalletService, UserCredentials } from '../services/userWallet';
import { cryptoWalletService } from '../services/cryptoWallet';

type WalletScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Wallet'>;

interface Props {
  navigation: WalletScreenNavigationProp;
}

export default function WalletScreen({ navigation }: Props) {
  const [userCredentials, setUserCredentials] = useState<UserCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoveryMnemonic, setRecoveryMnemonic] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    loadUserWallet();
  }, []);

  const loadUserWallet = async () => {
    try {
      setLoading(true);
      
      // Get user wallet credentials
      const credentials = await userWalletService.getUserCredentials();
      setUserCredentials(credentials);
    } catch (error) {
      console.error('Error loading user wallet:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      console.log('🔐 Generating new user wallet with mnemonic...');
      
      // Generate new wallet with mnemonic
      const { mnemonic, privateKey, publicKey } = await userWalletService.generateUserWallet();
      
      console.log('✅ User wallet generated, navigating to backup screen');
      
      // Navigate to mnemonic backup screen
      navigation.navigate('MnemonicBackup', {
        mnemonic,
        privateKey,
        publicKey,
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverWallet = async () => {
    if (!recoveryMnemonic.trim()) {
      Alert.alert('Error', 'Please enter your recovery phrase');
      return;
    }

    setIsRecovering(true);
    try {
      // Validate mnemonic
      const isValid = cryptoWalletService.validateMnemonic(recoveryMnemonic.trim());
      if (!isValid) {
        Alert.alert('Invalid Recovery Phrase', 'Please check your recovery phrase and try again.');
        return;
      }

      console.log('🔐 Recovering wallet from mnemonic...');
      
      // Recover wallet keys from mnemonic
      const walletData = await cryptoWalletService.recoverUserWallet(recoveryMnemonic.trim());
      if (!walletData) {
        throw new Error('Failed to recover wallet from mnemonic');
      }

      // Create Hedera account on backend
      const response = await fetch('http://192.168.0.49:3001/api/users/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: walletData.publicKey,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Hedera account');
      }

      console.log('✅ Hedera account created:', data.accountId);

      // Store recovered wallet
      await userWalletService.storeUserCredentials(
        recoveryMnemonic.trim(),
        walletData.privateKey,
        walletData.publicKey,
        {
          hederaAccountId: data.accountId,
          balance: 1, // Initial balance
          createdAt: new Date().toISOString(),
        }
      );

      setShowRecoverModal(false);
      setRecoveryMnemonic('');
      await loadUserWallet();

      Alert.alert(
        'Wallet Recovered! 🎉',
        `Your wallet has been successfully recovered!\n\nAccount ID: ${data.accountId}`
      );
    } catch (error) {
      console.error('Error recovering wallet:', error);
      Alert.alert('Recovery Failed', 'Failed to recover wallet. Please check your recovery phrase and try again.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      setRefreshing(true);
      await loadUserWallet(); // Reload wallet data
    } catch (error) {
      console.error('Error refreshing wallet:', error);
      Alert.alert('Error', 'Failed to refresh wallet data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? Make sure you have your recovery phrase saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await userWalletService.clearUserWallet();
              setUserCredentials(null);
              Alert.alert('Logged Out', 'You have been logged out successfully');
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!userCredentials ? (
        <View style={styles.noWalletContainer}>
          <Text style={styles.noWalletTitle}>🔐 Welcome to Dysco</Text>
          <Text style={styles.noWalletSubtitle}>
            Create a secure Hedera wallet with recovery phrase to start collecting digital coupons
          </Text>
          
          <TouchableOpacity style={styles.createButton} onPress={handleCreateWallet}>
            <Text style={styles.createButtonText}>Create New Wallet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.recoverButton} onPress={() => setShowRecoverModal(true)}>
            <Text style={styles.recoverButtonText}>Recover Existing Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.walletContainer}>
          {/* Wallet Header */}
          <View style={styles.walletHeader}>
            <Text style={styles.walletTitle}>Your Wallet</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshBalance}>
              <Text style={styles.refreshButtonText}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Info */}
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>Account ID</Text>
            <Text style={styles.accountValue}>{userCredentials?.walletData?.hederaAccountId || 'Loading...'}</Text>
            
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>{userCredentials?.walletData?.balance || 0} HBAR</Text>
            
            <Text style={styles.createdLabel}>Created</Text>
            <Text style={styles.createdValue}>
              {userCredentials?.walletData?.createdAt ? new Date(userCredentials.walletData.createdAt).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>

          {/* Security Info */}
          <View style={styles.securityCard}>
            <Text style={styles.securityTitle}>🔒 Security</Text>
            <Text style={styles.securityText}>
              Your wallet is secured with a 12-word recovery phrase. Make sure you have it stored safely.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsCard}>
            <TouchableOpacity 
              style={styles.historyButton} 
              onPress={() => navigation.navigate('UserRedemptionHistory')}
            >
              <Text style={styles.historyButtonText}>📊 View Redemption History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recovery Modal */}
      <Modal visible={showRecoverModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recover Wallet</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowRecoverModal(false);
                setRecoveryMnemonic('');
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Enter your 12-word recovery phrase to restore your wallet
            </Text>
            
            <TextInput
              style={styles.mnemonicInput}
              placeholder="Enter your 12-word recovery phrase..."
              value={recoveryMnemonic}
              onChangeText={setRecoveryMnemonic}
              multiline
              numberOfLines={4}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.recoverSubmitButton, isRecovering && styles.buttonDisabled]}
              onPress={handleRecoverWallet}
              disabled={isRecovering}
            >
              {isRecovering ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.recoverSubmitButtonText}>Recover Wallet</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noWalletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  noWalletSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletContainer: {
    padding: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  refreshButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 16,
  },
  createdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  createdValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  toggleButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  testButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
  recoverButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  recoverButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  historyButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  historyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 24,
  },
  mnemonicInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 20,
  },
  recoverSubmitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recoverSubmitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
}); 