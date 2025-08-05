import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Services
import * as api from '../services/api';
import { userWalletService } from '../services/userWallet';

interface Campaign {
  id: string;
  name: string;
  description: string;
  merchant: string;
  discountType: string;
  discountValue: number;
  availableCount: number;
  maxRedemptionsPerUser: number;
  expiresAt: string;
}

export default function DiscoverScreen() {
  const navigation = useNavigation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = async () => {
    try {
      const response = await api.fetchAvailableCoupons();
      setCampaigns(response.campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      Alert.alert('Error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const handleCampaignPress = async (campaign: Campaign) => {
    try {
      // Check if user has a wallet
      const userCredentials = await userWalletService.getUserCredentials();
      if (!userCredentials?.walletData?.hederaAccountId) {
        Alert.alert('Wallet Required', 'Please create a wallet first to claim coupons.');
        navigation.navigate('Wallet' as never);
        return;
      }

      // Navigate to claim screen
      navigation.navigate('ClaimCoupon' as never, { campaignId: campaign.id } as never);
    } catch (error) {
      console.error('Error checking wallet:', error);
      Alert.alert('Error', 'Failed to check wallet status');
    }
  };

  const formatDiscountInfo = (discountType: string, discountValue: number) => {
    if (discountType === 'percentage') {
      return `${discountValue}% OFF`;
    } else {
      return `$${discountValue} OFF`;
    }
  };

  const formatExpiryDate = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const renderCampaign = ({ item }: { item: Campaign }) => (
    <TouchableOpacity 
      style={styles.campaignCard}
      onPress={() => handleCampaignPress(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.campaignName}>{item.name}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {formatDiscountInfo(item.discountType, item.discountValue)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.merchantName}>{item.merchant}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.availabilityInfo}>
            <Text style={styles.availableText}>
              {item.availableCount} available
            </Text>
            <Text style={styles.expiryText}>
              Expires {formatExpiryDate(item.expiresAt)}
            </Text>
          </View>
          <View style={styles.claimButton}>
            <Text style={styles.claimButtonText}>Claim</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <SafeAreaView>
        <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Find amazing deals from local businesses</Text>
        </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Campaigns List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading campaigns...</Text>
          </View>
        ) : campaigns.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyCampaignsText}>🔍</Text>
            <Text style={styles.emptyCampaignsTitle}>No campaigns available</Text>
            <Text style={styles.emptyCampaignsSubtitle}>
              Check back later for new deals from local businesses
            </Text>
          </View>
        ) : (
          <FlatList
            data={campaigns}
            renderItem={renderCampaign}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: 140, // Add more space for floating tab bar and elevated Discover button
  },
  header: {
    paddingTop: 0, // Remove top padding so gradient goes to top
    paddingBottom: 30,
    paddingHorizontal: 0, // Remove horizontal padding, will add it inside SafeAreaView
  },
  headerContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityInfo: {
    flex: 1,
  },
  availableText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34A853',
    marginBottom: 2,
  },
  expiryText: {
    fontSize: 12,
    color: '#999999',
  },
  claimButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  emptyCampaignsText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyCampaignsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCampaignsSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});