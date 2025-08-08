import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabaseAuthService } from '../services/supabaseAuth';

// Screens
import MerchantAuthScreen from '../screens/merchant/MerchantAuthScreen';
import MerchantDashboardScreen from '../screens/merchant/MerchantDashboardScreen';
import CreateCouponScreen from '../screens/merchant/CreateCouponScreen';
import QRScannerScreen from '../screens/merchant/QRScannerScreen';
import RedemptionHistoryScreen from '../screens/merchant/RedemptionHistoryScreen';
import MerchantSettingsScreen from '../screens/merchant/MerchantSettingsScreen';
import CampaignDashboardScreen from '../screens/merchant/CampaignDashboardScreen';
import CreateCampaignScreen from '../screens/merchant/CreateCampaignScreen';
import CampaignDetailsScreen from '../screens/merchant/CampaignDetailsScreen';

export type MerchantStackParamList = {
  MerchantAuth: undefined;
  MerchantDashboard: undefined;
  CreateCoupon: undefined;
  QRScanner: undefined;
  RedemptionHistory: undefined;
  MerchantSettings: undefined;
  CampaignDashboard: undefined;
  CreateCampaign: { fillSampleData?: () => void };
  CampaignDetails: { campaignId: string };
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
              headerShown: false
            }}
            component={MerchantDashboardScreen}
          />
          <Stack.Screen
            name="CreateCoupon"
            component={CreateCouponScreen}
            options={{ title: 'Create Coupon' }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{ 
              title: 'Scan Coupon',
              headerStyle: {
                backgroundColor: '#08090A',
                height: 140,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerBackTitle: '',
              headerLeft: ({ onPress }) => (
                <TouchableOpacity
                  onPress={onPress}
                  style={{
                    marginLeft: 16,
                    padding: 8,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '600' }}>←</Text>
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="RedemptionHistory"
            component={RedemptionHistoryScreen}
            options={{ 
              headerShown: false
            }}
          />
          <Stack.Screen
            name="MerchantSettings"
            component={MerchantSettingsScreen}
            options={{ 
              headerShown: false
            }}
          />
          <Stack.Screen
            name="CampaignDashboard"
            component={CampaignDashboardScreen}
            options={({ navigation }) => ({ 
              title: 'Campaign Dashboard',
              headerStyle: {
                backgroundColor: '#08090A',
                height: 140,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerBackTitle: '',
              headerLeft: ({ onPress }) => (
                <TouchableOpacity onPress={onPress} style={{ marginLeft: 20, padding: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '600' }}>←</Text>
                </TouchableOpacity>
              ),
              headerRight: () => (
                <TouchableOpacity 
                                      onPress={() => navigation.navigate('CreateCampaign', {})}
                  style={{ 
                    marginRight: 20, 
                    backgroundColor: '#A1FF9C',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: '600', fontSize: 14 }}>New</Text>
                </TouchableOpacity>
              ),
            })}
          />
                    <Stack.Screen
              name="CreateCampaign"
              component={CreateCampaignScreen}
              options={({ route }) => ({ 
                title: 'Create Campaign',
                headerStyle: {
                  backgroundColor: '#08090A',
                  height: 140,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                  fontSize: 18,
                },
                headerBackTitle: '',
                headerLeft: ({ onPress }) => (
                  <TouchableOpacity
                    onPress={onPress}
                    style={{
                      marginLeft: 16,
                      padding: 8,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '600' }}>←</Text>
                  </TouchableOpacity>
                ),
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => {
                      // We'll need to pass this function from the component
                      if (route.params && route.params.fillSampleData) {
                        route.params.fillSampleData();
                      }
                    }}
                    style={{
                      marginRight: 16,
                      padding: 8,
                    }}
                  >
                    <Text style={{ color: '#00A90B', fontSize: 16, fontWeight: '600' }}>Sample</Text>
                  </TouchableOpacity>
                ),
              })}
            />
          <Stack.Screen
            name="CampaignDetails"
            component={CampaignDetailsScreen}
            options={{ 
              title: 'Campaign Details',
              headerStyle: {
                backgroundColor: '#08090A',
                height: 140,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              headerBackTitle: '',
              headerLeft: ({ onPress }) => (
                <TouchableOpacity onPress={onPress} style={{ marginLeft: 20, padding: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '600' }}>←</Text>
                </TouchableOpacity>
              ),
            }}
          />
        </>
      )}

    </Stack.Navigator>
  );
}; 