import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppMode } from '../contexts/AppModeContext';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.45;

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Circular Video */}
      <View style={styles.header}>
        <View style={styles.circleContainer}>
          {/* Background Video (will be added later) */}
          <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.videoPlaceholder}
          />
          
          {/* Dysco Logo Overlay */}
          <View style={styles.logoOverlay}>
            <Text style={styles.logoText}>dysco</Text>
          </View>
        </View>
        
        <Text style={styles.tagline}>COUPONS. FOR REAL.</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>Welcome!</Text>
        <Text style={styles.welcomeSubtitle}>How would you like to use Dysco?</Text>
        
        {/* Role Selection Cards */}
        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[styles.roleCard, styles.customerCard]}
            onPress={selectCustomerRole}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardEmoji}>🛍️</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>I'm a Customer</Text>
              <Text style={styles.cardSubtitle}>Find and claim amazing deals from local businesses</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, styles.merchantCard]}
            onPress={selectMerchantRole}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.cardEmoji}>🏪</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>I'm a Business Owner</Text>
              <Text style={styles.cardSubtitle}>Create and manage digital coupons for your business</Text>
            </View>
            <Text style={styles.cardArrow}>→</Text>
          </TouchableOpacity>
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: CIRCLE_SIZE / 2,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: CIRCLE_SIZE / 2,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  customerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  merchantCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#34A853',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardEmoji: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  cardArrow: {
    fontSize: 18,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  hederaIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hederaText: {
    fontSize: 24,
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