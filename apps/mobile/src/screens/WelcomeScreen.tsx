import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { SvgXml } from 'react-native-svg';
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
  
  const player = useVideoPlayer(require('../../assets/welcome_gradient.mp4'), player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const selectCustomerRole = () => {
    console.log('🎯 Customer button pressed!');
    setMode('user');
    console.log('🎯 Mode set to user');
    onRoleSelected();
    console.log('🎯 onRoleSelected called');
  };

  const selectMerchantRole = () => {
    console.log('🎯 Merchant button pressed!');
    setMode('merchant');
    console.log('🎯 Mode set to merchant');
    onRoleSelected();
    console.log('🎯 onRoleSelected called');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Circular Video */}
      <View style={styles.header}>
        <View style={styles.circleContainer}>
          {/* Circular Video */}
          <VideoView
            style={styles.circularVideo}
            player={player}
            contentFit="cover"
          />
          
          {/* Dysco Logo Overlay */}
          <View style={styles.logoOverlay}>
            <SvgXml
              xml={`<svg width="196" height="65" viewBox="0 0 196 65" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M40.6279 1.04968V57.2083H29.9163V50.9818C27.1012 52.5802 23.8806 53.4867 20.2782 53.4867C9.04169 53.4867 0 44.3734 0 33.1369C0 21.9004 9.04169 12.8587 20.2782 12.8587C23.8806 12.8587 27.0774 13.7653 29.9163 15.3637V1.04968H40.6279ZM10.7117 33.2085C10.7117 38.5285 14.9581 42.775 20.2782 42.775C25.5982 42.775 29.9163 38.5285 29.9163 33.2085C29.9163 27.8885 25.6221 23.5704 20.2782 23.5704C14.9343 23.5704 10.7117 27.8646 10.7117 33.2085Z" fill="white"/>
<path d="M82.5919 10.6639L90.1067 18.1788L72.9776 35.3079V62.6H62.3137V35.3079L45.1846 18.1788L52.6994 10.6639L67.6576 25.6937L82.6157 10.6639H82.5919Z" fill="white"/>
<path d="M115.276 10.6639C109.813 10.6639 105.638 14.648 105.638 19.7772V44.4212C105.638 55.6577 96.1904 64.1984 85.2878 64.1984H83.6895V53.5344H85.2878C90.751 53.5344 94.926 49.5504 94.926 44.4212V19.7772C94.926 8.5407 104.373 0 115.276 0H116.874V10.6639H115.276Z" fill="white"/>
<path d="M135.554 23.5704C130.234 23.5704 125.987 27.8646 125.987 33.2085C125.987 38.5524 130.234 42.775 135.554 42.775C138.178 42.775 140.444 41.8207 142.496 39.8884L149.868 47.6656C146.408 51.1248 141.136 53.5105 135.554 53.5105C124.317 53.5105 115.275 44.3973 115.275 33.1608C115.275 21.9243 124.317 12.8826 135.554 12.8826C141.136 12.8826 145.764 14.9342 149.868 18.7275L142.496 26.5047C140.373 24.5724 138.202 23.6181 135.554 23.6181V23.5704Z" fill="white"/>
<path d="M195.649 33.2085C195.649 44.445 186.536 53.4867 175.299 53.4867C164.063 53.4867 155.021 44.445 155.021 33.2085C155.021 21.972 164.063 12.8588 175.299 12.8588C186.536 12.8588 195.649 21.972 195.649 33.2085ZM165.733 33.2085C165.733 38.5286 169.979 42.7751 175.299 42.7751C180.619 42.7751 184.937 38.5286 184.937 33.2085C184.937 27.8885 180.643 23.5704 175.299 23.5704C169.955 23.5704 165.733 27.8646 165.733 33.2085Z" fill="white"/>
</svg>`}
              width={CIRCLE_SIZE * 0.675}
              height={CIRCLE_SIZE * 0.675 * (65/196)}
            />
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
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Image
                source={require('../../assets/customer.png')}
                style={styles.cardImage}
                resizeMode="contain"
              />
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
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Image
                source={require('../../assets/business.png')}
                style={styles.cardImage}
                resizeMode="contain"
              />
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
  circularVideo: {
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
    textAlign: 'left',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'left',
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
    // Removed colored border
  },
  merchantCard: {
    // Removed colored border
  },
  cardIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardImage: {
    width: 64,
    height: 64,
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
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
}); 