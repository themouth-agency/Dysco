import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantAuthNavigator';
import { merchantService } from '../../services/merchantService';
import { useAppMode } from '../../contexts/AppModeContext';

type MerchantSettingsScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'MerchantSettings'>;

interface Props {
  navigation: MerchantSettingsScreenNavigationProp;
}

export default function MerchantSettingsScreen({ navigation }: Props) {
  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { logout, setMode } = useAppMode();

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

  const handleSwitchToUser = () => {
    Alert.alert(
      'Switch to User Mode',
      'Are you sure you want to switch to user mode? You will remain logged in as a merchant.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Switch',
          onPress: () => {
            setMode('user');
          }
        }
      ]
    );
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
              const result = await merchantService.signOut();
              if (result.success) {
                // Go back to splash/welcome screen
                if (logout) {
                  logout();
                }
              } else {
                Alert.alert('Error', result.error || 'Failed to sign out');
              }
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



  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading settings...</Text>
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
            <Text style={styles.title}>Merchant Settings</Text>
            <Text style={styles.subtitle}>
              {merchantProfile?.name || 'Manage your account'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.contentContainer}>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleShowAccountInfo}>
          <Text style={styles.settingText}>Account Information</Text>
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
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.switchModeButton} onPress={handleSwitchToUser}>
          <Text style={styles.switchModeButtonText}>Switch to User Mode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
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
  contentContainer: {
    flex: 1,
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
  switchModeButton: {
    backgroundColor: '#024E44',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  switchModeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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