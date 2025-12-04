import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import themeVariables from '../styles/theme';
import ProfileScreen from '../screens/Profile';
import PublicUserProfile from '../screens/PublicUserProfile';
import Settings from '../screens/Settings';
import NotificationSettings from '../screens/NotificationSettings';
import EventsScreen from '../screens/Events';
import ActivitiesScreen from '../screens/Activities';
import EditProfileScreen from '../screens/EditProfile';
import EventDetailCard from '../screens/EventDetailCard';
import ActivityDetailCard from '../screens/ActivityDetailCard';
import PostDetailCard from '../screens/PostDetailCard';
import Badges from '../screens/Badges';
import LiquidGlassIconButton from '../components/LiquidGlassIconButton';
// import ChangePasswordScreen from '../screens/ChangePassword';

const Stack = createStackNavigator();

const detailScreenOptions = {
  headerTransparent: true,
  headerStyle: { backgroundColor: 'transparent', elevation: 0 },
  headerTitle: '',
  headerShadowVisible: false,
  headerTintColor: themeVariables.blackColor,
  safeAreaInsets: { top: 0 },
};

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      // Custom header: white bg, primary text/icons, no back title, indented arrow
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: themeVariables.whiteColor },
        headerTintColor: themeVariables.primaryColor,
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackVisible: false,
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerLeftContainerStyle: { paddingLeft: 16 },
        contentStyle: { backgroundColor: 'transparent' },
        cardStyle: { backgroundColor: 'transparent' },
        presentation: 'card',
        // Custom back arrow button invokes navigation.goBack()
        headerLeft: () =>
          navigation.canGoBack() ? (
            <LiquidGlassIconButton
              iconName="chevron-back"
              iconColor={themeVariables.blackColor}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              hasShadow={false}
            />
          ) : null,
      })}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{
          // Hide default header; custom back chevron rendered in Settings component
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={{
          // Hide default header; custom back chevron rendered in screen component
          headerShown: false,
        }}
      />
      <Stack.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="EventDetailCard"
        component={EventDetailCard}
        options={detailScreenOptions}
      />
      <Stack.Screen
        name="ActivityDetailCard"
        component={ActivityDetailCard}
        options={detailScreenOptions}
      />
      <Stack.Screen
        name="PostDetailCard"
        component={PostDetailCard}
        options={detailScreenOptions}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          // Hide default header; custom back chevron rendered in EditProfile screen
          headerShown: false,
        }}
      />
      {/* <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'ChangePassword', headerShown: false }} /> */}
      <Stack.Screen
        name="PublicUserProfile"
        component={PublicUserProfile}
        options={{ title: 'User Profile', headerShown: true }}
      />
      <Stack.Screen
        name="Badges"
        component={Badges}
        options={{
          title: 'My Badges',
          headerShown: true,
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
