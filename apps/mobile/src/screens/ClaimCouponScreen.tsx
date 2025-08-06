import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { claimCampaignCoupon } from '../services/api';
import { userWalletService } from '../services/userWallet';

// This screen will be accessible from deep links
interface Props {
  navigation: any;
  route: {
    params: {
      campaignId: string;
    };
  };
}

interface Campaign {
  name: string;
  description?: string;
  expiresAt: string;
}

interface ClaimedCoupon {
  nftId: string;
  campaignName: string;
  discountType: string;
  discountValue: number;
  expiresAt: string;
  discountCode?: string;
}

export default function ClaimCouponScreen({ navigation, route }: Props) {
  const { campaignId } = route.params;
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [claimedCoupon, setClaimedCoupon] = useState<ClaimedCoupon | null>(null);
  const [userAccountId, setUserAccountId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAccount();
    fetchCampaignInfo();
  }, []);

  const loadUserAccount = async () => {
    try {
      const userCredentials = await userWalletService.getUserCredentials();
      if (userCredentials?.walletData?.hederaAccountId) {
        setUserAccountId(userCredentials.walletData.hederaAccountId);
        console.log('✅ Loaded user account for claiming:', userCredentials.walletData.hederaAccountId);
      } else {
        console.log('❌ No user wallet found for claiming');
      }
    } catch (error) {
      console.error('Error loading user account:', error);
    }
  };

  const fetchCampaignInfo = async () => {
    setLoading(true);
    try {
      // Get basic campaign info from the share link endpoint
      const { API_BASE_URL } = await import('../config/api');
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/share-link`);
      const data = await response.json();
      
      if (data.success) {
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error('Error fetching campaign info:', error);
      Alert.alert('Error', 'Failed to load campaign information');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = async () => {
    if (!userAccountId) {
      Alert.alert(
        'Wallet Required',
        'You need to create a wallet first to claim coupons.',
        [
          { text: 'Cancel' },
          { 
            text: 'Create Wallet', 
            onPress: () => navigation.navigate('Wallet') 
          }
        ]
      );
      return;
    }

    setClaiming(true);
    try {
      const result = await claimCampaignCoupon(campaignId, userAccountId);
      
      if (result.success) {
        setClaimedCoupon(result.coupon);
        Alert.alert(
          '🎉 Coupon Claimed!',
          `You've successfully claimed a coupon for ${result.coupon.campaignName}!`,
          [{ text: 'Great!', onPress: () => {} }]
        );
      }
    } catch (error: any) {
      console.error('Error claiming coupon:', error);
      Alert.alert(
        'Claim Failed', 
        error.message || 'Failed to claim coupon. It might already be claimed or expired.',
        [
          { text: 'OK' },
          { text: 'View My Coupons', onPress: () => navigation.navigate('MyCoupons') }
        ]
      );
    } finally {
      setClaiming(false);
    }
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
        return `${value} discount`;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading campaign...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {!claimedCoupon ? (
          // Claim flow
          <>
            <View style={styles.header}>
              <Text style={styles.title}>🎫 Claim Your Coupon</Text>
              {campaign && (
                <>
                  <Text style={styles.campaignName}>{campaign.name}</Text>
                  {campaign.description && (
                    <Text style={styles.campaignDescription}>{campaign.description}</Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What happens when you claim?</Text>
              <Text style={styles.infoText}>• A unique NFT coupon will be transferred to your wallet</Text>
              <Text style={styles.infoText}>• You can redeem it for discounts</Text>
              <Text style={styles.infoText}>• It's yours to keep or trade</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.claimButton, claiming && styles.disabledButton]}
                onPress={handleClaimCoupon}
                disabled={claiming}
              >
                <Text style={styles.claimButtonText}>
                  {claiming ? 'Claiming...' : '🎯 Claim My Coupon'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Success flow
          <>
            <View style={styles.successHeader}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Coupon Claimed!</Text>
              <Text style={styles.successSubtitle}>{claimedCoupon.campaignName}</Text>
            </View>

            <View style={styles.couponCard}>
              <Text style={styles.couponDiscount}>
                {formatDiscount(claimedCoupon.discountType, claimedCoupon.discountValue)}
              </Text>
              <Text style={styles.couponExpiry}>
                Expires: {formatDate(claimedCoupon.expiresAt)}
              </Text>
              {claimedCoupon.discountCode && (
                <View style={styles.discountCode}>
                  <Text style={styles.discountCodeLabel}>Discount Code:</Text>
                  <Text style={styles.discountCodeValue}>{claimedCoupon.discountCode}</Text>
                </View>
              )}
              <Text style={styles.nftId}>NFT ID: {claimedCoupon.nftId}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('MyCoupons')}
              >
                <Text style={styles.primaryButtonText}>View My Coupons</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('MainTabs')}
              >
                <Text style={styles.secondaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  campaignName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  campaignDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  claimButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00C851',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  couponCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  couponDiscount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  couponExpiry: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  discountCode: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  discountCodeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  discountCodeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'monospace',
  },
  nftId: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});