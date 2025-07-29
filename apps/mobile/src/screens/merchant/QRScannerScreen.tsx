import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantNavigator';

type QRScannerScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'QRScanner'>;

interface Props {
  navigation: QRScannerScreenNavigationProp;
}

export default function QRScannerScreen({ navigation }: Props) {
  const handleScanQR = () => {
    // TODO: Implement actual QR scanning
    Alert.alert(
      'QR Scanner',
      'QR scanning functionality coming soon!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.scannerContainer}>
        <View style={styles.scannerFrame}>
          <Text style={styles.scannerText}>QR Scanner</Text>
          <Text style={styles.scannerSubtext}>
            Point camera at coupon QR code
          </Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanQR}
        >
          <Text style={styles.scanButtonText}>Start Scanning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  scannerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scannerSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  controlsContainer: {
    padding: 20,
    backgroundColor: '#000',
  },
  scanButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
}); 