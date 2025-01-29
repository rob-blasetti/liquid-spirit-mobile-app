import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import Screens
import SocialMediaScreen from '../screens/SocialMedia';
import EventsScreen from '../screens/Events';
import ActivitiesScreen from '../screens/Activities';
import ProfileScreen from '../screens/Profile';
import PostScreen from '../screens/Post';

// Create Bottom Tab Navigator
const Tab = createBottomTabNavigator();

// Define tab icon mapping
const tabIcons = {
  Profile: 'person',
  SocialMedia: 'dynamic-feed',
  PostScreen: 'camera',
  Events: 'event',
  Activities: 'fitness-center',
  Settings: 'settings',
};

const BottomBar = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = tabIcons[route.name]; // Get the corresponding icon name
          return (
            <Icon
              name={iconName} // Use the icon name
              size={size}
              color={focused ? '#0485e2' : 'gray'}
            />
          );
        },
        tabBarActiveTintColor: '#0485e2', // Active icon color
        tabBarInactiveTintColor: 'gray',  // Inactive icon color
      })}
    >
      <Tab.Screen name="SocialMedia" component={SocialMediaScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} />
      <Tab.Screen name="Camera" component={PostScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomBar;
