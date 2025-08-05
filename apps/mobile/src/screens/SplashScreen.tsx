import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

interface Props {
  navigation: {
    navigate: () => void;
  };
}

export default function SplashScreen({ navigation }: Props) {
  const handleTap = () => {
    navigation.navigate();
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleTap}
      activeOpacity={0.9}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Circular Video Container */}
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

        {/* Tagline */}
        <Text style={styles.tagline}>COUPONS. FOR REAL.</Text>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 60,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: CIRCLE_SIZE / 2,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  hederaIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  hederaText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});