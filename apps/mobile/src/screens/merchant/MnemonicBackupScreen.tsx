import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type MnemonicBackupScreenNavigationProp = StackNavigationProp<any, 'MnemonicBackup'>;

interface Props {
  navigation: MnemonicBackupScreenNavigationProp;
  mnemonic: string;
  onBackupConfirmed: () => void;
}

export default function MnemonicBackupScreen({ navigation, mnemonic, onBackupConfirmed }: Props) {
  const [currentStep, setCurrentStep] = useState<'show' | 'verify'>('show');
  const [userInputs, setUserInputs] = useState<{ [key: number]: string }>({});
  
  const words = mnemonic.split(' ');
  const testPositions = [3, 6, 9]; // Test 3rd, 6th, 9th words
  const testWords = testPositions.map(pos => words[pos - 1]);

  const handleContinue = () => {
    Alert.alert(
      'Important Security Warning',
      'Have you written down your recovery phrase in a secure location?\n\n• Never store it digitally\n• Keep it private and secure\n• You will need it to recover your wallet',
      [
        { text: 'Not Yet', style: 'cancel' },
        { text: 'Yes, I\'ve Secured It', onPress: () => setCurrentStep('verify') }
      ]
    );
  };

  const handleWordInput = (position: number, word: string) => {
    setUserInputs(prev => ({ ...prev, [position]: word.toLowerCase().trim() }));
  };

  const verifyBackup = () => {
    const isCorrect = testPositions.every(pos => 
      userInputs[pos]?.toLowerCase() === words[pos - 1].toLowerCase()
    );

    if (isCorrect) {
      Alert.alert(
        'Backup Verified! 🎉',
        'Your recovery phrase has been successfully verified. Your merchant wallet is now secure.',
        [{ text: 'Continue', onPress: onBackupConfirmed }]
      );
    } else {
      Alert.alert(
        'Verification Failed',
        'Some words don\'t match. Please check your backup and try again.',
        [{ text: 'Try Again', onPress: () => setUserInputs({}) }]
      );
    }
  };

  if (currentStep === 'verify') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Backup</Text>
            <Text style={styles.subtitle}>
              Enter the following words from your recovery phrase to confirm you've backed it up correctly.
            </Text>
          </View>

          <View style={styles.verificationContainer}>
            {testPositions.map((position, index) => (
              <View key={position} style={styles.wordInputContainer}>
                <Text style={styles.wordLabel}>Word #{position}</Text>
                <TextInput
                  style={styles.wordInput}
                  value={userInputs[position] || ''}
                  onChangeText={(text) => handleWordInput(position, text)}
                  placeholder="Enter word"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />
              </View>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={() => setCurrentStep('show')}
            >
              <Text style={styles.secondaryButtonText}>Back to Recovery Phrase</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.primaryButton,
                Object.keys(userInputs).length !== testPositions.length && styles.disabledButton
              ]} 
              onPress={verifyBackup}
              disabled={Object.keys(userInputs).length !== testPositions.length}
            >
              <Text style={styles.primaryButtonText}>Verify Backup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔐 Secure Your Wallet</Text>
          <Text style={styles.subtitle}>
            Your recovery phrase is the master key to your merchant wallet. Write it down and store it securely.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Important Security Notice</Text>
          <Text style={styles.warningText}>
            • Never share this phrase with anyone{'\n'}
            • Store it offline in a secure location{'\n'}
            • Anyone with this phrase can access your wallet{'\n'}
            • Dysco cannot recover lost phrases
          </Text>
        </View>

        <View style={styles.mnemonicContainer}>
          <Text style={styles.mnemonicTitle}>Your Recovery Phrase</Text>
          <View style={styles.mnemonicGrid}>
            {words.map((word, index) => (
              <View key={index} style={styles.wordContainer}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
                <Text style={styles.word}>{word}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📝 How to Store Safely</Text>
          <Text style={styles.instructionsText}>
            1. Write the words on paper in order{'\n'}
            2. Store in a secure, fireproof location{'\n'}
            3. Consider making multiple copies{'\n'}
            4. Never store digitally or take screenshots
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>I've Secured My Recovery Phrase</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
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
  warningBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  mnemonicContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mnemonicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  mnemonicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordContainer: {
    width: '30%',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  wordNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  word: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  instructionsBox: {
    backgroundColor: '#f0f9ff',
    borderColor: '#7dd3fc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
  verificationContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  wordInputContainer: {
    marginBottom: 16,
  },
  wordLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  wordInput: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    fontSize: 16,
    color: '#111827',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#059669',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
}); 