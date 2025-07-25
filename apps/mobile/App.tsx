import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CouponDetailScreen from './src/screens/CouponDetailScreen';
import MyCouponsScreen from './src/screens/MyCouponsScreen';
import MerchantModeScreen from './src/screens/MerchantModeScreen';
import WalletScreen from './src/screens/WalletScreen';

export type RootStackParamList = {
  Home: undefined;
  CouponDetail: { couponId: string };
  MyCoupons: undefined;
  MerchantMode: undefined;
  Wallet: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2563eb', // Blue background
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
            options={{ title: 'CoupoFlow' }}
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
            name="MerchantMode" 
            component={MerchantModeScreen}
            options={{ title: 'Merchant Mode' }}
          />
          <Stack.Screen 
            name="Wallet" 
            component={WalletScreen}
            options={{ title: 'Wallet' }}
          />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
