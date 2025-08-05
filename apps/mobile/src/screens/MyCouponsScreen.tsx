import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { Coupon } from '../types';
import { getUserCoupons, generateRedemptionToken, burnCoupon, redeemDiscountCodeCoupon } from '../services/api';
import { userWalletService } from '../services/userWallet';
import { QRCodeModal } from '../components/QRCodeModal';

type MyCouponsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyCoupons'>;

interface Props {
  navigation: MyCouponsScreenNavigationProp;
}

interface GroupedCoupons {
  merchant: string;
  coupons: Coupon[];
  count: number;
}

export default function MyCouponsScreen({ navigation }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [groupedCoupons, setGroupedCoupons] = useState<GroupedCoupons[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // QR Code Modal state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [redemptionToken, setRedemptionToken] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    checkWalletAndLoadCoupons();
  }, []);

  const checkWalletAndLoadCoupons = async () => {
    try {
      setLoading(true);
      
      // Check if user has a wallet
      const userCredentials = await userWalletService.getUserCredentials();
      const isAuthenticated = !!userCredentials?.walletData?.hederaAccountId;
      setHasWallet(isAuthenticated);
      
      if (isAuthenticated && userCredentials?.walletData?.hederaAccountId) {
        // Load user's coupons
        await loadUserCoupons(userCredentials.walletData.hederaAccountId);
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  };

  const groupCouponsByMerchant = (coupons: Coupon[]): GroupedCoupons[] => {
    const groups: { [merchant: string]: Coupon[] } = {};
    
    coupons.forEach(coupon => {
      const merchant = coupon.merchant || 'Unknown Merchant';
      if (!groups[merchant]) {
        groups[merchant] = [];
      }
      groups[merchant].push(coupon);
    });
    
    const groupedResults = Object.entries(groups).map(([merchant, coupons]) => ({
      merchant,
      coupons,
      count: coupons.length
    }));
    
    // Auto-expand all groups by default for better UX
    const newExpandedGroups = new Set(groupedResults.map(group => group.merchant));
    setExpandedGroups(newExpandedGroups);
    
    return groupedResults;
  };

  const loadUserCoupons = async (accountId: string) => {
    try {
      const data = await getUserCoupons(accountId);
      if (data.success) {
        const coupons = data.coupons || [];
        setCoupons(coupons);
        setGroupedCoupons(groupCouponsByMerchant(coupons));
      } else {
        console.error('Failed to load user coupons:', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load your coupons');
      console.error('Error loading user coupons:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const userCredentials = await userWalletService.getUserCredentials();
    if (userCredentials?.walletData?.hederaAccountId) {
      await loadUserCoupons(userCredentials.walletData.hederaAccountId);
    }
    setRefreshing(false);
  };

  const toggleGroupExpansion = (merchant: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(merchant)) {
        newSet.delete(merchant);
      } else {
        newSet.add(merchant);
      }
      return newSet;
    });
  };

  const formatDiscountInfo = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.value}% OFF`;
    } else if (coupon.discountType === 'fixed_amount') {
      return `$${coupon.value} OFF`;
    } else if (coupon.discountType === 'free_item') {
      return 'FREE';
    } else {
      return `${coupon.value}`;
    }
  };

  const handleRedeemCoupon = async (coupon: Coupon) => {
    try {
      const userCredentials = await userWalletService.getUserCredentials();
      if (!userCredentials?.walletData?.hederaAccountId || !userCredentials?.privateKey) {
        Alert.alert('Error', 'Wallet credentials not found');
        return;
      }

      // Check campaign type to determine redemption flow
      if (coupon.campaignType === 'discount_code') {
        // Discount code redemption: burn NFT and reveal code
        Alert.alert(
          '💳 Redeem Discount Code',
          `This will permanently burn your NFT and reveal the discount code for "${coupon.name}". This action cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Redeem Code', 
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log(`💳 Redeeming discount code for coupon ${coupon.id}`);
                  
                  const result = await redeemDiscountCodeCoupon(
                    coupon.id,
                    userCredentials.walletData.hederaAccountId,
                    userCredentials.privateKey
                  );

                  Alert.alert(
                    '🎉 Discount Code Redeemed!',
                    `Your discount code: ${result.discountCode}\n\nCampaign: ${result.campaignName}\nDiscount: ${result.discountValue}${result.discountType === 'percentage' ? '%' : ''} off\n\nUse this code when shopping online!`,
                    [
                      { 
                        text: 'Copy Code', 
                        onPress: () => {
                          // TODO: Add clipboard functionality
                          console.log('Copying code to clipboard:', result.discountCode);
                        }
                      },
                      { 
                        text: 'OK', 
                        onPress: () => onRefresh() 
                      }
                    ]
                  );
                } catch (error) {
                  console.error('Error redeeming discount code:', error);
                  Alert.alert('Error', 'Failed to redeem discount code. Please try again.');
                }
              }
            }
          ]
        );
      } else {
        // QR redemption: generate secure token for merchant scanning
        const tokenData = await generateRedemptionToken(
          coupon.id, 
          userCredentials.walletData.hederaAccountId
        );

        // Show QR code modal for merchant to scan
        setSelectedCoupon(coupon);
        setRedemptionToken(tokenData.redemptionToken);
        setQrModalVisible(true);
      }
    } catch (error) {
      console.error('Error in redemption flow:', error);
      Alert.alert('Error', 'Failed to process redemption. Please try again.');
    }
  };

  const handleBurnCoupon = async (coupon: Coupon) => {
    try {
      // Show confirmation dialog with strong warning
      Alert.alert(
        '🔥 Burn Coupon - PERMANENT',
        `Are you sure you want to permanently destroy this coupon?\n\n"${coupon.name}"\n\n⚠️ This action CANNOT be undone!\n⚠️ The coupon will be destroyed forever!\n⚠️ You will NOT be able to use or redeem it!`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'BURN FOREVER',
            style: 'destructive',
            onPress: async () => {
              try {
                const userCredentials = await userWalletService.getUserCredentials();
                if (!userCredentials?.walletData?.hederaAccountId || !userCredentials?.privateKey) {
                  Alert.alert('Error', 'Wallet credentials not found');
                  return;
                }

                console.log(`🔥 Destroying coupon ${coupon.id} for user ${userCredentials.walletData.hederaAccountId}`);

                // Call burn API
                const result = await burnCoupon(
                  coupon.id,
                  userCredentials.walletData.hederaAccountId,
                  userCredentials.privateKey
                );

                console.log('✅ Coupon destroyed successfully:', result);

                Alert.alert(
                  '🔥 Coupon Destroyed',
                  `"${coupon.name}" has been permanently destroyed.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Refresh the coupons list
                        onRefresh();
                      }
                    }
                  ]
                );

              } catch (wipeError) {
                console.error('Error wiping coupon:', wipeError);
                Alert.alert('Error', 'Failed to destroy coupon. Please try again.');
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error preparing to destroy coupon:', error);
      Alert.alert('Error', 'Failed to prepare destroy operation');
    }
  };

  const renderGroupedCoupons = ({ item }: { item: GroupedCoupons }) => {
    const isExpanded = expandedGroups.has(item.merchant);
    
    return (
      <View style={styles.merchantGroup}>
        <TouchableOpacity
          style={styles.merchantHeader}
          onPress={() => toggleGroupExpansion(item.merchant)}
        >
          <Text style={styles.merchantName}>{item.merchant}</Text>
          <View style={styles.merchantInfo}>
            <Text style={styles.couponCount}>{item.count} coupon{item.count !== 1 ? 's' : ''}</Text>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.couponsList}>
            {item.coupons.map((coupon, index) => (
              <View key={coupon.id} style={styles.couponCard}>
                <View style={styles.couponHeader}>
                  <Text style={styles.couponName}>{coupon.name}</Text>
                  <Text style={styles.valueText}>
                    {coupon.discountType === 'percentage' ? `${coupon.value}% OFF` : 
                     coupon.discountType === 'fixed_amount' ? `$${coupon.value} OFF` :
                     coupon.discountType === 'free_item' ? 'FREE' : `${coupon.value}`}
                  </Text>
                </View>
                <Text style={styles.couponDescription}>{coupon.description}</Text>
                <Text style={styles.validUntilText}>
                  Expires: {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No expiry date'}
                </Text>
                <Text style={styles.nftText}>NFT: {coupon.tokenId}:{coupon.serialNumber}</Text>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.redeemButton}
                    onPress={() => handleRedeemCoupon(coupon)}
                  >
                    <Text style={styles.redeemButtonText}>
                      {coupon.campaignType === 'discount_code' ? '💳 Get Code' : '🎫 Show QR'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.burnButton}
                    onPress={() => handleBurnCoupon(coupon)}
                  >
                    <Text style={styles.burnButtonText}>🔥 Burn</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Show wallet creation prompt if user doesn't have a wallet
  if (hasWallet === false) {
    return (
      <View style={styles.container}>
        <View style={styles.walletPromptContainer}>
          <Text style={styles.walletPromptTitle}>No Wallet Found</Text>
          <Text style={styles.walletPromptSubtitle}>
            Create a Hedera wallet to start collecting and managing digital coupons
          </Text>
          
          <TouchableOpacity
            style={styles.createWalletButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.createWalletButtonText}>Create Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your coupons...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <Text style={styles.title}>My Coupons</Text>
        <Text style={styles.subtitle}>
          {coupons.length > 0 
            ? `You have ${coupons.length} coupon${coupons.length > 1 ? 's' : ''} from ${groupedCoupons.length} merchant${groupedCoupons.length > 1 ? 's' : ''}` 
            : 'No coupons yet'
          }
        </Text>
      </View>

      <FlatList
        data={groupedCoupons}
        renderItem={renderGroupedCoupons}
        keyExtractor={(item) => item.merchant}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No coupons found</Text>
            <Text style={styles.emptySubtext}>
              Claim some coupons from the home screen to see them here
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>Browse Coupons</Text>
            </TouchableOpacity>
          </View>
        }
      />
      
      {/* QR Code Modal for Redemption */}
      <QRCodeModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        redemptionToken={redemptionToken}
        couponName={selectedCoupon?.name || ''}
        discountInfo={selectedCoupon ? formatDiscountInfo(selectedCoupon) : ''}
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
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
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  couponDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  merchantText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  nftIdText: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  qrButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  browseButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  walletPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  walletPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  walletPromptSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createWalletButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  createWalletButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  // Grouped styles
  merchantGroup: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  expandIcon: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  couponsList: {
    padding: 8,
  },
  // Button container for redeem and burn buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  // Updated redeem button styles
  redeemButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Burn button styles
  burnButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  burnButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Updated text styles
  validUntilText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  nftText: {
    fontSize: 11,
    color: '#d1d5db',
    fontFamily: 'monospace',
  },
}); 