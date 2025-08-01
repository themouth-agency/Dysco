import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabaseAuthService } from '../services/supabaseAuth';

// Screens
import MerchantAuthScreen from '../screens/merchant/MerchantAuthScreen';
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen';
import CreateCouponScreen from '../screens/merchant/CreateCouponScreen';

export type MerchantStackParamList = {
  MerchantAuth: undefined;
  MerchantDashboard: undefined;
  CreateCoupon: undefined;
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
      const authenticated = await supabaseAuthService.isAuthenticated();
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
      await supabaseAuthService.signOut();
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
        // Show Supabase auth screen if not authenticated
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
          component={MerchantDashboardScreen}
          />
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