import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppMode } from '../contexts/AppModeContext';

type WelcomeScreenNavigationProp = StackNavigationProp<any, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
  onRoleSelected: () => void;
}

export default function WelcomeScreen({ navigation, onRoleSelected }: Props) {
  const { setMode } = useAppMode();

  const selectCustomerRole = () => {
    setMode('user');
    onRoleSelected();
  };

  const selectMerchantRole = () => {
    setMode('merchant');
    onRoleSelected();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Branding */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🎫</Text>
          </View>
          <Text style={styles.appName}>Dysco</Text>
          <Text style={styles.tagline}>Digital coupons powered by Hedera</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleContainer}>
          <Text style={styles.roleTitle}>Welcome! How would you like to use Dysco?</Text>
          
          <TouchableOpacity
            style={[styles.roleButton, styles.customerButton]}
            onPress={selectCustomerRole}
          >
            <View style={styles.roleIcon}>
              <Text style={styles.roleEmoji}>👤</Text>
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleButtonTitle}>I'm a Customer</Text>
              <Text style={styles.roleButtonSubtitle}>Find and claim amazing deals from local businesses</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, styles.merchantButton]}
            onPress={selectMerchantRole}
          >
            <View style={styles.roleIcon}>
              <Text style={styles.roleEmoji}>🏪</Text>
            </View>
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleButtonTitle}>I'm a Business Owner</Text>
              <Text style={styles.roleButtonSubtitle}>Create and manage digital coupons for your business</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Hedera • Secure • Instant • Tradeable
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  roleContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -40,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customerButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  merchantButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleEmoji: {
    fontSize: 20,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  roleButtonSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  arrow: {
    fontSize: 18,
    color: '#cbd5e1',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
}); 