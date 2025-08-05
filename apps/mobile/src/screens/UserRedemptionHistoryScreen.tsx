import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { userWalletService } from '../services/userWallet';
import { getUserRedemptionHistory } from '../services/api';

type UserRedemptionHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserRedemptionHistory'>;

interface Props {
  navigation: UserRedemptionHistoryScreenNavigationProp;
}

interface UserRedemptionRecord {
  id: string;
  nft_id: string;
  user_account_id: string;
  redemption_transaction_id: string;
  scanned_at: string;
  redeemed_at: string;
  redemption_method: string;
  nft_coupons?: {
    campaign_id: string;
    merchant_account_id: string;
    campaigns: {
      name: string;
      description: string;
      discount_type: string;
      discount_value: number;
    };
    merchants: {
      name: string;
    };
  };
}

export default function UserRedemptionHistoryScreen({ navigation }: Props) {
  const [redemptions, setRedemptions] = useState<UserRedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRedemptionHistory();
  }, []);

  const loadRedemptionHistory = async () => {
    try {
      setLoading(true);
      
      // Get user credentials
      const userCredentials = await userWalletService.getUserCredentials();
      if (!userCredentials?.walletData?.hederaAccountId) {
        Alert.alert('Error', 'User wallet not found');
        return;
      }

      console.log(`📊 Loading redemption history for user: ${userCredentials.walletData.hederaAccountId}`);
      
      // Fetch redemption history using the new API method
      const data = await getUserRedemptionHistory(userCredentials.walletData.hederaAccountId);
      
      if (data.success) {
        console.log(`✅ Loaded ${data.count} user redemption records`);
        setRedemptions(data.redemptions || []);
      } else {
        console.error('Failed to load user redemption history:', data.error);
        Alert.alert('Error', data.error || 'Failed to load redemption history');
      }
    } catch (error) {
      console.error('Error loading user redemption history:', error);
      Alert.alert('Error', 'Failed to load redemption history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRedemptionHistory();
    setRefreshing(false);
  };

  const renderRedemption = ({ item }: { item: UserRedemptionRecord }) => {
    const campaign = item.nft_coupons?.campaigns;
    const merchant = item.nft_coupons?.merchants;
    
    return (
      <View style={styles.redemptionCard}>
        <View style={styles.redemptionHeader}>
          <View style={styles.leftHeader}>
            <Text style={styles.campaignName}>
              {campaign?.name || 'Unknown Campaign'}
            </Text>
            <Text style={styles.merchantName}>
              by {merchant?.name || 'Unknown Merchant'}
            </Text>
          </View>
          <Text style={styles.method}>{item.redemption_method.toUpperCase()}</Text>
        </View>
        
        {campaign && (
          <Text style={styles.discountInfo}>
            💰 {campaign.discount_value}{campaign.discount_type === 'percentage' ? '%' : ''} off
          </Text>
        )}
        
        <Text style={styles.nftId}>NFT: {item.nft_id}</Text>
        <Text style={styles.transactionId}>
          Transaction: {item.redemption_transaction_id}
        </Text>
        
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>
            Redeemed: {new Date(item.redeemed_at).toLocaleDateString()} at {new Date(item.redeemed_at).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your redemption history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Redemption History</Text>
        <Text style={styles.subtitle}>
          {redemptions.length} coupon{redemptions.length !== 1 ? 's' : ''} redeemed
        </Text>
      </View>
      
      <FlatList
        data={redemptions}
        renderItem={renderRedemption}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No redemptions yet</Text>
            <Text style={styles.emptySubtext}>
              Your redeemed coupons will appear here
            </Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('MyCoupons')}
            >
              <Text style={styles.backButtonText}>View My Coupons</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#dbeafe',
  },
  listContainer: {
    padding: 16,
  },
  redemptionCard: {
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
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftHeader: {
    flex: 1,
    marginRight: 12,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  merchantName: {
    fontSize: 14,
    color: '#6b7280',
  },
  discountInfo: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginBottom: 8,
  },
  nftId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  method: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  transactionId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  timestampContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});