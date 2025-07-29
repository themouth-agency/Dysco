import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

// User Mode Screens
import HomeScreen from '../screens/HomeScreen';
import CouponDetailScreen from '../screens/CouponDetailScreen';
import MyCouponsScreen from '../screens/MyCouponsScreen';
import WalletScreen from '../screens/WalletScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface UserNavigatorProps {
  onLogout?: () => void;
}

export const UserNavigator: React.FC<UserNavigatorProps> = ({ onLogout }) => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb', // Blue theme for User mode
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Dysco - User' }}
      />
      <Stack.Screen
        name="CouponDetail"
        component={CouponDetailScreen}
        options={{ title: 'Coupon Details' }}
      />
      <Stack.Screen
        name="MyCoupons"
        component={MyCouponsScreen}
        options={{ title: 'My Coupons' }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ 
          title: 'Wallet',
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
    </Stack.Navigator>
  );
}; 