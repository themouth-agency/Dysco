import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppMode } from '../contexts/AppModeContext';

export default function UserSettingsScreen() {
  const navigation = useNavigation();
  const { setMode } = useAppMode();

  const handleWalletPress = () => {
    navigation.navigate('Wallet' as never);
  };

  const handleRedemptionHistoryPress = () => {
    navigation.navigate('UserRedemptionHistory' as never);
  };

  const handleSwitchToMerchant = () => {
    Alert.alert(
      'Switch to Merchant Mode',
      'Are you sure you want to switch to merchant mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Switch', 
          onPress: () => setMode('merchant'),
          style: 'destructive'
        }
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Dysco',
      'Dysco is a digital coupon platform built by The Mouth Agency.\n\nVersion 0.1.0\n\nSecure • Instant • Tradeable',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.settingArrow}>→</Text>}
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
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Settings Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet & Account</Text>
          
          <SettingItem
            icon="💰"
            title="My Wallet"
            subtitle="View balance and manage your wallet"
            onPress={handleWalletPress}
          />
          
          <SettingItem
            icon="📊"
            title="Redemption History"
            subtitle="View your coupon redemption history"
            onPress={handleRedemptionHistoryPress}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            icon="🏪"
            title="Switch to Merchant Mode"
            subtitle="Create and manage digital coupons"
            onPress={handleSwitchToMerchant}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <SettingItem
            icon="ℹ️"
            title="About Dysco"
            subtitle="Version and app information"
            onPress={handleAbout}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.hederaContainer}>
            <View style={styles.hederaIcon}>
              <Text style={styles.hederaIconText}>H</Text>
            </View>
            <Text style={styles.hederaText}>Hedera</Text>
          </View>
          <Text style={styles.footerText}>
            Powered by Hedera • Secure • Instant • Tradeable
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: 160, // Add even more space so Hedera text is visible
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
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  settingArrow: {
    fontSize: 16,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  hederaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hederaIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  hederaIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hederaText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
});