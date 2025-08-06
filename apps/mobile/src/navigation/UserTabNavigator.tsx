import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getBottomSpace } from 'react-native-iphone-x-helper';

// Screens
import MyCouponsScreen from '../screens/MyCouponsScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';

const Tab = createBottomTabNavigator();

// Custom tab bar icon components
const TabIcon = ({ iconName, label, focused }: { iconName: string; label: string; focused: boolean }) => (
  <View style={styles.tabIconContainer}>
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Feather 
        name={iconName as any} 
        size={24} 
        color={focused ? '#667eea' : '#CCCCCC'} 
      />
    </View>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
      {label}
    </Text>
  </View>
);

// Special Discover tab with gradient and larger size
const DiscoverTabIcon = ({ focused }: { focused: boolean }) => (
  <View style={styles.discoverContainer}>
    <LinearGradient
      colors={['#FAF6E5', '#FAC989', '#E298C4', '#C580E2', '#B091F4', '#8DB4FF', '#5EDAFF', '#31ECD9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.discoverButton}
    >
      <Text style={styles.discoverIcon}>%</Text>
    </LinearGradient>
    <Text style={[styles.tabLabel, styles.discoverLabel, focused && styles.tabLabelFocused]}>
      Discover
    </Text>
  </View>
);

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Render special Discover button
          if (route.name === 'Discover') {
            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                style={styles.discoverTabContainer}
              >
                <DiscoverTabIcon focused={isFocused} />
              </TouchableOpacity>
            );
          }

          // Render regular tabs
          let iconName = '';
          let label = '';
          
          switch (route.name) {
            case 'MyCoupons':
              iconName = 'tag';
              label = 'My coupons';
              break;
            case 'Settings':
              iconName = 'settings';
              label = 'Settings';
              break;
          }

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.regularTabContainer}
            >
              <TabIcon iconName={iconName} label={label} focused={isFocused} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function UserTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          display: 'none',
          backgroundColor: 'transparent',
          position: 'absolute',
          elevation: 0,
        }, // Hide default tab bar completely
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
      <Tab.Screen
        name="MyCoupons"
        component={MyCouponsScreen}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
      />
      <Tab.Screen
        name="Settings"
        component={UserSettingsScreen}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 50, // More rounded for complete pill shape
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 70,
    // Removed all shadow properties for flat appearance
  },
  regularTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginTop: -35, // Elevate the Discover button 50% above the tab bar
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabIconFocused: {
    // No border or background for clean outline icons
  },

  tabLabel: {
    fontSize: 10,
    color: '#CCCCCC',
    fontWeight: '500',
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: '#667eea',
    fontWeight: '600',
  },
  // Discover button styles
  discoverContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    // Removed shadow properties for flat appearance
    borderWidth: 4,
    borderColor: '#FFFFFF', // Add white border for better contrast
  },
  discoverIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  discoverLabel: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 11,
  },
});