import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import SocialMediaScreen from '../screens/SocialMedia';
import EventsScreen from '../screens/Events';
import ActivitiesScreen from '../screens/Activities';
import ProfileScreen from '../screens/Profile';
import PostScreen from '../screens/Post';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Profile: 'user',
  SocialMedia: 'compass',
  Camera: 'fa-square-plus',
  Events: 'bahai',
  Activities: 'fa-align-left',
};

const BottomBar = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <FontAwesomeIcon icon={tabIcons[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#312783',
        tabBarInactiveTintColor: 'gray',
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
