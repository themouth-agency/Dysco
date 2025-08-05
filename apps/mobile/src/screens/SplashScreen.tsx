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
import { Video } from 'expo-av';
import { SvgXml } from 'react-native-svg';

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Background Video (ambient lighting effect) - COMMENTED OUT FOR NOW */}
      {/* 
      <View style={styles.ambientContainer}>
        <Video
          source={require('../../assets/dysco_splash.mp4')}
          style={styles.backgroundVideo}
          shouldPlay
          isLooping
          isMuted
          resizeMode="cover"
        />
      </View>
      */}

      {/* Main Content */}
      <View style={styles.content}>
        {/* Circular Video Container */}
        <View style={styles.circleContainer}>
          {/* Circular Video */}
          <Video
            source={require('../../assets/dysco_splash.mp4')}
            style={styles.circularVideo}
            shouldPlay
            isLooping
            isMuted
            resizeMode="cover"
          />
          
          {/* Glass highlight effect */}
          {/* <View style={styles.glassHighlight} /> */}
          
          {/* Dysco Logo Overlay */}
          <View style={styles.logoOverlay}>
            <SvgXml
              xml={`<svg width="245" height="81" viewBox="0 0 196 65" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M40.6279 1.04968V57.2083H29.9163V50.9818C27.1012 52.5802 23.8806 53.4867 20.2782 53.4867C9.04169 53.4867 0 44.3734 0 33.1369C0 21.9004 9.04169 12.8587 20.2782 12.8587C23.8806 12.8587 27.0774 13.7653 29.9163 15.3637V1.04968H40.6279ZM10.7117 33.2085C10.7117 38.5285 14.9581 42.775 20.2782 42.775C25.5982 42.775 29.9163 38.5285 29.9163 33.2085C29.9163 27.8885 25.6221 23.5704 20.2782 23.5704C14.9343 23.5704 10.7117 27.8646 10.7117 33.2085Z" fill="white"/>
<path d="M82.5919 10.6639L90.1067 18.1788L72.9776 35.3079V62.6H62.3137V35.3079L45.1846 18.1788L52.6994 10.6639L67.6576 25.6937L82.6157 10.6639H82.5919Z" fill="white"/>
<path d="M115.276 10.6639C109.813 10.6639 105.638 14.648 105.638 19.7772V44.4212C105.638 55.6577 96.1904 64.1984 85.2878 64.1984H83.6895V53.5344H85.2878C90.751 53.5344 94.926 49.5504 94.926 44.4212V19.7772C94.926 8.5407 104.373 0 115.276 0H116.874V10.6639H115.276Z" fill="white"/>
<path d="M135.554 23.5704C130.234 23.5704 125.987 27.8646 125.987 33.2085C125.987 38.5524 130.234 42.775 135.554 42.775C138.178 42.775 140.444 41.8207 142.496 39.8884L149.868 47.6656C146.408 51.1248 141.136 53.5105 135.554 53.5105C124.317 53.5105 115.275 44.3973 115.275 33.1608C115.275 21.9243 124.317 12.8826 135.554 12.8826C141.136 12.8826 145.764 14.9342 149.868 18.7275L142.496 26.5047C140.373 24.5724 138.202 23.6181 135.554 23.6181V23.5704Z" fill="white"/>
<path d="M195.649 33.2085C195.649 44.445 186.536 53.4867 175.299 53.4867C164.063 53.4867 155.021 44.445 155.021 33.2085C155.021 21.972 164.063 12.8588 175.299 12.8588C186.536 12.8588 195.649 21.972 195.649 33.2085ZM165.733 33.2085C165.733 38.5286 169.979 42.7751 175.299 42.7751C180.619 42.7751 184.937 38.5286 184.937 33.2085C184.937 27.8885 180.643 23.5704 175.299 23.5704C169.955 23.5704 165.733 27.8646 165.733 33.2085Z" fill="white"/>
</svg>`}
              width={CIRCLE_SIZE * 0.625}
              height={CIRCLE_SIZE * 0.625 * (65/196)}
            />
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ambientContainer: {
    position: 'absolute',
    width: CIRCLE_SIZE * 1.1, // Smaller outer circle
    height: CIRCLE_SIZE * 1.1, // Smaller outer circle
    // Perfect center on inner circle
    left: (width - CIRCLE_SIZE * 1.1) / 2,
    top: (height / 2) - (CIRCLE_SIZE * 1.1 / 2) - 30, // Center vertically
    borderRadius: (CIRCLE_SIZE * 1.1) / 2,
    overflow: 'hidden',
    opacity: 0.3, // Very subtle ambient effect
  },
  backgroundVideo: {
    width: '200%', // 2x zoom like inner video
    height: '200%', // 2x zoom like inner video
    position: 'absolute',
    top: '-50%', // Center the zoomed video
    left: '-50%', // Center the zoomed video
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    zIndex: 1,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 60,
    // Glass sphere effect
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    // Add subtle border for glass effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    // Transform for slight 3D perspective
    transform: [{ perspective: 1000 }, { rotateX: '2deg' }],
  },
  circularVideo: {
    width: '200%', // 2x zoom
    height: '200%', // 2x zoom
    position: 'absolute',
    top: '-50%', // Center the zoomed video
    left: '-50%', // Center the zoomed video
  },
  glassHighlight: {
    position: 'absolute',
    top: CIRCLE_SIZE * 0.1,
    left: CIRCLE_SIZE * 0.15,
    width: CIRCLE_SIZE * 0.4,
    height: CIRCLE_SIZE * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: CIRCLE_SIZE * 0.2,
    transform: [{ rotate: '-20deg' }],
    // Subtle blur effect for glass highlight
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
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
    color: '#333333',
    letterSpacing: 3,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
    zIndex: 1,
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
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});