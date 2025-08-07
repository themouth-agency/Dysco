import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { cryptoWalletService } from '../services/cryptoWallet';
import { userWalletService } from '../services/userWallet';

type MnemonicVerificationNavigationProp = StackNavigationProp<RootStackParamList, 'MnemonicVerification'>;

interface Props {
  navigation: MnemonicVerificationNavigationProp;
  route: {
    params: {
      mnemonic: string;
      privateKey: string;
      publicKey: string;
    };
  };
}

export default function MnemonicVerificationScreen({ navigation, route }: Props) {
  const { mnemonic, privateKey, publicKey } = route.params;
  const [testWords, setTestWords] = useState<{ positions: number[]; words: string[] }>({ positions: [], words: [] });
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  useEffect(() => {
    // Get test words from the mnemonic
    const testData = cryptoWalletService.getTestWords(mnemonic);
    setTestWords(testData);
    setSelectedAnswers(new Array(testData.positions.length).fill(''));
    
    // Generate shuffled options for the first question
    generateShuffledOptions(0, testData);
  }, [mnemonic]);

  const generateShuffledOptions = (questionIndex: number, testData: { positions: number[]; words: string[] }) => {
    const allWords = mnemonic.split(' ');
    const correctWord = testData.words[questionIndex];
    
    console.log('🔍 Verification Debug:', {
      questionIndex,
      position: testData.positions[questionIndex],
      correctWord,
      allWords: allWords.slice(0, 5) + '...' // Show first 5 words for debugging
    });
    
    // Get 3 random incorrect words from other positions
    const incorrectWords = [];
    const usedWords = new Set([correctWord]);
    
    while (incorrectWords.length < 3 && incorrectWords.length < allWords.length - 1) {
      const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
      if (!usedWords.has(randomWord)) {
        incorrectWords.push(randomWord);
        usedWords.add(randomWord);
      }
    }
    
    // Combine and shuffle
    const options = [correctWord, ...incorrectWords].sort(() => Math.random() - 0.5);
    setShuffledOptions(options);
    
    console.log('✅ Generated options:', options, 'Correct:', correctWord);
  };

  const handleAnswerSelect = (word: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = word;
    setSelectedAnswers(newAnswers);

    // Move to next question or finish
    if (currentQuestionIndex < testWords.positions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      generateShuffledOptions(nextIndex, testWords);
    } else {
      // All questions answered, check results
      checkAnswers(newAnswers);
    }
  };

  const checkAnswers = (answers: string[]) => {
    const correct = answers.every((answer, index) => answer === testWords.words[index]);
    
    if (correct) {
      handleSuccess();
    } else {
      Alert.alert(
        'Verification Failed',
        'Some words were incorrect. Please try again carefully.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setCurrentQuestionIndex(0);
              setSelectedAnswers(new Array(testWords.positions.length).fill(''));
              generateShuffledOptions(0, testWords);
            }
          },
          {
            text: 'Go Back to Phrase',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const handleSuccess = async () => {
    setIsCreatingWallet(true);
    try {
      console.log('✅ Mnemonic verified successfully, creating user wallet...');
      
      // Create Hedera account on backend
      const { API_BASE_URL } = await import('../config/api');
      const response = await fetch(`${API_BASE_URL}/api/users/create-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: publicKey,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Hedera account');
      }

      console.log('✅ Hedera account created:', data.accountId);

      // Store user wallet locally with account ID
      await userWalletService.storeUserCredentials(
        mnemonic,
        privateKey,
        publicKey,
        {
          hederaAccountId: data.accountId,
          balance: 1, // Initial balance
          createdAt: new Date().toISOString(),
        }
      );

      console.log('✅ User wallet stored successfully');

      Alert.alert(
        'Wallet Created! 🎉',
        `Your Hedera wallet has been created successfully!\n\nAccount ID: ${data.accountId}`,
        [
          {
            text: 'Start Using Dysco',
            onPress: () => {
              // Navigate back to main app
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert(
        'Account Creation Failed',
        'Failed to create your Hedera account. Please try again.',
        [
          { text: 'Retry', onPress: handleSuccess },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsCreatingWallet(false);
    }
  };

  if (isCreatingWallet) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingTitle}>Creating Your Hedera Wallet...</Text>
        <Text style={styles.loadingSubtitle}>This may take a few moments</Text>
      </View>
    );
  }

  if (testWords.positions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingTitle}>Preparing Verification...</Text>
      </View>
    );
  }

  const currentPosition = testWords.positions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testWords.positions.length) * 100;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Verify Your Recovery Phrase</Text>
        <Text style={styles.subtitle}>
          Select the correct word for each position to verify you've saved your recovery phrase properly.
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {testWords.positions.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionTitle}>
          What is word #{currentPosition + 1}?
        </Text>
        
        <View style={styles.optionsContainer}>
          {shuffledOptions.map((word, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleAnswerSelect(word)}
            >
              <Text style={styles.optionText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          💡 Tip: If you're not sure, go back and review your recovery phrase again.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
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
  progressContainer: {
    margin: 20,
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  progressText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  questionContainer: {
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
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    padding: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  hintContainer: {
    margin: 20,
    marginTop: 10,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  hintText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
  },
});