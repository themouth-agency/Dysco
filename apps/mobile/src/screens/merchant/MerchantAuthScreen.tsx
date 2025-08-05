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
import { supabaseAuthService } from '../../services/supabaseAuth';

type MerchantAuthScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'MerchantAuth'>;

interface Props {
  navigation: MerchantAuthScreenNavigationProp;
  onAuthSuccess: () => void;
}

export default function MerchantAuthScreen({ navigation, onAuthSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration form
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await supabaseAuthService.signIn(loginEmail.trim(), loginPassword);
      
      if (result.success) {
        Alert.alert(
          'Welcome Back!',
          'Successfully logged in to your merchant account.',
          [
            {
              text: 'Continue',
              onPress: onAuthSuccess
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regEmail.trim() || !regPassword.trim() || !businessName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (regPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📝 Registering merchant with Supabase...');
      
      // Register with Supabase - NO crypto wallet generation
      const result = await supabaseAuthService.signUp({
        email: regEmail.trim(),
        password: regPassword,
        businessName: businessName.trim(),
        businessType: businessType.trim() || 'retail'
      });

      if (result.success) {
        // Clear the form fields immediately after successful registration
        setBusinessName('');
        setBusinessType('');
        setRegEmail('');
        setRegPassword('');
        setConfirmPassword('');
        
        if (result.message) {
          // Email confirmation required - profile already created
          Alert.alert(
            'Registration Successful!',
            `Your merchant account has been created! ${result.message}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Switch to login mode with clean form
                  setIsLogin(true);
                  console.log('✅ Merchant profile created, waiting for email confirmation');
                }
              }
            ]
          );
        } else {
          // Registration complete, account ready
          Alert.alert(
            'Registration Successful!',
            'Your merchant account has been created and is ready to use. You can now start creating digital coupons.',
            [
              {
                text: 'Continue',
                onPress: onAuthSuccess
              }
            ]
          );
        }
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', 'Please check your connection and try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = () => {
    Alert.alert(
      'Password Recovery',
      'Password recovery functionality would be implemented here using Supabase\'s built-in password reset.',
      [{ text: 'OK' }]
    );
  };

  const fillDemoData = () => {
    if (isLogin) {
      setLoginEmail('demo@merchant.com');
      setLoginPassword('demo123');
    } else {
      setRegEmail('newmerchant@example.com');
      setRegPassword('secure123');
      setBusinessName('Central Perk Coffee');
      setBusinessType('restaurant');
    }
  };

  const renderLoginForm = () => (
    <View style={styles.form}>
      <Text style={styles.title}>Merchant Login</Text>
      <Text style={styles.subtitle}>Sign in to your business account</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={loginEmail}
          onChangeText={setLoginEmail}
          placeholder="Enter your email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={loginPassword}
          onChangeText={setLoginPassword}
          placeholder="Enter your password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity style={styles.demoButton} onPress={fillDemoData}>
        <Text style={styles.demoButtonText}>Fill Demo Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={handleRecovery}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(false)}>
        <Text style={styles.switchText}>
          Don't have an account? <Text style={styles.switchLink}>Register</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRegistrationForm = () => (
    <View style={styles.form}>
      <Text style={styles.title}>Create Business Account</Text>
      <Text style={styles.subtitle}>Start accepting digital coupons</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Enter your business name"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          value={regEmail}
          onChangeText={setRegEmail}
          placeholder="Enter your email"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={regPassword}
          onChangeText={setRegPassword}
          placeholder="Choose a secure password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Business Type</Text>
        <TextInput
          style={styles.input}
          value={businessType}
          onChangeText={setBusinessType}
          placeholder="e.g., restaurant, retail, services"
          placeholderTextColor="#9ca3af"
          autoCapitalize="words"
        />
      </View>

      <TouchableOpacity style={styles.demoButton} onPress={fillDemoData}>
        <Text style={styles.demoButtonText}>Fill Demo Data</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, isLoading && styles.disabledButton]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(true)}>
        <Text style={styles.switchText}>
          Already have an account? <Text style={styles.switchLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🚀 What happens next?</Text>
        <Text style={styles.infoText}>
          • Your business account will be created instantly{'\n'}
          • A Hedera blockchain account will be set up automatically{'\n'}
          • You can start creating digital coupons right away{'\n'}
          • No crypto knowledge required!
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dysco Business</Text>
        <Text style={styles.headerSubtitle}>Digital Coupon Platform</Text>
      </View>

      {isLogin ? renderLoginForm() : renderRegistrationForm()}
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
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#d1fae5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
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
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
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
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    color: '#059669',
    fontSize: 16,
  },
  switchButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  switchText: {
    fontSize: 16,
    color: '#6b7280',
  },
  switchLink: {
    color: '#059669',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
});