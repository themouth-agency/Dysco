import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantNavigator';
import { supabaseAuthService } from '../../services/supabaseAuth';
import { API_BASE_URL } from '../../config/api';

type CampaignDashboardScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'CampaignDashboard'>;

interface Props {
  navigation: CampaignDashboardScreenNavigationProp;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaign_type: 'qr_redeem' | 'discount_code';
  discount_type: 'percentage' | 'fixed_amount' | 'free_item';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  // Stats (will be fetched separately)
  totalMinted?: number;
  activeCoupons?: number;
  totalRedeemed?: number;
}

export default function CampaignDashboardScreen({ navigation }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const user = await supabaseAuthService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in first');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/merchants/${user.id}/campaigns`);
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch campaigns');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      Alert.alert('Error', 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaigns();
  };

  const isExpired = (endDate: string): boolean => {
    return new Date(endDate) < new Date();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDiscount = (type: string, value: number): string => {
    switch (type) {
      case 'percentage':
        return `${value}% off`;
      case 'fixed_amount':
        return `$${value} off`;
      case 'free_item':
        return 'Free item';
      default:
        return `${value} off`;
    }
  };

  const getStatusColor = (campaign: Campaign): string => {
    if (!campaign.is_active) return '#999';
    if (isExpired(campaign.end_date)) return '#ff6b6b';
    return '#51cf66';
  };

  const getStatusText = (campaign: Campaign): string => {
    if (!campaign.is_active) return 'Inactive';
    if (isExpired(campaign.end_date)) return 'Expired';
    return 'Active';
  };

  const handleCreateCampaign = () => {
    navigation.navigate('CreateCampaign' as any);
  };

  const handleCampaignPress = (campaign: Campaign) => {
    navigation.navigate('CampaignDetails' as any, { campaignId: campaign.id });
  };

  const renderCampaignCard = ({ item: campaign }: { item: Campaign }) => (
    <TouchableOpacity
      style={styles.campaignCard}
      onPress={() => handleCampaignPress(campaign)}
    >
      <View style={styles.campaignHeader}>
        <Text style={styles.campaignName}>{campaign.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign) }]}>
          <Text style={styles.statusText}>{getStatusText(campaign)}</Text>
        </View>
      </View>

      {campaign.description && (
        <Text style={styles.campaignDescription} numberOfLines={2}>
          {campaign.description}
        </Text>
      )}

      <View style={styles.campaignDetails}>
        <Text style={styles.discountText}>
          {formatDiscount(campaign.discount_type, campaign.discount_value)}
        </Text>
        <Text style={styles.typeText}>
          {campaign.campaign_type === 'qr_redeem' ? 'QR Redeem' : 'Discount Code'}
        </Text>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
        </Text>
      </View>

      {(campaign.totalMinted !== undefined) && (
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Minted: {campaign.totalMinted}</Text>
          <Text style={styles.statText}>Active: {campaign.activeCoupons}</Text>
          <Text style={styles.statText}>Redeemed: {campaign.totalRedeemed}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Campaigns Yet</Text>
      <Text style={styles.emptyText}>
        Create your first campaign to start distributing digital coupons
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateCampaign}>
        <Text style={styles.createButtonText}>Create First Campaign</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Campaign Dashboard</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateCampaign}>
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={campaigns}
        renderItem={renderCampaignCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={campaigns.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  campaignDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  campaignDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  dateRow: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});