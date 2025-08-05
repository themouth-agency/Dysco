import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Context
import { AppModeProvider, useAppMode } from './src/contexts/AppModeContext';

// Navigation
import { UserNavigator } from './src/navigation/UserNavigator';
import { MerchantAuthNavigator } from './src/navigation/MerchantAuthNavigator';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';

// Components
import { ModeSwitcher } from './src/components/ModeSwitcher';

export type RootStackParamList = {
  Home: undefined;
  CouponDetail: { couponId: string };
  MyCoupons: undefined;
  Wallet: undefined;
  ClaimCoupon: { campaignId: string };
  UserRedemptionHistory: undefined;
  MnemonicBackup: {
    mnemonic: string;
    privateKey: string;
    publicKey: string;
  };
  MnemonicVerification: {
    mnemonic: string;
    privateKey: string;
    publicKey: string;
  };
};

function AppContent() {
  const { mode } = useAppMode();
  const [hasSelectedRole, setHasSelectedRole] = useState(false);

  const handleLogout = () => {
    setHasSelectedRole(false);
  };

  // Show welcome screen until user selects a role
  if (!hasSelectedRole) {
    return (
      <WelcomeScreen
        navigation={{} as any}
        onRoleSelected={() => setHasSelectedRole(true)}
      />
    );
  }

  const linking = {
    prefixes: ['dysco://', 'exp://192.168.0.49:8081/--/'],
    config: {
      screens: {
        ClaimCoupon: 'claim/:campaignId',
      },
    },
  };

  return (
    <NavigationContainer linking={linking}>
      {mode === 'user' ? (
        <UserNavigator onLogout={handleLogout} />
      ) : (
        <MerchantAuthNavigator onLogout={handleLogout} />
      )}
      <ModeSwitcher />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppModeProvider>
        <AppContent />
      </AppModeProvider>
    </SafeAreaProvider>
  );
}
