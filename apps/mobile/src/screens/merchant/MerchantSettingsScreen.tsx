import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export default function MerchantSettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Merchant Settings</Text>
        <Text style={styles.subtitle}>Configure your merchant account</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Merchant ID</Text>
          <Text style={styles.settingValue}>merchant-001</Text>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Store Name</Text>
          <Text style={styles.settingValue}>Central Perk Coffee</Text>
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>Hedera Account</Text>
          <Text style={styles.settingValue}>0.0.123456</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <TouchableOpacity style={styles.settingCard}>
          <Text style={styles.settingLabel}>Notification Settings</Text>
          <Text style={styles.settingValue}>Configure</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingCard}>
          <Text style={styles.settingLabel}>Auto-redemption</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingCard}>
          <Text style={styles.settingLabel}>Transaction History</Text>
          <Text style={styles.settingValue}>View all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        
        <TouchableOpacity style={styles.settingCard}>
          <Text style={styles.settingLabel}>Biometric Authentication</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingCard}>
          <Text style={styles.settingLabel}>Change PIN</Text>
          <Text style={styles.settingValue}>Configure</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={[styles.settingCard, styles.dangerCard]}>
          <Text style={[styles.settingLabel, styles.dangerText]}>Logout</Text>
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
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  settingCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  dangerCard: {
    borderBottomColor: '#fecaca',
  },
  dangerText: {
    color: '#dc2626',
  },
}); 