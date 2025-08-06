import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Coupon } from '../types';
import { fetchAvailableCoupons } from '../services/api';
import { userWalletService } from '../services/userWallet';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Campaign {
  id: string;
  name: string;
  description: string;
  merchant: string;
  merchantId: string;
  discountType: string;
  discountValue: number;
  imageUrl?: string;
  expiresAt: string;
  availableCount: number;
  maxRedemptionsPerUser: number;
  status: string;
}

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);

  useEffect(() => {
    checkWalletAndLoadData();
  }, []);

  const checkWalletAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Debug wallet storage
      await userWalletService.debugWalletStorage();
      
      // Check if user has a wallet
      const isAuthenticated = await userWalletService.isAuthenticated();
      console.log('🏠 HomeScreen wallet check result:', isAuthenticated);
      setHasWallet(isAuthenticated);
      
      if (isAuthenticated) {
        // Only load campaigns if user has a wallet
        await loadCampaigns();
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await fetchAvailableCoupons();
      setCampaigns(data.campaigns);
    } catch (error) {
      Alert.alert('Error', 'Failed to load campaigns');
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  };

  const formatDiscount = (type: string, value: number): string => {
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

  const renderCampaign = ({ item }: { item: Campaign }) => (
    <TouchableOpacity
      style={styles.campaignCard}
      onPress={() => navigation.navigate('ClaimCoupon', { campaignId: item.id })}
    >
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignName}>{item.name}</Text>
        <Text style={styles.discountText}>{formatDiscount(item.discountType, item.discountValue)}</Text>
      </View>
      <Text style={styles.merchantText}>by {item.merchant}</Text>
      <Text style={styles.campaignDescription}>{item.description}</Text>
      <View style={styles.campaignFooter}>
        <Text style={styles.availableText}>{item.availableCount} available</Text>
        <Text style={styles.expiryText}>
          Expires: {new Date(item.expiresAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Show wallet creation prompt if user doesn't have a wallet
  if (hasWallet === false) {
    return (
      <View style={styles.container}>
        <View style={styles.walletPromptContainer}>
          <Text style={styles.walletPromptTitle}>Welcome to Dysco!</Text>
          <Text style={styles.walletPromptSubtitle}>
            Create your Hedera wallet to start collecting and trading digital coupons
          </Text>
          
          <TouchableOpacity
            style={styles.createWalletButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.createWalletButtonText}>Create Wallet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.recoverWalletButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.recoverWalletButtonText}>Recover Existing Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover Campaigns</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('MyCoupons')}
          >
            <Text style={styles.headerButtonText}>My Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.headerButtonText}>Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={campaigns}
        renderItem={renderCampaign}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading campaigns...' : 'No campaigns available'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  discountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  couponDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  // Campaign styles
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  merchantText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
    marginBottom: 8,
  },
  campaignDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  walletPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  walletPromptTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  walletPromptSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createWalletButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  createWalletButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  recoverWalletButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  recoverWalletButtonText: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 