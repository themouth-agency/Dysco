import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

// Tab Navigator
import UserTabNavigator from './UserTabNavigator';

// Modal/Overlay Screens
import CouponDetailScreen from '../screens/CouponDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import ClaimCouponScreen from '../screens/ClaimCouponScreen';
import UserRedemptionHistoryScreen from '../screens/UserRedemptionHistoryScreen';
import MnemonicBackupScreen from '../screens/MnemonicBackupScreen';
import MnemonicVerificationScreen from '../screens/MnemonicVerificationScreen';
import DiscountCodesScreen from '../screens/DiscountCodesScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface UserNavigatorProps {
  onLogout?: () => void;
}

export const UserNavigator: React.FC<UserNavigatorProps> = ({ onLogout }) => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main tab navigation */}
      <Stack.Screen
        name="MainTabs"
        component={UserTabNavigator}
      />
      
      {/* Modal/overlay screens */}
      <Stack.Screen
        name="CouponDetail"
        component={CouponDetailScreen}
        options={{ 
          title: 'Coupon Details',
          headerShown: true,
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ 
          title: 'Wallet',
          headerShown: true,
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
          headerRight: () => onLogout ? (
            <TouchableOpacity 
              onPress={onLogout}
              style={{ marginRight: 15 }}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>Switch Role</Text>
            </TouchableOpacity>
          ) : null
        }}
      />
      <Stack.Screen
        name="ClaimCoupon"
        component={ClaimCouponScreen}
        options={{ 
          title: 'Claim Coupon',
          headerShown: true,
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="UserRedemptionHistory"
        component={UserRedemptionHistoryScreen}
        options={{ 
          title: 'Redemption History',
          headerShown: true,
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="MnemonicBackup"
        component={MnemonicBackupScreen}
        options={{ 
          title: 'Backup Wallet',
          headerShown: true,
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
          headerLeft: () => null, // Prevent going back
          gestureEnabled: false
        }}
      />
      <Stack.Screen
        name="MnemonicVerification"
        component={MnemonicVerificationScreen}
        options={{ 
          title: 'Verify Recovery Phrase',
          headerShown: true,
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
          headerLeft: () => null, // Prevent going back during verification
          gestureEnabled: false
        }}
      />
      <Stack.Screen
        name="DiscountCodes"
        component={DiscountCodesScreen}
        options={{ 
          title: 'My Discount Codes',
          headerShown: true,
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}; 