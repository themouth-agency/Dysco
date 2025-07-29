import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';

export default function RedemptionHistoryScreen() {
  const mockRedemptions = [
    {
      id: '1',
      couponName: '20% Off Coffee',
      customerId: '0.0.123456',
      amount: '$4.00',
      timestamp: '2025-07-25 10:30 AM',
      status: 'completed',
    },
    {
      id: '2',
      couponName: 'Free Pizza Slice',
      customerId: '0.0.789012',
      amount: '$8.00',
      timestamp: '2025-07-25 09:15 AM',
      status: 'completed',
    },
  ];

  const renderRedemption = ({ item }: { item: any }) => (
    <View style={styles.redemptionCard}>
      <View style={styles.redemptionHeader}>
        <Text style={styles.couponName}>{item.couponName}</Text>
        <Text style={styles.amount}>{item.amount}</Text>
      </View>
      <Text style={styles.customerId}>Customer: {item.customerId}</Text>
      <Text style={styles.timestamp}>{item.timestamp}</Text>
      <View style={styles.statusContainer}>
        <Text style={[styles.status, styles.statusCompleted]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Redemption History</Text>
        <Text style={styles.subtitle}>Today's redemptions</Text>
      </View>

      <FlatList
        data={mockRedemptions}
        renderItem={renderRedemption}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No redemptions today</Text>
          </View>
        }
      />
    </View>
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
  listContainer: {
    padding: 16,
  },
  redemptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  customerId: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
}); 