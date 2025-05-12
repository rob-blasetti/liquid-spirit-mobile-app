import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/Profile';
import PublicUserProfile from '../screens/PublicUserProfile';
import Settings from '../screens/Settings';
import EventsScreen from '../screens/Events';
import ActivitiesScreen from '../screens/Activities';
import EditProfileScreen from '../screens/EditProfile';
// import ChangePasswordScreen from '../screens/ChangePassword';

const Stack = createStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
      <Stack.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'EditProfile', headerShown: false }} />
      {/* <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'ChangePassword', headerShown: false }} /> */}
      <Stack.Screen
        name="PublicUserProfile"
        component={PublicUserProfile}
        options={{ title: 'User Profile', headerShown: true }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
