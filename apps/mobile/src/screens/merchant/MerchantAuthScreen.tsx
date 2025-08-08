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
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
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
      setLoginEmail('admin@8bees.fr');
      setLoginPassword('qwerty');
    } else {
      setRegEmail('newmerchant@example.com');
      setRegPassword('secure123');
      setBusinessName('Central Perk Coffee');
      setBusinessType('restaurant');
    }
  };

  const renderLoginForm = () => (
    <View style={styles.form}>

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

      <TouchableOpacity style={styles.demoButton} onPress={fillDemoData}>
        <Text style={styles.demoButtonText}>Fill Demo Login</Text>
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#08090A" />
      
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#08090A', '#1E261F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          {/* Back button positioned absolutely */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Centered logo row */}
          <View style={styles.logoRow}>
            <SvgXml
              xml={`<svg width="196" height="65" viewBox="0 0 196 65" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M40.6279 1.04968V57.2083H29.9163V50.9818C27.1012 52.5802 23.8806 53.4867 20.2782 53.4867C9.04169 53.4867 0 44.3734 0 33.1369C0 21.9004 9.04169 12.8587 20.2782 12.8587C23.8806 12.8587 27.0774 13.7653 29.9163 15.3637V1.04968H40.6279ZM10.7117 33.2085C10.7117 38.5285 14.9581 42.775 20.2782 42.775C25.5982 42.775 29.9163 38.5285 29.9163 33.2085C29.9163 27.8885 25.6221 23.5704 20.2782 23.5704C14.9343 23.5704 10.7117 27.8646 10.7117 33.2085Z" fill="white"/>
<path d="M82.5919 10.6639L90.1067 18.1788L72.9776 35.3079V62.6H62.3137V35.3079L45.1846 18.1788L52.6994 10.6639L67.6576 25.6937L82.6157 10.6639H82.5919Z" fill="white"/>
<path d="M115.276 10.6639C109.813 10.6639 105.638 14.648 105.638 19.7772V44.4212C105.638 55.6577 96.1904 64.1984 85.2878 64.1984H83.6895V53.5344H85.2878C90.751 53.5344 94.926 49.5504 94.926 44.4212V19.7772C94.926 8.5407 104.373 0 115.276 0H116.874V10.6639H115.276Z" fill="white"/>
<path d="M135.554 23.5704C130.234 23.5704 125.987 27.8646 125.987 33.2085C125.987 38.5524 130.234 42.775 135.554 42.775C138.178 42.775 140.444 41.8207 142.496 39.8884L149.868 47.6656C146.408 51.1248 141.136 53.5105 135.554 53.5105C124.317 53.5105 115.275 44.3973 115.275 33.1608C115.275 21.9243 124.317 12.8826 135.554 12.8826C141.136 12.8826 145.764 14.9342 149.868 18.7275L142.496 26.5047C140.373 24.5724 138.202 23.6181 135.554 23.6181V23.5704Z" fill="white"/>
<path d="M195.649 33.2085C195.649 44.445 186.536 53.4867 175.299 53.4867C164.063 53.4867 155.021 44.445 155.021 33.2085C155.021 21.972 164.063 12.8588 175.299 12.8588C186.536 12.8588 195.649 21.972 195.649 33.2085ZM165.733 33.2085C165.733 38.5286 169.979 42.7751 175.299 42.7751C180.619 42.7751 184.937 38.5286 184.937 33.2085C184.937 27.8885 180.643 23.5704 175.299 23.5704C169.955 23.5704 165.733 27.8646 165.733 33.2085Z" fill="white"/>
</svg>`}
              width={100}
              height={100 * (65/196)}
            />
            <Text style={styles.businessText}>Business</Text>
          </View>

          {/* Business icon */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/business.png')}
              style={styles.businessIcon}
            />
          </View>

          {/* Title and subtitle in header */}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Merchant Login</Text>
            <Text style={styles.headerSubtitle}>Sign in to your business account</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main content */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {isLogin ? renderLoginForm() : renderRegistrationForm()}
      </ScrollView>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: height * 0.42,
    paddingTop: 0,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 5,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  businessText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00A90B',
    marginLeft: 15,
  },
  businessIcon: {
    width: 120,
    height: 120,
  },
  headerTitleContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
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
    opacity: 0.8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1a1a1a',
  },
  primaryButton: {
    backgroundColor: '#024E44',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#024E44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    color: '#00A90B',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  switchText: {
    fontSize: 16,
    color: '#666666',
  },
  switchLink: {
    color: '#00A90B',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
});