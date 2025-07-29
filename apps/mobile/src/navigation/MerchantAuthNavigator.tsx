import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { merchantWalletService } from '../services/merchantWallet';

// Screens
import MerchantAuthScreen from '../screens/merchant/MerchantAuthScreen';
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen';
import CreateCouponScreen from '../screens/merchant/CreateCouponScreen';
import MnemonicBackupScreen from '../screens/merchant/MnemonicBackupScreen';
import MerchantRecoveryScreen from '../screens/merchant/MerchantRecoveryScreen';

export type MerchantStackParamList = {
  MerchantAuth: undefined;
  MerchantDashboard: undefined;
  CreateCoupon: undefined;
  MnemonicBackup: {
    mnemonic: string;
    merchantData: any;
    wallet: any;
    onSuccess: () => void;
  };
  MerchantRecovery: undefined;
};

const Stack = createStackNavigator<MerchantStackParamList>();

interface MerchantAuthNavigatorProps {
  onLogout?: () => void;
}

export const MerchantAuthNavigator: React.FC<MerchantAuthNavigatorProps> = ({ onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await merchantWalletService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleMerchantLogout = async () => {
    try {
      await merchantWalletService.clearCredentials();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSwitchRole = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return null; // Could show a loading screen here
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        // Show auth screen if not authenticated
        <>
          <Stack.Screen
            name="MerchantAuth"
            options={{ headerShown: false }}
          >
            {(props) => (
              <MerchantAuthScreen 
                {...props} 
                onAuthSuccess={handleAuthSuccess}
              />
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="MnemonicBackup" 
            options={{ 
              title: 'Secure Your Wallet',
              headerLeft: () => null, // Prevent going back
            }}
          >
            {(props) => (
              <MnemonicBackupScreen 
                {...props}
                mnemonic={props.route.params.mnemonic}
                onBackupConfirmed={async () => {
                  const { cryptoWalletService } = await import('../services/cryptoWallet');
                  await cryptoWalletService.storeWallet(props.route.params.wallet);
                  await cryptoWalletService.storeMerchantWallet(
                    props.route.params.wallet.privateKey,
                    props.route.params.merchantData
                  );
                  props.route.params.onSuccess();
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen 
            name="MerchantRecovery" 
            options={{ 
              title: 'Recover Account',
            }}
          >
            {(props) => (
              <MerchantRecoveryScreen 
                {...props}
                onRecoverySuccess={handleAuthSuccess}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        // Show main merchant screens if authenticated
        <>
          <Stack.Screen
            name="MerchantDashboard"
            options={{ 
              title: 'Dysco - Merchant',
              headerRight: () => (
                <View style={{ flexDirection: 'row', marginRight: 15 }}>
                  <TouchableOpacity 
                    onPress={handleSwitchRole}
                    style={{ marginRight: 15 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 16 }}>Switch Role</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleMerchantLogout}>
                    <Text style={{ color: '#fff', fontSize: 16 }}>Logout</Text>
                  </TouchableOpacity>
                </View>
              )
            }}
          >
            {(props) => <MerchantDashboardScreen {...props} />}
          </Stack.Screen>
          <Stack.Screen
            name="CreateCoupon"
            component={CreateCouponScreen}
            options={{ title: 'Create Coupon' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}; 