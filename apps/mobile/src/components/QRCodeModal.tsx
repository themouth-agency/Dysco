import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  redemptionToken: string;
  couponName: string;
  discountInfo: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  onClose,
  redemptionToken,
  couponName,
  discountInfo,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎫 Redeem Coupon</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.couponInfo}>
            <Text style={styles.couponName}>{couponName}</Text>
            <Text style={styles.discountInfo}>{discountInfo}</Text>
          </View>

          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={redemptionToken}
                size={250}
                color="#000"
                backgroundColor="#fff"
                logoSize={30}
                logoMargin={2}
                logoBorderRadius={15}
              />
            </View>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionTitle}>📱 Show this QR code to the merchant</Text>
            <Text style={styles.instructionText}>
              • Ask the merchant to scan this QR code{'\n'}
              • The coupon will be redeemed automatically{'\n'}
              • This QR code expires in 5 minutes
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => Alert.alert(
              'ℹ️ Help',
              'Show this QR code to the merchant at checkout. They will scan it with their Dysco merchant app to redeem your coupon.',
              [{ text: 'OK' }]
            )}
          >
            <Text style={styles.helpButtonText}>ℹ️ How does this work?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  couponInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  couponName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  discountInfo: {
    fontSize: 18,
    color: '#4ade80',
    fontWeight: '600',
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  instructions: {
    alignItems: 'center',
    marginTop: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 20,
  },
  helpButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignSelf: 'center',
  },
  helpButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '500',
  },
  doneButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#059669',
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});