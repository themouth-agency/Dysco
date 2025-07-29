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
import { cryptoWalletService } from '../../services/cryptoWallet';

type MerchantRecoveryScreenNavigationProp = StackNavigationProp<any, 'MerchantRecovery'>;

interface Props {
  navigation: MerchantRecoveryScreenNavigationProp;
  onRecoverySuccess: () => void;
}

export default function MerchantRecoveryScreen({ navigation, onRecoverySuccess }: Props) {
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(new Array(12).fill(''));
  const [isLoading, setIsLoading] = useState(false);

  const handleWordChange = (index: number, word: string) => {
    const newWords = [...mnemonicWords];
    newWords[index] = word.toLowerCase().trim();
    setMnemonicWords(newWords);
  };

  const handleRecovery = async () => {
    const mnemonic = mnemonicWords.join(' ').trim();
    
    if (mnemonicWords.some(word => !word.trim())) {
      Alert.alert('Error', 'Please enter all 12 words of your recovery phrase');
      return;
    }

    setIsLoading(true);
    try {
      // Validate and restore wallet from mnemonic
      const wallet = await cryptoWalletService.restoreWalletFromMnemonic(mnemonic);
      
      // Check if this merchant exists on the backend
      const API_BASE_URL = 'http://192.168.0.162:3001';
      const response = await fetch(`${API_BASE_URL}/api/merchants/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: wallet.publicKey
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'No merchant account found for this recovery phrase');
      }

      const merchant = result.merchant;

      // Update wallet with backend data
      wallet.address = merchant.hederaAccountId;

      // Store wallet securely
      await cryptoWalletService.storeWallet(wallet);
      
      // Store merchant data
      await cryptoWalletService.storeMerchantWallet(wallet.privateKey, {
        merchantId: merchant.id,
        name: merchant.name,
        email: merchant.email,
        hederaAccountId: merchant.hederaAccountId,
        hederaPublicKey: wallet.publicKey,
        nftCollectionId: merchant.nftCollectionId,
        businessType: merchant.businessType,
        onboardingStatus: merchant.onboardingStatus,
        createdAt: merchant.createdAt,
      });

      Alert.alert(
        'Recovery Successful! 🎉',
        `Welcome back ${merchant.name}!\n\nYour merchant wallet has been restored successfully.`,
        [
          {
            text: 'Continue',
            onPress: onRecoverySuccess
          }
        ]
      );

    } catch (error) {
      console.error('Recovery error:', error);
      Alert.alert(
        'Recovery Failed',
        error instanceof Error ? error.message : 'Failed to recover wallet. Please check your recovery phrase and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePastePhrase = () => {
    Alert.prompt(
      'Paste Recovery Phrase',
      'Paste your 12-word recovery phrase (separated by spaces):',
      (text) => {
        if (text) {
          const words = text.toLowerCase().trim().split(/\s+/);
          if (words.length === 12) {
            setMnemonicWords(words);
          } else {
            Alert.alert('Error', 'Please enter exactly 12 words');
          }
        }
      },
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>🔐 Recover Your Wallet</Text>
          <Text style={styles.subtitle}>
            Enter your 12-word recovery phrase to restore your merchant wallet and regain access to your account.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>🔒 Security Notice</Text>
          <Text style={styles.warningText}>
            Your recovery phrase is sensitive information. Make sure you're in a private location and no one can see your screen.
          </Text>
        </View>

        <View style={styles.mnemonicContainer}>
          <View style={styles.mnemonicHeader}>
            <Text style={styles.mnemonicTitle}>Enter Recovery Phrase</Text>
            <TouchableOpacity style={styles.pasteButton} onPress={handlePastePhrase}>
              <Text style={styles.pasteButtonText}>Paste Phrase</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mnemonicGrid}>
            {mnemonicWords.map((word, index) => (
              <View key={index} style={styles.wordInputContainer}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
                <TextInput
                  style={styles.wordInput}
                  value={word}
                  onChangeText={(text) => handleWordChange(index, text)}
                  placeholder="word"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>💡 Recovery Tips</Text>
          <Text style={styles.instructionsText}>
            • Enter words in the exact order they were given{'\n'}
            • Check for typos - each word must be spelled correctly{'\n'}
            • Words should be lowercase{'\n'}
            • Use the "Paste Phrase" button if you have it copied
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              styles.primaryButton,
              (isLoading || mnemonicWords.some(word => !word.trim())) && styles.disabledButton
            ]} 
            onPress={handleRecovery}
            disabled={isLoading || mnemonicWords.some(word => !word.trim())}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Recovering...' : 'Recover Wallet'}
            </Text>
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
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
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
  mnemonicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mnemonicTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  pasteButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pasteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  mnemonicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wordInputContainer: {
    width: '30%',
    marginBottom: 12,
    alignItems: 'center',
  },
  wordNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  wordInput: {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#111827',
    width: '100%',
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
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