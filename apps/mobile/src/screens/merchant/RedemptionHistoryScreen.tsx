import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantAuthNavigator';
import { merchantService } from '../../services/merchantService';
import { getMerchantRedemptionHistory } from '../../services/api';

type RedemptionHistoryScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'RedemptionHistory'>;

interface Props {
  navigation: RedemptionHistoryScreenNavigationProp;
}

interface RedemptionRecord {
  id: string;
  nft_id: string;
  user_account_id: string;
  redemption_transaction_id: string;
  scanned_at: string;
  redeemed_at: string;
  redemption_method: string;
  nft_coupons?: {
    campaign_id: string;
    campaigns: {
      name: string;
      description: string;
      discount_type: string;
      discount_value: number;
    };
  };
}

export default function RedemptionHistoryScreen({ navigation }: Props) {
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRedemptionHistory();
  }, []);

  const loadRedemptionHistory = async () => {
    try {
      setLoading(true);
      
      // Check if merchant is authenticated
      const isAuthenticated = await merchantService.isAuthenticated();
      if (!isAuthenticated) {
        Alert.alert('Error', 'Merchant not authenticated');
        return;
      }

      // Get merchant profile
      const profile = await merchantService.getMerchantProfile();
      if (!profile || !profile.id) {
        Alert.alert('Error', 'Merchant account not found');
        return;
      }

      console.log(`📊 Loading redemption history for merchant: ${profile.id}`);
      
      // Fetch redemption history using the new API method
      const data = await getMerchantRedemptionHistory(profile.id);
      
      if (data.success) {
        console.log(`✅ Loaded ${data.count} redemption records`);
        setRedemptions(data.redemptions || []);
      } else {
        console.error('Failed to load redemption history:', data.error);
        Alert.alert('Error', data.error || 'Failed to load redemption history');
      }
    } catch (error) {
      console.error('Error loading redemption history:', error);
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

  const renderRedemption = ({ item }: { item: RedemptionRecord }) => {
    const campaign = item.nft_coupons?.campaigns;
    
    return (
      <View style={styles.redemptionCard}>
        <View style={styles.redemptionHeader}>
          <Text style={styles.campaignName}>
            {campaign?.name || 'Unknown Campaign'}
          </Text>
          <Text style={styles.method}>{item.redemption_method.toUpperCase()}</Text>
        </View>
        
        {campaign && (
          <Text style={styles.discountInfo}>
            {campaign.discount_value}{campaign.discount_type === 'percentage' ? '%' : ''} off
          </Text>
        )}
        
        <Text style={styles.nftId}>NFT: {item.nft_id}</Text>
        <Text style={styles.userAccount}>User: {item.user_account_id}</Text>
        <Text style={styles.transactionId}>
          Transaction: {item.redemption_transaction_id}
        </Text>
        
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>
            Scanned: {new Date(item.scanned_at).toLocaleDateString()} at {new Date(item.scanned_at).toLocaleTimeString()}
          </Text>
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
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading redemption history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#08090A', '#1E261F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Redemption History</Text>
            <Text style={styles.subtitle}>
              {redemptions.length > 0 
                ? `${redemptions.length} redemption${redemptions.length > 1 ? 's' : ''}` 
                : 'No redemptions yet'
              }
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={redemptions}
        renderItem={renderRedemption}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No redemptions found</Text>
            <Text style={styles.emptySubtext}>
              Redeemed coupons will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 140,
    paddingTop: 0,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 65,
    left: 20,
    padding: 15,
    zIndex: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#d1fae5',
    textAlign: 'center',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
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
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  userAccount: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  transactionId: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  timestampContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});