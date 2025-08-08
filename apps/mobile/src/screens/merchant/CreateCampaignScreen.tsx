import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MerchantStackParamList } from '../../navigation/MerchantAuthNavigator';
import { supabaseAuthService } from '../../services/supabaseAuth';
import { API_BASE_URL } from '../../config/api';

type CreateCampaignScreenNavigationProp = StackNavigationProp<MerchantStackParamList, 'CreateCampaign'>;

interface Props {
  navigation: CreateCampaignScreenNavigationProp;
}

interface CampaignForm {
  name: string;
  description: string;
  campaignType: 'qr_redeem' | 'discount_code';
  discountType: 'percentage' | 'fixed_amount' | 'free_item';
  discountValue: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  maxRedemptionsPerUser: string;
  totalLimit: string;
  isDiscoverable: boolean;
}

export default function CreateCampaignScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CampaignForm>({
    name: '',
    description: '',
    campaignType: 'qr_redeem',
    discountType: 'percentage',
    discountValue: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: '',
    imageUrl: '',
    maxRedemptionsPerUser: '1',
    totalLimit: '',
    isDiscoverable: true,
  });

  const updateForm = (field: keyof CampaignForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    // Validation
    if (!form.name.trim()) {
      Alert.alert('Error', 'Campaign name is required');
      return;
    }

    if (!form.discountValue.trim()) {
      Alert.alert('Error', 'Discount value is required');
      return;
    }

    if (!form.endDate) {
      Alert.alert('Error', 'End date is required');
      return;
    }

    // Validate dates
    const startDate = new Date(form.startDate);
    const endDate = new Date(form.endDate);
    
    if (endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    // Validate discount value
    const discountValue = parseFloat(form.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      Alert.alert('Error', 'Discount value must be a positive number');
      return;
    }

    if (form.discountType === 'percentage' && discountValue > 100) {
      Alert.alert('Error', 'Percentage discount cannot exceed 100%');
      return;
    }

    setLoading(true);

    try {
      const user = await supabaseAuthService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in first');
        return;
      }

      const campaignData = {
        name: form.name.trim(),
        description: form.description.trim(),
        campaignType: form.campaignType,
        discountType: form.discountType,
        discountValue: discountValue,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        imageUrl: form.imageUrl.trim() || null,
        maxRedemptionsPerUser: parseInt(form.maxRedemptionsPerUser) || 1,
        totalLimit: form.totalLimit.trim() ? parseInt(form.totalLimit) : null,
        isDiscoverable: form.isDiscoverable,
      };

      const response = await fetch(`${API_BASE_URL}/api/merchants/${user.id}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success!',
          'Campaign created successfully. You can now mint coupons for this campaign.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      Alert.alert('Error', 'Failed to create campaign. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setForm({
      name: 'Summer Sale 2024',
      description: 'Get amazing discounts on all summer items',
      campaignType: 'qr_redeem',
      discountType: 'percentage',
      discountValue: '20',
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      imageUrl: 'https://example.com/summer-sale.jpg',
      maxRedemptionsPerUser: '1',
      totalLimit: '100',
      isDiscoverable: true,
    });
  };

  // Pass the fillSampleData function to navigation params
  useEffect(() => {
    navigation.setParams({ fillSampleData });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Campaign Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(value) => updateForm('name', value)}
              placeholder="e.g., Summer Sale 2024"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(value) => updateForm('description', value)}
              placeholder="Tell customers about this campaign..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaign Type</Text>
          
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                form.campaignType === 'qr_redeem' && styles.typeButtonActive
              ]}
              onPress={() => updateForm('campaignType', 'qr_redeem')}
            >
              <Text style={[
                styles.typeButtonText,
                form.campaignType === 'qr_redeem' && styles.typeButtonTextActive
              ]}>
                QR Code Redeem
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                form.campaignType === 'discount_code' && styles.typeButtonActive
              ]}
              onPress={() => updateForm('campaignType', 'discount_code')}
            >
              <Text style={[
                styles.typeButtonText,
                form.campaignType === 'discount_code' && styles.typeButtonTextActive
              ]}>
                Discount Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discount Details</Text>
          
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.discountTypeButton,
                form.discountType === 'percentage' && styles.typeButtonActive
              ]}
              onPress={() => updateForm('discountType', 'percentage')}
            >
              <Text style={[
                styles.typeButtonText,
                form.discountType === 'percentage' && styles.typeButtonTextActive
              ]}>
                % Off
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.discountTypeButton,
                form.discountType === 'fixed_amount' && styles.typeButtonActive
              ]}
              onPress={() => updateForm('discountType', 'fixed_amount')}
            >
              <Text style={[
                styles.typeButtonText,
                form.discountType === 'fixed_amount' && styles.typeButtonTextActive
              ]}>
                $ Off
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.discountTypeButton,
                form.discountType === 'free_item' && styles.typeButtonActive
              ]}
              onPress={() => updateForm('discountType', 'free_item')}
            >
              <Text style={[
                styles.typeButtonText,
                form.discountType === 'free_item' && styles.typeButtonTextActive
              ]}>
                Free Item
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Discount Value * {form.discountType === 'percentage' ? '(%)' : form.discountType === 'fixed_amount' ? '($)' : ''}
            </Text>
            <TextInput
              style={styles.input}
              value={form.discountValue}
              onChangeText={(value) => updateForm('discountValue', value)}
              placeholder={form.discountType === 'percentage' ? '20' : form.discountType === 'fixed_amount' ? '5.00' : '1'}
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaign Duration</Text>
          
          <View style={styles.dateRow}>
            <View style={styles.dateGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <TextInput
                style={styles.input}
                value={form.startDate}
                onChangeText={(value) => updateForm('startDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.dateGroup}>
              <Text style={styles.label}>End Date *</Text>
              <TextInput
                style={styles.input}
                value={form.endDate}
                onChangeText={(value) => updateForm('endDate', value)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Limits & Settings</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Redemptions Per User</Text>
            <TextInput
              style={styles.input}
              value={form.maxRedemptionsPerUser}
              onChangeText={(value) => updateForm('maxRedemptionsPerUser', value)}
              placeholder="1"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Campaign Limit (Optional)</Text>
            <TextInput
              style={styles.input}
              value={form.totalLimit}
              onChangeText={(value) => updateForm('totalLimit', value)}
              placeholder="Leave empty for unlimited"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL (Optional)</Text>
            <TextInput
              style={styles.input}
              value={form.imageUrl}
              onChangeText={(value) => updateForm('imageUrl', value)}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.toggleGroup}>
            <View style={styles.toggleContent}>
              <Text style={styles.label}>Make Discoverable</Text>
              <Text style={styles.toggleDescription}>
                When enabled, this campaign will appear in users' "Discover Campaigns" screen
              </Text>
            </View>
            <Switch
              value={form.isDiscoverable}
              onValueChange={(value) => setForm(prev => ({ ...prev, isDiscoverable: value }))}
              trackColor={{ false: '#e5e5e5', true: '#34d399' }}
              thumbColor={form.isDiscoverable ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#024E44',
    borderColor: '#024E44',
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateGroup: {
    flex: 1,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#024E44',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 32,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
});