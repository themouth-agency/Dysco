import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MerchantStackParamList } from '../../navigation/MerchantAuthNavigator';

type QRScannerScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'QRScanner'>;

interface Props {
  navigation: QRScannerScreenNavigationProp;
}

export default function QRScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setIsScanning(false);

    try {
      // First try to verify as a secure redemption token (base64 string)
      await verifyAndRedeemToken(data);
    } catch (error) {
      // If that fails, try the old JSON format for backwards compatibility
      try {
        const qrData = JSON.parse(data);
        
        if (qrData.type === 'coupon_redemption' && qrData.nftId && qrData.userAccountId) {
          Alert.alert(
            'Coupon Scanned!',
            `NFT ID: ${qrData.nftId}\nUser: ${qrData.userAccountId}\n\nRedeem this coupon?`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  setScanned(false);
                  setIsScanning(true);
                }
              },
              {
                text: 'Redeem',
                onPress: () => redeemCoupon(qrData)
              }
            ]
          );
        } else {
          throw new Error('Invalid QR code format');
        }
      } catch (parseError) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not a valid Dysco coupon redemption code.',
          [
            {
              text: 'Scan Again',
              onPress: () => {
                setScanned(false);
                setIsScanning(true);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    }
  };

  const verifyAndRedeemToken = async (redemptionToken: string) => {
    const API_BASE_URL = 'http://192.168.0.49:3001';
    
    try {
      // First verify the token
      const verifyResponse = await fetch(`${API_BASE_URL}/api/coupons/verify-redemption-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          redemptionToken,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Invalid redemption token');
      }

      const couponData = verifyResult.couponData;

      // Show confirmation dialog with coupon details
      Alert.alert(
        '🎫 Valid Coupon!',
        `Coupon: ${couponData.name}\nValue: ${couponData.value}\nUser: ${couponData.userAccountId}\n\nRedeem this coupon now?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setScanned(false);
              setIsScanning(true);
            }
          },
          {
            text: 'Redeem Now',
            onPress: async () => {
              try {
                // Call the redeem endpoint which will wipe the NFT
                const redeemResponse = await fetch(`${API_BASE_URL}/api/coupons/redeem`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    nftId: couponData.nftId,
                    userAccountId: couponData.userAccountId,
                    merchantScan: true,
                    scannedAt: new Date().toISOString()
                  }),
                });

                const redeemResult = await redeemResponse.json();

                if (redeemResult.success) {
                  Alert.alert(
                    '✅ Coupon Redeemed!',
                    `Successfully redeemed "${couponData.name}"\n\nTransaction: ${redeemResult.transactionId}`,
                    [
                      {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                      }
                    ]
                  );
                } else {
                  // Handle specific error codes
                  if (redeemResult.code === 'NFT_NOT_OWNED') {
                    throw new Error('This coupon has been transferred to another account and can no longer be redeemed by this user.');
                  } else if (redeemResult.code === 'OWNERSHIP_VERIFICATION_FAILED') {
                    throw new Error('Unable to verify coupon ownership. Please try again.');
                  } else {
                    throw new Error(redeemResult.error || 'Redemption failed');
                  }
                }
              } catch (redeemError) {
                Alert.alert(
                  'Redemption Failed',
                  `Failed to redeem coupon: ${redeemError instanceof Error ? redeemError.message : 'Unknown error'}`,
                  [
                    {
                      text: 'Try Again',
                      onPress: () => {
                        setScanned(false);
                        setIsScanning(true);
                      }
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                      onPress: () => navigation.goBack()
                    }
                  ]
                );
              }
            }
          }
        ]
      );

    } catch (error) {
      throw error; // Re-throw to be caught by handleBarCodeScanned
    }
  };

  const redeemCoupon = async (qrData: any) => {
    try {
      // Call backend to redeem the coupon (burn NFT)
      const API_BASE_URL = 'http://192.168.0.49:3001';
      const response = await fetch(`${API_BASE_URL}/api/coupons/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftId: qrData.nftId,
          userAccountId: qrData.userAccountId,
          merchantScan: true,
          scannedAt: new Date().toISOString()
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Coupon Redeemed!',
          `Successfully redeemed coupon.\nTransaction: ${result.transactionId}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(result.error || 'Redemption failed');
      }
    } catch (error) {
      Alert.alert(
        'Redemption Failed',
        `Failed to redeem coupon: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setIsScanning(true);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanned(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isScanning ? (
        <CameraView
          style={styles.scanner}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              <Text style={styles.scannerText}>Point camera at QR code</Text>
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.scannerContainer}>
          <View style={styles.scannerFrame}>
            <Text style={styles.scannerText}>QR Scanner</Text>
            <Text style={styles.scannerSubtext}>
              Scan coupon QR codes to redeem
            </Text>
          </View>
        </View>
      )}

      <View style={styles.controlsContainer}>
        {!isScanning ? (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScanning}
          >
            <Text style={styles.scanButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => setIsScanning(false)}
          >
            <Text style={styles.stopButtonText}>Stop Scanning</Text>
          </TouchableOpacity>
        )}

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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
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
  stopButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  stopButtonText: {
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
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 