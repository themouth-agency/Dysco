import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Clipboard,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { userWalletService } from '../services/userWallet';
import { API_BASE_URL } from '../config/api';

const { width, height } = Dimensions.get('window');

interface DiscountCode {
  id: string;
  discount_code: string;
  redeemed_at: string;
  nft_id: string;
  campaigns?: {
    name: string;
    description: string;
    discount_type: string;
    discount_value: number;
  };
}

export default function DiscountCodesScreen() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDiscountCodes();
  }, []);

  const loadDiscountCodes = async () => {
    try {
      const userCredentials = await userWalletService.getUserCredentials();
      if (!userCredentials?.walletData?.hederaAccountId) {
        Alert.alert('No Wallet', 'Please create a wallet first to view discount codes');
        return;
      }

      const response = await fetch(`http://192.168.0.49:3001/api/users/${userCredentials.walletData.hederaAccountId}/discount-codes`);
      const data = await response.json();

      if (data.success) {
        setDiscountCodes(data.discountCodes);
        console.log(`📋 Loaded ${data.discountCodes.length} discount codes`);
      } else {
        console.error('Failed to load discount codes:', data.error);
      }
    } catch (error) {
      console.error('Error loading discount codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiscountCodes();
    setRefreshing(false);
  };

  const copyToClipboard = (code: string, campaignName: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied!', `Discount code for ${campaignName} copied to clipboard`);
  };

  const deleteDiscountCode = async (codeId: string, campaignName: string) => {
    Alert.alert(
      'Delete Discount Code',
      `Are you sure you want to delete the discount code for "${campaignName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userCredentials = await userWalletService.getUserCredentials();
              if (!userCredentials) {
                Alert.alert('Error', 'User not authenticated');
                return;
              }

              const response = await fetch(`${API_BASE_URL}/api/users/${userCredentials.walletData.hederaAccountId}/discount-codes/${codeId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              const data = await response.json();

              if (data.success) {
                Alert.alert('Deleted!', 'Discount code has been removed from your list');
                await loadDiscountCodes(); // Refresh the list
              } else {
                Alert.alert('Error', data.error || 'Failed to delete discount code');
              }
            } catch (error) {
              console.error('Error deleting discount code:', error);
              Alert.alert('Error', 'Failed to delete discount code');
            }
          }
        }
      ]
    );
  };

  const formatDiscountValue = (type: string, value: number) => {
    switch (type) {
      case 'percentage':
        return `${value}% OFF`;
      case 'fixed_amount':
        return `$${value} OFF`;
      case 'free_item':
        return 'FREE ITEM';
      default:
        return `${value} OFF`;
    }
  };

  const renderDiscountCode = ({ item }: { item: DiscountCode }) => {
    // Handle cases where campaign data might not be loaded
    const campaignName = item.campaigns?.name || 'Unknown Campaign';
    const discountType = item.campaigns?.discount_type || 'percentage';
    const discountValue = item.campaigns?.discount_value || 0;
    
    return (
      <View style={styles.codeCard}>
        <View style={styles.codeHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.campaignName}>{campaignName}</Text>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {formatDiscountValue(discountType, discountValue)}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteDiscountCode(item.id, campaignName)}
          >
            <Text style={styles.deleteButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Discount Code:</Text>
          <TouchableOpacity 
            style={styles.codeBox}
            onPress={() => copyToClipboard(item.discount_code, campaignName)}
          >
            <Text style={styles.codeText}>{item.discount_code}</Text>
            <Text style={styles.copyHint}>📋 Tap to copy</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.redeemedDate}>
          Redeemed: {new Date(item.redeemed_at).toLocaleDateString()} at {new Date(item.redeemed_at).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <SafeAreaView style={styles.content}>
          <Text style={styles.loadingText}>Loading discount codes...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <SafeAreaView style={styles.content}>
        {/* <View style={styles.header}>
          <Text style={styles.title}>💳 My Discount Codes</Text>
          <Text style={styles.subtitle}>
            Codes you've redeemed by burning NFTs
          </Text>
        </View> */}

        {discountCodes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔥</Text>
            <Text style={styles.emptyTitle}>No Discount Codes Yet</Text>
            <Text style={styles.emptySubtitle}>
              Burn discount code NFTs to reveal secret codes that will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={discountCodes}
            renderItem={renderDiscountCode}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
              />
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: height * 0.4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4757',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  discountBadge: {
    backgroundColor: '#00C851',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  codeContainer: {
    marginBottom: 12,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  copyHint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  redeemedDate: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
});