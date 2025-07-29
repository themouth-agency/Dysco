import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Merchant Mode Screens
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen';
import CreateCouponScreen from '../screens/merchant/CreateCouponScreen';
import QRScannerScreen from '../screens/merchant/QRScannerScreen';
import RedemptionHistoryScreen from '../screens/merchant/RedemptionHistoryScreen';
import MerchantSettingsScreen from '../screens/merchant/MerchantSettingsScreen';

export type MerchantStackParamList = {
  MerchantAuth: undefined;
  MerchantDashboard: undefined;
  CreateCoupon: undefined;
  QRScanner: undefined;
  RedemptionHistory: undefined;
  MerchantSettings: undefined;
};

const Stack = createStackNavigator<MerchantStackParamList>();

export const MerchantNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="MerchantDashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#059669', // Green theme for Merchant mode
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="MerchantDashboard"
        component={MerchantDashboardScreen}
        options={{ title: 'CoupoFlow - Merchant' }}
      />
      <Stack.Screen
        name="CreateCoupon"
        component={CreateCouponScreen}
        options={{ title: 'Create Coupon' }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ title: 'Scan Coupon' }}
      />
      <Stack.Screen
        name="RedemptionHistory"
        component={RedemptionHistoryScreen}
        options={{ title: 'Redemption History' }}
      />
      <Stack.Screen
        name="MerchantSettings"
        component={MerchantSettingsScreen}
        options={{ title: 'Merchant Settings' }}
      />
    </Stack.Navigator>
  );
}; 