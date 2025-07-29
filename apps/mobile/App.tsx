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
};

function AppContent() {
  const { mode } = useAppMode();
  const [hasSelectedRole, setHasSelectedRole] = useState(false);

  // Show welcome screen until user selects a role
  if (!hasSelectedRole) {
    return (
      <WelcomeScreen 
        navigation={{} as any} 
        onRoleSelected={() => setHasSelectedRole(true)} 
      />
    );
  }

  return (
    <NavigationContainer>
      {mode === 'user' ? (
        <UserNavigator onLogout={() => setHasSelectedRole(false)} />
      ) : (
        <MerchantAuthNavigator onLogout={() => setHasSelectedRole(false)} />
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
