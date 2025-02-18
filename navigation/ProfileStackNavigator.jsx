import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/Profile';
import Settings from '../screens/Settings';
// import EditProfileScreen from '../screens/EditProfileScreen'; // If you have this

const Stack = createStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
      {/* <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} /> */}
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
