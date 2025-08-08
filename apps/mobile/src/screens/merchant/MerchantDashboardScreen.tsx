import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantNavigator';

const { height } = Dimensions.get('window');

type MerchantDashboardScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'MerchantDashboard'>;

interface Props {
  navigation: MerchantDashboardScreenNavigationProp;
}

export default function MerchantDashboardScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={['#08090A', '#1E261F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          {/* Dysco Logo with Business */}
          <View style={styles.logoRow}>
            <SvgXml
              xml={`<svg width="196" height="65" viewBox="0 0 196 65" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M40.6279 1.04968V57.2083H29.9163V50.9818C27.1012 52.5802 23.8806 53.4867 20.2782 53.4867C9.04169 53.4867 0 44.3734 0 33.1369C0 21.9004 9.04169 12.8587 20.2782 12.8587C23.8806 12.8587 27.0774 13.7653 29.9163 15.3637V1.04968H40.6279ZM10.7117 33.2085C10.7117 38.5285 14.9581 42.775 20.2782 42.775C25.5982 42.775 29.9163 38.5285 29.9163 33.2085C29.9163 27.8885 25.6221 23.5704 20.2782 23.5704C14.9343 23.5704 10.7117 27.8646 10.7117 33.2085Z" fill="white"/>
<path d="M82.5919 10.6639L90.1067 18.1788L72.9776 35.3079V62.6H62.3137V35.3079L45.1846 18.1788L52.6994 10.6639L67.6576 25.6937L82.6157 10.6639H82.5919Z" fill="white"/>
<path d="M115.276 10.6639C109.813 10.6639 105.638 14.648 105.638 19.7772V44.4212C105.638 55.6577 96.1904 64.1984 85.2878 64.1984H83.6895V53.5344H85.2878C90.751 53.5344 94.926 49.5504 94.926 44.4212V19.7772C94.926 8.5407 104.373 0 115.276 0H116.874V10.6639H115.276Z" fill="white"/>
<path d="M135.554 23.5704C130.234 23.5704 125.987 27.8646 125.987 33.2085C125.987 38.5524 130.234 42.775 135.554 42.775C138.178 42.775 140.444 41.8207 142.496 39.8884L149.868 47.6656C146.408 51.1248 141.136 53.5105 135.554 53.5105C124.317 53.5105 115.275 44.3973 115.275 33.1608C115.275 21.9243 124.317 12.8826 135.554 12.8826C141.136 12.8826 145.764 14.9342 149.868 18.7275L142.496 26.5047C140.373 24.5724 138.202 23.6181 135.554 23.6181V23.5704Z" fill="white"/>
<path d="M195.649 33.2085C195.649 44.445 186.536 53.4867 175.299 53.4867C164.063 53.4867 155.021 44.445 155.021 33.2085C155.021 21.972 164.063 12.8588 175.299 12.8588C186.536 12.8588 195.649 21.972 195.649 33.2085ZM165.733 33.2085C165.733 38.5286 169.979 42.7751 175.299 42.7751C180.619 42.7751 184.937 38.5286 184.937 33.2085C184.937 27.8885 180.643 23.5704 175.299 23.5704C169.955 23.5704 165.733 27.8646 165.733 33.2085Z" fill="white"/>
</svg>`}
              width={80}
              height={80 * (65/196)}
            />
            <Text style={styles.businessText}>Business</Text>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Merchant Dashboard</Text>
            <Text style={styles.subtitle}>Welcome to Dysco Merchant Mode</Text>
          </View>

          {/* Stats in header */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Text style={styles.statNumber}>10</Text>
                <Text style={styles.statIcon}>🎫</Text>
              </View>
              <Text style={styles.statLabel}>Coupons{'\n'}Redeemed Today</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statIcon}>🪙</Text>
              </View>
              <Text style={styles.statLabel}>Revenue{'\n'}Today</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main content */}
      <ScrollView style={styles.mainContent}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CampaignDashboard')}
          >
            <Image source={require('../../../assets/business.png')} style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Manage Campaigns</Text>
              <Text style={styles.actionButtonSubtext}>Create and organize coupon campaigns</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <View style={styles.qrIconContainer}>
              <Text style={styles.qrIcon}>📱</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Scan Coupon</Text>
              <Text style={styles.actionButtonSubtext}>Scan QR code to redeem</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('RedemptionHistory')}
          >
            <View style={styles.qrIconContainer}>
              <Text style={styles.qrIcon}>📝</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Redemption History</Text>
              <Text style={styles.actionButtonSubtext}>View past redemptions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MerchantSettings')}
          >
            <View style={styles.qrIconContainer}>
              <Text style={styles.qrIcon}>⚙️</Text>
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Settings</Text>
              <Text style={styles.actionButtonSubtext}>Configure merchant settings</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: height * 0.45,
    paddingTop: 0,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  businessText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00A90B',
    marginLeft: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    color: '#00A90B',
    textAlign: 'left',
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  qrIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  qrIcon: {
    fontSize: 30,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
}); 