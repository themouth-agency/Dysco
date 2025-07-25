import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MerchantModeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Merchant Mode</Text>
      <Text style={styles.subtitle}>QR Scanner coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
}); 