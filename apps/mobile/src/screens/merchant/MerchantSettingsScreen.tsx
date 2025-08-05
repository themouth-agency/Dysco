import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantNavigator';
import { merchantService } from '../../services/merchantService';

type MerchantSettingsScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'MerchantSettings'>;

interface Props {
  navigation: MerchantSettingsScreenNavigationProp;
}

export default function MerchantSettingsScreen({ navigation }: Props) {
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMerchantProfile();
  }, []);

  const loadMerchantProfile = async () => {
    try {
      setLoading(true);
      const profile = await merchantService.getMerchantProfile();
      setMerchantProfile(profile);
    } catch (error) {
      console.error('Error loading merchant profile:', error);
      Alert.alert('Error', 'Failed to load merchant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await merchantService.signOut();
              // Navigation will be handled by the auth navigator
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  const handleShowAccountInfo = () => {
    if (!merchantProfile) return;

    Alert.alert(
      'Account Information',
      `Business: ${merchantProfile.name || 'N/A'}\nEmail: ${merchantProfile.email}\nHedera Account: ${merchantProfile.hedera_account_id || 'N/A'}\nNFT Collection: ${merchantProfile.nft_collection_id || 'None'}\nStatus: ${merchantProfile.onboarding_status || 'Unknown'}`,
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature allows you to export your merchant data. Would you like to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // In a real app, this would export the data
            Alert.alert('Success', 'Data export functionality would be implemented here');
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help? Contact our support team:\n\nsupport@dysco.com\n\nOr visit our help center for FAQ and guides.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Merchant Settings</Text>
        <Text style={styles.subtitle}>
          {merchantProfile?.name || 'Manage your account'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleShowAccountInfo}>
          <Text style={styles.settingText}>Account Information</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
          <Text style={styles.settingText}>Export Account Data</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Business Name</Text>
          <Text style={styles.infoValue}>{merchantProfile?.name || 'Not set'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{merchantProfile?.email || 'Not set'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Hedera Account</Text>
          <Text style={styles.infoValue}>{merchantProfile?.hedera_account_id || 'Not created'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>NFT Collection</Text>
          <Text style={styles.infoValue}>{merchantProfile?.nft_collection_id || 'Not created'}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Status</Text>
          <Text style={[styles.infoValue, styles.statusValue]}>
            {merchantProfile?.onboarding_status || 'Unknown'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleContactSupport}>
          <Text style={styles.settingText}>Contact Support</Text>
          <Text style={styles.settingArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
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
  header: {
    backgroundColor: '#059669',
    padding: 20,
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
    color: '#d1fae5',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  settingItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
  },
  settingArrow: {
    fontSize: 16,
    color: '#9ca3af',
  },
  infoItem: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  statusValue: {
    textTransform: 'capitalize',
    color: '#059669',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#dc2626',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});