import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantNavigator';
import { merchantWalletService, MerchantWalletData } from '../../services/merchantWallet';

type MerchantAuthScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'MerchantAuth'>;

interface Props {
  navigation: MerchantAuthScreenNavigationProp;
  onAuthSuccess: () => void;
}

interface RegistrationData {
  name: string;
  email: string;
  businessType: string;
  fiatPaymentAmount: number;
}

export default function MerchantAuthScreen({ navigation, onAuthSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  
  // Registration form
  const [regData, setRegData] = useState<RegistrationData>({
    name: '',
    email: '',
    businessType: '',
    fiatPaymentAmount: 99.99,
  });

  const handleLogin = async () => {
    if (!loginEmail.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, this would authenticate with your backend
      // For now, we'll check if merchant credentials exist locally
      const isAuthenticated = await merchantWalletService.isAuthenticated();
      
      if (isAuthenticated) {
        onAuthSuccess();
      } else {
        Alert.alert(
          'No Account Found', 
          'No merchant account found locally. Please register first or contact support.',
          [
            { text: 'Register', onPress: () => setIsLogin(false) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

      const handleRegister = async () => {
    // Validate form
    if (!regData.name.trim() || !regData.email.trim() || !regData.businessType.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Generate wallet with mnemonic phrase
      const { cryptoWalletService } = await import('../../services/cryptoWallet');
      const { wallet, mnemonic } = await cryptoWalletService.createWallet();

      console.log('✅ Generated merchant wallet with mnemonic on device');

      // Step 2: Register merchant with backend (send PUBLIC key only)
      const API_BASE_URL = 'http://192.168.0.162:3001';
      const response = await fetch(`${API_BASE_URL}/api/merchants/register-with-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: regData.name,
          email: regData.email,
          businessType: regData.businessType,
          fiatPaymentAmount: regData.fiatPaymentAmount,
          publicKey: wallet.publicKey // Only send PUBLIC key - never private!
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      const merchant = result.merchant;

      // Step 3: Show mnemonic backup screen
      setIsLoading(false);
      
      // Navigate to mnemonic backup
      (navigation as any).navigate('MnemonicBackup', {
        mnemonic,
        merchantData: {
          merchantId: merchant.id,
          name: merchant.name,
          email: merchant.email,
          hederaAccountId: merchant.hederaAccountId,
          hederaPublicKey: wallet.publicKey,
          nftCollectionId: merchant.nftCollectionId,
          businessType: merchant.businessType,
          onboardingStatus: merchant.onboardingStatus,
          createdAt: new Date().toISOString(),
        },
        wallet,
        onSuccess: onAuthSuccess
      });

      return; // Don't continue to success alert

    } catch (error) {
      Alert.alert('Registration Failed', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoData = () => {
    setRegData({
      name: 'Central Perk Coffee',
      email: 'manager@centralperk.com',
      businessType: 'Coffee Shop',
      fiatPaymentAmount: 99.99,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isLogin ? 'Merchant Login' : 'Merchant Registration'}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin 
            ? 'Welcome back to Dysco'
                  : 'Join Dysco as a merchant'
          }
        </Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.toggleButtonText, isLogin && styles.toggleButtonTextActive]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.toggleButtonText, !isLogin && styles.toggleButtonTextActive]}>
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {isLogin ? (
        // Login Form
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={loginEmail}
              onChangeText={setLoginEmail}
              placeholder="merchant@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.recoveryButton}
            onPress={() => (navigation as any).navigate('MerchantRecovery')}
          >
            <Text style={styles.recoveryButtonText}>
              Lost access? Recover with phrase
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Registration Form
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={regData.name}
              onChangeText={(value) => setRegData(prev => ({ ...prev, name: value }))}
              placeholder="Your Business Name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={regData.email}
              onChangeText={(value) => setRegData(prev => ({ ...prev, email: value }))}
              placeholder="business@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Type *</Text>
            <TextInput
              style={styles.input}
              value={regData.businessType}
              onChangeText={(value) => setRegData(prev => ({ ...prev, businessType: value }))}
              placeholder="e.g., Restaurant, Retail, Services"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Fee</Text>
            <Text style={styles.feeText}>${regData.fiatPaymentAmount}/month</Text>
            <Text style={styles.feeSubtext}>
              Includes unlimited coupon creation and blockchain fees
            </Text>
          </View>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={fillDemoData}
          >
            <Text style={styles.demoButtonText}>Fill Demo Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account & Pay</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    color: '#d1fae5',
  },
  toggleContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#059669',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  feeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  feeSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  demoButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recoveryButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  recoveryButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
}); 