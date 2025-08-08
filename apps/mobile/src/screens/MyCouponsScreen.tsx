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
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

// Services
import { userWalletService } from '../services/userWallet';

// Components
import { QRCodeModal } from '../components/QRCodeModal';

// API
import * as api from '../services/api';

// Types
import { Coupon } from '../types';

type FilterType = 'all' | 'available' | 'expired';

export default function MyCouponsScreen() {
  const navigation = useNavigation();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // QR Code Modal state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [redemptionToken, setRedemptionToken] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  useEffect(() => {
    checkWalletAndLoadData();
  }, []);

  useEffect(() => {
    filterCoupons();
  }, [coupons, activeFilter]);

  const checkWalletAndLoadData = async () => {
    try {
      setLoading(true);
      
      // Check if user has wallet
      const userCredentials = await userWalletService.getUserCredentials();
      console.log('🐛 Debug wallet storage:', {
        hederaAccountId: userCredentials?.walletData?.hederaAccountId,
        walletData: userCredentials?.walletData,
        userWallet: userCredentials ? 'EXISTS' : 'NOT_FOUND'
      });

      if (!userCredentials?.walletData?.hederaAccountId) {
        setHasWallet(false);
        setLoading(false);
        return;
      }

      setHasWallet(true);
      
      // Load balance
      const balanceData = await api.getAccountBalance(userCredentials.walletData.hederaAccountId);
      if (balanceData.success) {
        setBalance(balanceData.balance);
      }
      
      // Load coupons
      await loadCoupons();
    } catch (error) {
      console.error('Error checking wallet and loading data:', error);
      setHasWallet(false);
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const userCredentials = await userWalletService.getUserCredentials();
      if (!userCredentials?.walletData?.hederaAccountId) {
        return;
      }

      console.log('Fetching user coupons for account ID:', userCredentials.walletData.hederaAccountId);
      
      const userCouponsResponse = await api.getUserCoupons(userCredentials.walletData.hederaAccountId);
      setCoupons(userCouponsResponse.coupons || []);
    } catch (error) {
      console.error('Error loading coupons:', error);
      Alert.alert('Error', 'Failed to load coupons');
    }
  };

  const filterCoupons = () => {
    if (!coupons) return;

    let filtered: Coupon[] = [];
    const now = new Date();

    switch (activeFilter) {
      case 'all':
        filtered = coupons;
        break;
      case 'available':
        filtered = coupons.filter(coupon => {
          if (!coupon.validUntil) return true;
          const expiryDate = new Date(coupon.validUntil);
          return expiryDate > now;
        });
        break;
      case 'expired':
        filtered = coupons.filter(coupon => {
          if (!coupon.validUntil) return false;
          const expiryDate = new Date(coupon.validUntil);
          return expiryDate <= now;
        });
        break;
    }

    setFilteredCoupons(filtered);
  };

  const handleRedeemPress = async (coupon: Coupon) => {
    console.log('🎫 Redeem button pressed for coupon:', coupon.name, coupon.id);
    setSelectedCoupon(coupon);
    try {
      const userCredentials = await userWalletService.getUserCredentials();
      if (!userCredentials?.walletData?.hederaAccountId) {
        Alert.alert('Wallet Required', 'Please create a wallet first to redeem coupons.');
        navigation.navigate('Wallet' as never);
        return;
      }
      
      // Default to QR code if redemption type is not set
      const redemptionType = coupon.redemptionType || 'qr_code';
      
      if (redemptionType === 'qr_code' || redemptionType === 'qr_redeem') {
        console.log('🚀 Generating QR redemption token...');
        const response = await api.generateRedemptionToken(coupon.id, userCredentials.walletData.hederaAccountId);
        if (response.success && response.token) {
          console.log('✅ QR token generated successfully:', response.token?.substring(0, 20) + '...');
          setRedemptionToken(response.token);
          setQrModalVisible(true);
        } else {
          console.log('❌ Failed to generate QR token:', response.error || 'No token received');
          Alert.alert('Error', response.error || 'Failed to generate redemption token.');
        }
      } else if (redemptionType === 'discount_code') {
        Alert.alert(
          'Redeem Discount Code',
          `Are you sure you want to redeem this coupon for a discount code? This will burn the NFT.`, 
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Redeem',
              onPress: async () => {
                try {
                  const redeemResponse = await api.redeemDiscountCodeCoupon(coupon.id, userCredentials.walletData.hederaAccountId);
                  if (redeemResponse.success) {
                    const discountCode = redeemResponse.discountCode;
                    Alert.alert(
                      'Code Revealed! 🎉', 
                      `Your discount code is:\n${discountCode}`,
                      [
                        { text: 'OK' },
                        { 
                          text: 'Copy Code', 
                          onPress: async () => {
                            await Clipboard.setStringAsync(discountCode);
                            Alert.alert('Copied!', 'Discount code copied to clipboard');
                          }
                        },
                        { text: 'View All Codes', onPress: () => navigation.navigate('DiscountCodes' as never) }
                      ]
                    );
                    onRefresh(); // Refresh coupons after redemption
                  } else {
                    Alert.alert('Redemption Failed', redeemResponse.error || 'Failed to redeem coupon for discount code.');
                  }
                } catch (error) {
                  console.error('Error redeeming discount code:', error);
                  Alert.alert('Error', 'Failed to redeem discount code.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error handling redeem press:', error);
      Alert.alert('Error', 'Failed to initiate redemption process.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Only refresh data without showing loading state to prevent flashing
      const userCredentials = await userWalletService.getUserCredentials();
      if (userCredentials?.walletData?.hederaAccountId) {
        // Load balance
        const balanceData = await api.getAccountBalance(userCredentials.walletData.hederaAccountId);
        if (balanceData.success) {
          setBalance(balanceData.balance);
        }
        
        // Load coupons
        await loadCoupons();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleWalletPress = () => {
    navigation.navigate('Wallet' as never);
  };

  const handleCreateWallet = () => {
    navigation.navigate('Wallet' as never);
  };

  const getFilterCounts = () => {
    const now = new Date();
    const all = coupons.length;
    const available = coupons.filter(coupon => {
      if (!coupon.validUntil) return true;
      const expiryDate = new Date(coupon.validUntil);
      return expiryDate > now;
    }).length;
    const expired = coupons.filter(coupon => {
      if (!coupon.validUntil) return false;
      const expiryDate = new Date(coupon.validUntil);
      return expiryDate <= now;
    }).length;

    return { all, available, expired };
  };

  const formatDiscountInfo = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.value || 0}% OFF`;
    } else if (coupon.discountType === 'fixed_amount') {
      return `$${coupon.value || 0} OFF`;
    } else if (coupon.discountType === 'free_item') {
      return 'FREE ITEM';
    } else {
      return `${coupon.value || 'Discount'}`;
    }
  };

  const renderCoupon = ({ item }: { item: Coupon }) => {
    const isDiscountCodeCampaign = item.redemptionType === 'discount_code';
    
    return (
      <View style={styles.couponCard}>
        <View style={styles.couponContent}>
          <View style={styles.couponHeader}>
            <Text style={styles.couponName}>{item.name || 'Coupon'}</Text>
            <View style={styles.badgeContainer}>
              {isDiscountCodeCampaign ? (
                <View style={styles.secretBadge}>
                  <Text style={styles.secretText}>🔒 SECRET CODE</Text>
                </View>
              ) : (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{formatDiscountInfo(item)}</Text>
                </View>
              )}
              {item.campaignActive === false && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>INACTIVE</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={styles.merchantName}>
            {item.merchant || 'Unknown Merchant'}
          </Text>
          
          {isDiscountCodeCampaign && (
            <Text style={styles.discountCodeHint}>
              💰 Contains a secret discount code. Burn this NFT to reveal it!
            </Text>
          )}
          
          <View style={styles.couponFooter}>
            <Text style={styles.expiryText}>
              Expires {new Date(item.validUntil || Date.now()).toLocaleDateString()}
            </Text>
            <TouchableOpacity 
              style={[styles.redeemButton, isDiscountCodeCampaign && styles.burnButton]}
              onPress={() => handleRedeemPress(item)}
            >
              <Text style={styles.redeemButtonText}>
                {isDiscountCodeCampaign ? '🔥 Burn for Code' : 'Redeem'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const FilterButton = ({ 
    type, 
    label, 
    count 
  }: { 
    type: FilterType; 
    label: string; 
    count: number; 
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, activeFilter === type && styles.filterButtonActive]}
      onPress={() => setActiveFilter(type)}
    >
      <Text style={[styles.filterButtonText, activeFilter === type && styles.filterButtonTextActive]}>
        {label} {count}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasWallet === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <Text style={styles.headerLogo}>dysco</Text>
          <Text style={styles.headerTitle}>Welcome, user!</Text>
          <Text style={styles.headerSubtitle}>Create a wallet to start collecting coupons</Text>
        </LinearGradient>

        <View style={styles.noWalletContainer}>
          <Text style={styles.noWalletEmoji}>💰</Text>
          <Text style={styles.noWalletTitle}>No Wallet Found</Text>
          <Text style={styles.noWalletSubtitle}>
            Create a wallet to start collecting and managing your digital coupons
          </Text>
          <TouchableOpacity style={styles.createWalletButton} onPress={handleCreateWallet}>
            <Text style={styles.createWalletButtonText}>Create Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const counts = getFilterCounts();

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
        <SvgXml
          xml={`<svg width="196" height="65" viewBox="0 0 196 65" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M40.6279 1.04968V57.2083H29.9163V50.9818C27.1012 52.5802 23.8806 53.4867 20.2782 53.4867C9.04169 53.4867 0 44.3734 0 33.1369C0 21.9004 9.04169 12.8587 20.2782 12.8587C23.8806 12.8587 27.0774 13.7653 29.9163 15.3637V1.04968H40.6279ZM10.7117 33.2085C10.7117 38.5285 14.9581 42.775 20.2782 42.775C25.5982 42.775 29.9163 38.5285 29.9163 33.2085C29.9163 27.8885 25.6221 23.5704 20.2782 23.5704C14.9343 23.5704 10.7117 27.8646 10.7117 33.2085Z" fill="white"/>
<path d="M82.5919 10.6639L90.1067 18.1788L72.9776 35.3079V62.6H62.3137V35.3079L45.1846 18.1788L52.6994 10.6639L67.6576 25.6937L82.6157 10.6639H82.5919Z" fill="white"/>
<path d="M115.276 10.6639C109.813 10.6639 105.638 14.648 105.638 19.7772V44.4212C105.638 55.6577 96.1904 64.1984 85.2878 64.1984H83.6895V53.5344H85.2878C90.751 53.5344 94.926 49.5504 94.926 44.4212V19.7772C94.926 8.5407 104.373 0 115.276 0H116.874V10.6639H115.276Z" fill="white"/>
<path d="M135.554 23.5704C130.234 23.5704 125.987 27.8646 125.987 33.2085C125.987 38.5524 130.234 42.775 135.554 42.775C138.178 42.775 140.444 41.8207 142.496 39.8884L149.868 47.6656C146.408 51.1248 141.136 53.5105 135.554 53.5105C124.317 53.5105 115.275 44.3973 115.275 33.1608C115.275 21.9243 124.317 12.8826 135.554 12.8826C141.136 12.8826 145.764 14.9342 149.868 18.7275L142.496 26.5047C140.373 24.5724 138.202 23.6181 135.554 23.6181V23.5704Z" fill="white"/>
<path d="M195.649 33.2085C195.649 44.445 186.536 53.4867 175.299 53.4867C164.063 53.4867 155.021 44.445 155.021 33.2085C155.021 21.972 164.063 12.8588 175.299 12.8588C186.536 12.8588 195.649 21.972 195.649 33.2085ZM165.733 33.2085C165.733 38.5286 169.979 42.7751 175.299 42.7751C180.619 42.7751 184.937 38.5286 184.937 33.2085C184.937 27.8885 180.643 23.5704 175.299 23.5704C169.955 23.5704 165.733 27.8646 165.733 33.2085Z" fill="white"/>
</svg>`}
          width={80}
          height={80 * (65/196)}
          style={styles.headerLogo}
        />
        <Text style={styles.headerTitle}>Welcome, user!</Text>
        <Text style={styles.headerSubtitle}>Check your available coupons</Text>
        
        {/* Wallet Card */}
        <TouchableOpacity style={styles.walletCard} onPress={handleWalletPress}>
          <View style={styles.walletIcon}>
            <Image
              source={require('../../assets/wallet.png')}
              style={styles.walletImage}
              resizeMode="contain"
            />
            {/* <View style={styles.hederaBadge}>
              <Text style={styles.hederaBadgeText}>H</Text>
            </View> */}
          </View>
          <View style={styles.walletContent}>
            <Text style={styles.walletTitle}>My Wallet</Text>
            <Text style={styles.walletBalance}>{balance.toFixed(2)} HBAR</Text>
          </View>
          <Text style={styles.walletArrow}>→</Text>
        </TouchableOpacity>
        </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* My Coupons Section */}
        <View style={styles.couponsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Coupons</Text>
            <TouchableOpacity 
              style={styles.discountCodesButton}
              onPress={() => navigation.navigate('DiscountCodes' as never)}
            >
              <Text style={styles.discountCodesButtonText}>💳 My Codes</Text>
            </TouchableOpacity>
          </View>
          
          {/* Filter Buttons */}
          <View style={styles.filtersContainer}>
            <FilterButton type="all" label="All" count={counts.all} />
            <FilterButton type="available" label="Available" count={counts.available} />
            <FilterButton type="expired" label="Expired" count={counts.expired} />
          </View>
        </View>

        {/* Coupons List */}
        {filteredCoupons.length === 0 ? (
          <View style={styles.emptyCouponsContainer}>
            <Text style={styles.emptyCouponsText}>🎫</Text>
            <Text style={styles.emptyCouponsTitle}>No coupons available</Text>
            <Text style={styles.emptyCouponsSubtitle}>
              Visit the Discover tab to find and claim amazing deals
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCoupons}
            renderItem={renderCoupon}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>



      {/* QR Code Modal */}
      <QRCodeModal
        visible={qrModalVisible}
        redemptionToken={redemptionToken}
        couponName={selectedCoupon?.name || 'Coupon'}
        discountInfo={selectedCoupon ? formatDiscountInfo(selectedCoupon) : ''}
        onClose={() => {
          console.log('🚪 Closing QR modal');
          setQrModalVisible(false);
          setRedemptionToken('');
          setSelectedCoupon(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: 0, // Remove padding - let content flow under floating tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
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
  headerLogo: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 20,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  walletIcon: {
    position: 'relative',
    marginRight: 16,
  },
  walletIconText: {
    fontSize: 32,
  },
  walletImage: {
    width: 64,
    height: 64,
    // tintColor: '#FFFFFF',
  },
  hederaBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hederaBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  walletContent: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  walletArrow: {
    fontSize: 20,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  couponsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 400,
    color: '#1a1a1a',
  },
  discountCodesButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountCodesButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 40, // Increased padding to make coupons less wide
    paddingBottom: 140, // Add space for floating tab bar
  },

  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  couponContent: {
    padding: 20,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  couponName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountBadge: {
    backgroundColor: '#FFE68B',
    borderRadius: 4,
    borderWidth: 0.4,
    borderColor: '#FFF6D5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a', // Dark text on yellow background
  },
  inactiveBadge: {
    backgroundColor: '#ff6b6b',
    borderRadius: 4,
    borderWidth: 0.4,
    borderColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secretBadge: {
    backgroundColor: '#7c3aed', // Purple background for secret codes
    borderRadius: 4,
    borderWidth: 0.4,
    borderColor: '#a855f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  secretText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  discountCodeHint: {
    fontSize: 12,
    color: '#7c3aed',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  burnButton: {
    backgroundColor: '#ef4444', // Red background for burn action
  },
  merchantName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
    marginBottom: 16,
  },
  couponFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: 12,
    color: '#999999',
  },
  redeemButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyCouponsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyCouponsText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyCouponsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyCouponsSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noWalletEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  noWalletTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  noWalletSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createWalletButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  createWalletButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});