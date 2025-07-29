import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Coupon } from '../types';
import { fetchAvailableCoupons, claimCoupon } from '../services/api';
import { walletService } from '../services/wallet';

type CouponDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CouponDetail'>;
type CouponDetailScreenRouteProp = RouteProp<RootStackParamList, 'CouponDetail'>;

interface Props {
  navigation: CouponDetailScreenNavigationProp;
  route: CouponDetailScreenRouteProp;
}

export default function CouponDetailScreen({ navigation, route }: Props) {
  const { couponId } = route.params;
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCouponDetails();
  }, [couponId]);

  const loadCouponDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchAvailableCoupons();
      const foundCoupon = data.coupons.find(c => c.id === couponId);
      setCoupon(foundCoupon || null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load coupon details');
      console.error('Error loading coupon details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!coupon) return;
    
    try {
      // Get the user's wallet
      const wallet = await walletService.getWallet();
      if (!wallet) {
        Alert.alert('No Wallet', 'Please create a wallet first in the Wallet screen');
        return;
      }

      const result = await claimCoupon(coupon.id, wallet.accountId);
      
      if (result.success) {
        Alert.alert('Success', 'Coupon claimed successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Failed to claim coupon');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to claim coupon');
      console.error('Error claiming coupon:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!coupon) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Coupon not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.couponName}>{coupon.name}</Text>
          <Text style={styles.discountText}>{coupon.discountPercent}% OFF</Text>
        </View>
        
        <Text style={styles.description}>{coupon.description}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Merchant ID:</Text>
            <Text style={styles.detailValue}>{coupon.merchantId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expires:</Text>
            <Text style={styles.detailValue}>
              {new Date(coupon.expiresAt).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, styles.statusText]}>
              {coupon.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.claimButton} 
          onPress={handleClaim}
          disabled={coupon.status !== 'active'}
        >
          <Text style={styles.claimButtonText}>
            {coupon.status === 'active' ? 'Claim Coupon' : 'Already Claimed'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  couponName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  discountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  detailValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusText: {
    fontWeight: 'bold',
    color: '#059669',
  },
  claimButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 