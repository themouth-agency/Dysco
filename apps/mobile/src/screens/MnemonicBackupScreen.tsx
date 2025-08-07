import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,

} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type MnemonicBackupNavigationProp = StackNavigationProp<RootStackParamList, 'MnemonicBackup'>;

interface Props {
  navigation: MnemonicBackupNavigationProp;
  route: {
    params: {
      mnemonic: string;
      privateKey: string;
      publicKey: string;
    };
  };
}

export default function MnemonicBackupScreen({ navigation, route }: Props) {
  const { mnemonic, privateKey, publicKey } = route.params;
  const [hasWrittenDown, setHasWrittenDown] = useState(false);

  const words = mnemonic.split(' ');

  const handleCopyToClipboard = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('Copied!', 'Mnemonic phrase copied to clipboard');
  };

  const handleContinue = () => {
    if (!hasWrittenDown) {
      Alert.alert(
        'Security Warning',
        'Please confirm that you have written down your mnemonic phrase. You will need it to recover your wallet if you lose access to this device.',
        [
          { text: 'Go Back', style: 'cancel' },
          { 
            text: 'I Have Written It Down', 
            onPress: () => {
              setHasWrittenDown(true);
              proceedToVerification();
            }
          }
        ]
      );
      return;
    }
    
    proceedToVerification();
  };

  const proceedToVerification = () => {
    navigation.navigate('MnemonicVerification', {
      mnemonic,
      privateKey,
      publicKey,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Backup Your Wallet</Text>
        <Text style={styles.subtitle}>
          Write down these 12 words in the exact order shown. This is your recovery phrase.
        </Text>
      </View>

      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>⚠️ IMPORTANT</Text>
        <Text style={styles.warningText}>
          • Store this phrase safely offline{'\n'}
          • Never share it with anyone{'\n'}
          • You'll lose access to your wallet without it{'\n'}
          • Dysco cannot recover this for you
        </Text>
      </View>

      <View style={styles.mnemonicContainer}>
        <Text style={styles.mnemonicTitle}>Your Recovery Phrase:</Text>
        <View style={styles.wordsGrid}>
          {words.map((word, index) => (
            <View key={index} style={styles.wordContainer}>
              <Text style={styles.wordNumber}>{index + 1}</Text>
              <Text style={styles.wordText}>{word}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.copyButton} onPress={handleCopyToClipboard}>
        <Text style={styles.copyButtonText}>📋 Copy to Clipboard</Text>
      </TouchableOpacity>

      <View style={styles.confirmationContainer}>
        <TouchableOpacity
          style={[styles.checkbox, hasWrittenDown && styles.checkboxChecked]}
          onPress={() => setHasWrittenDown(!hasWrittenDown)}
        >
          <Text style={styles.checkboxText}>
            {hasWrittenDown ? '✓' : ''}
          </Text>
        </TouchableOpacity>
        <Text style={styles.confirmationText}>
          I have written down my recovery phrase and stored it safely
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, hasWrittenDown && styles.continueButtonEnabled]}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  warningCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  mnemonicContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mnemonicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordContainer: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wordNumber: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
    minWidth: 20,
  },
  wordText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
    marginLeft: 8,
  },
  copyButton: {
    margin: 20,
    marginTop: 10,
    padding: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  confirmationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: 10,
    padding: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  checkboxText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  continueButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#d1d5db',
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonEnabled: {
    backgroundColor: '#2563eb',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});