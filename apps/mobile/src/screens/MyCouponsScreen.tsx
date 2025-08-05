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
                    Alert.alert('Success!', `Your discount code is: ${redeemResponse.discountCode}. You can copy it from the redemption history.`);
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
      return `${coupon.discountPercent || 0}% OFF`;
    } else {
      return `${coupon.value || 'Discount'}`;
    }
  };

  const renderCoupon = ({ item }: { item: Coupon }) => (
    <View style={styles.couponCard}>
      <View style={styles.couponContent}>
        <View style={styles.couponHeader}>
          <Text style={styles.couponName}>{item.name || 'Coupon'}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{formatDiscountInfo(item)}</Text>
          </View>
        </View>
        
        <Text style={styles.merchantName}>
          {item.merchant || 'Unknown Merchant'}
        </Text>
        
        <View style={styles.couponFooter}>
          <Text style={styles.expiryText}>
            Expires {new Date(item.validUntil || Date.now()).toLocaleDateString()}
          </Text>
          <TouchableOpacity 
            style={styles.redeemButton}
            onPress={() => handleRedeemPress(item)}
          >
            <Text style={styles.redeemButtonText}>Redeem</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.headerLogo}>dysco</Text>
        <Text style={styles.headerTitle}>Welcome, user!</Text>
        <Text style={styles.headerSubtitle}>Check your available coupons</Text>
        
        {/* Wallet Card */}
        <TouchableOpacity style={styles.walletCard} onPress={handleWalletPress}>
          <View style={styles.walletIcon}>
            <Text style={styles.walletIconText}>💰</Text>
            <View style={styles.hederaBadge}>
              <Text style={styles.hederaBadgeText}>H</Text>
            </View>
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
          <Text style={styles.sectionTitle}>My Coupons</Text>
          
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
    paddingBottom: 140, // Add more space for floating tab bar and elevated Discover button
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
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
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
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
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