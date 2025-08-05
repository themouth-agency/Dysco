import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantNavigator';

type CreateCouponScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'CreateCoupon'>;

interface Props {
  navigation: CreateCouponScreenNavigationProp;
}

interface CouponFormData {
  name: string;
  description: string;
  value: string;
  category: string;
  validUntil: string;
  imageUrl: string;
}

export default function CreateCouponScreen({ navigation }: Props) {
  const [formData, setFormData] = useState<CouponFormData>({
    name: '',
    description: '',
    value: '',
    category: '',
    validUntil: '',
    imageUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof CouponFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Coupon name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }
    if (!formData.value.trim()) {
      Alert.alert('Error', 'Value is required');
      return false;
    }
    if (!formData.category.trim()) {
      Alert.alert('Error', 'Category is required');
      return false;
    }
    if (!formData.validUntil.trim()) {
      Alert.alert('Error', 'Valid until date is required');
      return false;
    }
    return true;
  };

  const handleCreateCoupon = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Import new merchant service
      const { merchantService } = await import('../../services/merchantService');
      
      // Check if merchant is authenticated
      const isAuthenticated = await merchantService.isAuthenticated();
      if (!isAuthenticated) {
        Alert.alert('Error', 'Merchant not authenticated. Please login first.');
        return;
      }

      // Create coupon mint request (backend will handle signing)
      const result = await merchantService.createCouponMintRequest({
        name: formData.name,
        description: formData.description,
        value: formData.value,
        category: formData.category,
        validUntil: formData.validUntil,
        imageUrl: formData.imageUrl,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create request');
      }

      // Send request to backend
      const API_BASE_URL = 'http://192.168.0.49:3001';
      const response = await fetch(`${API_BASE_URL}/api/merchants/mint-coupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result.request),
      });

      const responseData = await response.json();

      if (responseData.success) {
        Alert.alert(
          'Success!', 
          `Coupon NFT created successfully!\n\nNFT ID: ${responseData.nftId}\nTransaction: ${responseData.transactionId}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        throw new Error(responseData.error || 'Backend rejected the request');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to create coupon: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error creating coupon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillSampleData = () => {
    setFormData({
      name: '20% Off Coffee',
      description: 'Get 20% off any coffee beverage',
      value: '$4.00',
      category: 'Food & Beverage',
      validUntil: '2025-12-31',
      imageUrl: 'https://via.placeholder.com/400x300/8B4513/FFFFFF?text=Coffee+20%25+OFF',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Coupon</Text>
        <Text style={styles.subtitle}>Fill in the details for your coupon</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Coupon Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="e.g., 20% Off Coffee"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe your coupon offer..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Value *</Text>
          <TextInput
            style={styles.input}
            value={formData.value}
            onChangeText={(value) => handleInputChange('value', value)}
            placeholder="e.g., $10.00 or 20%"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(value) => handleInputChange('category', value)}
            placeholder="e.g., Food & Beverage"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Valid Until *</Text>
          <TextInput
            style={styles.input}
            value={formData.validUntil}
            onChangeText={(value) => handleInputChange('validUntil', value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Image URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.imageUrl}
            onChangeText={(value) => handleInputChange('imageUrl', value)}
            placeholder="https://example.com/coupon-image.jpg"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity
          style={styles.sampleButton}
          onPress={fillSampleData}
        >
          <Text style={styles.sampleButtonText}>Fill Sample Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateCoupon}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Coupon</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#d1fae5',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sampleButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  sampleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
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