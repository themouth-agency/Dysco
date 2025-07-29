import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { walletService, WalletData } from '../services/wallet';

export default function WalletScreen() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Check biometric availability
      const bioAvailable = await walletService.isBiometricAvailable();
      setBiometricAvailable(bioAvailable);
      
      if (bioAvailable) {
        const bioEnabled = await walletService.isBiometricEnabled();
        setBiometricEnabled(bioEnabled);
      }

      // Get wallet data
      const walletData = await walletService.getWallet();
      setWallet(walletData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoading(true);
      const newWallet = await walletService.generateWallet();
      setWallet(newWallet);
      Alert.alert('Success', 'Wallet created successfully!');
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      setRefreshing(true);
      const newBalance = await walletService.updateBalance();
      if (wallet) {
        setWallet({ ...wallet, balance: newBalance });
      }
    } catch (error) {
      console.error('Error refreshing balance:', error);
      Alert.alert('Error', 'Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleBiometric = async () => {
    try {
      const newEnabled = !biometricEnabled;
      await walletService.setBiometricEnabled(newEnabled);
      setBiometricEnabled(newEnabled);
      Alert.alert('Success', `Biometric authentication ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', 'Failed to update biometric settings');
    }
  };

  const handleTestBiometric = async () => {
    try {
      const success = await walletService.authenticateWithBiometrics();
      if (success) {
        Alert.alert('Success', 'Biometric authentication successful!');
      } else {
        Alert.alert('Failed', 'Biometric authentication failed');
      }
    } catch (error) {
      console.error('Error testing biometric:', error);
      Alert.alert('Error', 'Failed to test biometric authentication');
    }
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure you want to delete your wallet? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await walletService.deleteWallet();
              setWallet(null);
              Alert.alert('Success', 'Wallet deleted successfully');
            } catch (error) {
              console.error('Error deleting wallet:', error);
              Alert.alert('Error', 'Failed to delete wallet');
            }
          },
        },
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
      {!wallet ? (
        <View style={styles.noWalletContainer}>
          <Text style={styles.noWalletTitle}>No Wallet Found</Text>
          <Text style={styles.noWalletSubtitle}>
            Create a new Hedera wallet to start using Dysco
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateWallet}>
            <Text style={styles.createButtonText}>Create Wallet</Text>
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
            <Text style={styles.accountValue}>{wallet.accountId}</Text>
            
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={styles.balanceValue}>{wallet.balance} HBAR</Text>
            
            <Text style={styles.createdLabel}>Created</Text>
            <Text style={styles.createdValue}>
              {new Date(wallet.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Biometric Settings */}
          {biometricAvailable && (
            <View style={styles.settingsCard}>
              <Text style={styles.settingsTitle}>Security</Text>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Biometric Authentication</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, biometricEnabled && styles.toggleButtonActive]}
                  onPress={handleToggleBiometric}
                >
                  <Text style={styles.toggleButtonText}>
                    {biometricEnabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.testButton} onPress={handleTestBiometric}>
                <Text style={styles.testButtonText}>Test Biometric</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Actions</Text>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Export Wallet (QR)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Import Wallet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]} 
              onPress={handleDeleteWallet}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Delete Wallet
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
}); 