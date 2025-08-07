import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TextInput,
  Modal,
  Share,
  Clipboard,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MerchantStackParamList } from '../../navigation/MerchantNavigator';
import { getCampaignShareLink } from '../../services/api';
import { API_BASE_URL } from '../../config/api';

type CampaignDetailsScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'CampaignDetails'>;
type CampaignDetailsScreenRouteProp = RouteProp<MerchantStackParamList, 'CampaignDetails'>;

interface Props {
  navigation: CampaignDetailsScreenNavigationProp;
  route: CampaignDetailsScreenRouteProp;
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
  image_url?: string;
  max_redemptions_per_user: number;
  total_limit?: number;
  is_active: boolean;
  created_at: string;
}

interface Coupon {
  nft_id: string;
  token_id: string;
  serial_number: number;
  redemption_status: 'active' | 'redeemed' | 'expired' | 'burned';
  discount_code?: string;
  created_at: string;
  redeemed_at?: string;
}

export default function CampaignDetailsScreen({ navigation, route }: Props) {
  const { campaignId } = route.params;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mintModalVisible, setMintModalVisible] = useState(false);
  const [mintQuantity, setMintQuantity] = useState('1');
  const [minting, setMinting] = useState(false);
  const [burning, setBurning] = useState(false);

  useEffect(() => {
    fetchCampaignData();
  }, []);

  const fetchCampaignData = async () => {
    try {
      // Fetch campaign details
      const campaignResponse = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`);
      const campaignData = await campaignResponse.json();

      if (campaignData.success) {
        setCampaign(campaignData.campaign);
      } else {
        Alert.alert('Error', campaignData.error || 'Failed to fetch campaign');
        navigation.goBack();
        return;
      }

      // Fetch campaign coupons
      const couponsResponse = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/coupons`);
      const couponsData = await couponsResponse.json();

      if (couponsData.success) {
        setCoupons(couponsData.coupons);
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
      Alert.alert('Error', 'Failed to fetch campaign data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCampaignData();
  };

  const handleMintCoupons = async () => {
    const quantity = parseInt(mintQuantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > 100) {
      Alert.alert('Error', 'Please enter a valid quantity (1-100)');
      return;
    }

    setMinting(true);
    setMintModalVisible(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/coupons/mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success!',
          `Successfully minted ${data.mintedCoupons.length}/${quantity} coupons`,
          [{ text: 'OK', onPress: fetchCampaignData }]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to mint coupons');
      }
    } catch (error) {
      console.error('Error minting coupons:', error);
      Alert.alert('Error', 'Failed to mint coupons');
    } finally {
      setMinting(false);
    }
  };

  const handleBurnExpired = async () => {
    Alert.alert(
      'Burn Expired Coupons',
      'This will permanently burn all expired coupons in this campaign. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Burn Expired',
          style: 'destructive',
          onPress: async () => {
            setBurning(true);
            try {
              const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/burn-expired`, {
                method: 'POST',
              });

              const data = await response.json();

              if (data.success) {
                Alert.alert(
                  'Success!',
                  data.message,
                  [{ text: 'OK', onPress: fetchCampaignData }]
                );
              } else {
                Alert.alert('Error', data.error || 'Failed to burn expired coupons');
              }
            } catch (error) {
              console.error('Error burning expired coupons:', error);
              Alert.alert('Error', 'Failed to burn expired coupons');
            } finally {
              setBurning(false);
            }
          },
        },
      ]
    );
  };

  const handleShareCampaign = async () => {
    try {
      const linkData = await getCampaignShareLink(campaignId);
      
      const shareMessage = `🎫 Check out this coupon campaign: ${campaign?.name}\n\n${campaign?.description || 'Get amazing discounts!'}\n\nClaim your coupon here: ${linkData.shareLink}`;

      await Share.share({
        message: shareMessage,
        title: `Coupon Campaign: ${campaign?.name}`,
        url: linkData.shareLink, // iOS will use this
      });
    } catch (error) {
      console.error('Error sharing campaign:', error);
      
      // Fallback: copy to clipboard
      try {
        const linkData = await getCampaignShareLink(campaignId);
        await Clipboard.setString(linkData.shareLink);
        Alert.alert('Link Copied', 'Campaign link copied to clipboard!');
      } catch (clipboardError) {
        Alert.alert('Error', 'Failed to share campaign');
      }
    }
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#51cf66';
      case 'redeemed':
        return '#339af0';
      case 'expired':
        return '#ff6b6b';
      case 'burned':
        return '#999';
      default:
        return '#999';
    }
  };

  const getStats = () => {
    const total = coupons.length;
    const active = coupons.filter(c => c.redemption_status === 'active').length;
    const redeemed = coupons.filter(c => c.redemption_status === 'redeemed').length;
    const expired = coupons.filter(c => c.redemption_status === 'expired').length;
    const burned = coupons.filter(c => c.redemption_status === 'burned').length;

    return { total, active, redeemed, expired, burned };
  };

  const renderCouponItem = ({ item: coupon }: { item: Coupon }) => (
    <View style={styles.couponItem}>
      <View style={styles.couponHeader}>
        <Text style={styles.couponId}>{coupon.nft_id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(coupon.redemption_status) }]}>
          <Text style={styles.statusText}>
            {coupon.redemption_status.charAt(0).toUpperCase() + coupon.redemption_status.slice(1)}
          </Text>
        </View>
      </View>

      {coupon.discount_code && (
        <Text style={styles.discountCode}>Code: {coupon.discount_code}</Text>
      )}

      <Text style={styles.couponDate}>
        Created: {formatDate(coupon.created_at)}
      </Text>

      {coupon.redeemed_at && (
        <Text style={styles.redeemedDate}>
          Redeemed: {formatDate(coupon.redeemed_at)}
        </Text>
      )}
    </View>
  );

  if (loading || !campaign) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading campaign details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const stats = getStats();
  const campaignExpired = isExpired(campaign.end_date);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {campaign.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Campaign Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.campaignName}>{campaign.name}</Text>
            <View style={[
              styles.campaignStatusBadge,
              { backgroundColor: campaignExpired ? '#ff6b6b' : campaign.is_active ? '#51cf66' : '#999' }
            ]}>
              <Text style={styles.campaignStatusText}>
                {campaignExpired ? 'Expired' : campaign.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {campaign.description && (
            <Text style={styles.campaignDescription}>{campaign.description}</Text>
          )}

          <View style={styles.campaignDetails}>
            <Text style={styles.discountText}>
              {formatDiscount(campaign.discount_type, campaign.discount_value)}
            </Text>
            <Text style={styles.typeText}>
              {campaign.campaign_type === 'qr_redeem' ? 'QR Redeem' : 'Discount Code'}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
          </Text>

          <Text style={styles.limitText}>
            Max per user: {campaign.max_redemptions_per_user}
            {campaign.total_limit && ` • Total limit: ${campaign.total_limit}`}
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Campaign Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Minted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#51cf66' }]}>{stats.active}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#339af0' }]}>{stats.redeemed}</Text>
              <Text style={styles.statLabel}>Redeemed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#ff6b6b' }]}>{stats.expired}</Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Actions</Text>
          
          {/* Top row - Mint and Burn */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.mintButton]}
              onPress={() => setMintModalVisible(true)}
              disabled={minting}
            >
              <Text style={styles.actionButtonText}>
                {minting ? 'Minting...' : 'Mint Coupons'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.burnButton]}
              onPress={handleBurnExpired}
              disabled={burning || stats.expired === 0}
            >
              <Text style={styles.actionButtonText}>
                {burning ? 'Burning...' : `Burn Expired (${stats.expired})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom row - Share */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShareCampaign}
            >
              <Text style={styles.actionButtonText}>📱 Share Campaign</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Coupons List */}
        <View style={styles.couponsCard}>
          <Text style={styles.couponsTitle}>Minted Coupons ({coupons.length})</Text>
          {coupons.length === 0 ? (
            <View style={styles.emptyCoupons}>
              <Text style={styles.emptyCouponsText}>No coupons minted yet</Text>
              <TouchableOpacity
                style={styles.mintFirstButton}
                onPress={() => setMintModalVisible(true)}
              >
                <Text style={styles.mintFirstButtonText}>Mint First Coupon</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={coupons}
              renderItem={renderCouponItem}
              keyExtractor={(item) => item.nft_id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Mint Modal */}
      <Modal
        visible={mintModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMintModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mint Coupons</Text>
            <Text style={styles.modalSubtitle}>
              How many coupons would you like to mint for this campaign?
            </Text>

            <View style={styles.quantityInput}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <TextInput
                style={styles.quantityTextInput}
                value={mintQuantity}
                onChangeText={setMintQuantity}
                keyboardType="numeric"
                placeholder="1"
                selectTextOnFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setMintModalVisible(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={handleMintCoupons}
              >
                <Text style={styles.confirmModalButtonText}>Mint Coupons</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  campaignName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  campaignStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  campaignStatusText: {
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
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  limitText: {
    fontSize: 12,
    color: '#666',
  },
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  mintButton: {
    backgroundColor: '#007AFF',
  },
  burnButton: {
    backgroundColor: '#ff6b6b',
  },
  shareButton: {
    backgroundColor: '#00C851',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  couponsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  couponsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyCoupons: {
    alignItems: 'center',
    padding: 24,
  },
  emptyCouponsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  mintFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  mintFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  couponItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  couponId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  discountCode: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  couponDate: {
    fontSize: 12,
    color: '#666',
  },
  redeemedDate: {
    fontSize: 12,
    color: '#339af0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  quantityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 12,
  },
  quantityTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelModalButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmModalButton: {
    backgroundColor: '#007AFF',
  },
  cancelModalButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmModalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});