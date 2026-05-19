import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import themeVariables from '../styles/theme';
import ProfileScreen from '../screens/Profile';
import PublicUserProfile from '../screens/PublicUserProfile';
import Settings from '../screens/Settings';
import NotificationSettings from '../screens/NotificationSettings';
import HouseholdSettings from '../screens/HouseholdSettings';
import EventsScreen from '../screens/Events/Events';
import ActivitiesScreen from '../screens/Activities/Activities';
import EditProfileScreen from '../screens/EditProfile';
import EventDetailCard from '../screens/EventDetailCard';
import ActivityDetailCard from '../screens/ActivityDetailCard';
import PostDetailCard from '../screens/PostDetailCard';
import Badges from '../screens/Badges';
import Security from '../screens/Security';
import ChangePasswordScreen from '../screens/ChangePassword';
import PasskeyDetailsScreen from '../screens/PasskeyDetails';
import LiquidGlassIconButton from '../components/LiquidGlassIconButton';

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
        options={({ navigation }) => ({
          title: 'Settings',
          headerShown: true,
          headerShadowVisible: true,
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <LiquidGlassIconButton
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                hasShadow={false}
                forceFallback
              />
            ) : null,
        })}
      />
      <Stack.Screen
        name="Security"
        component={Security}
        options={({ navigation }) => ({
          title: 'Security',
          headerShown: true,
          headerShadowVisible: true,
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <LiquidGlassIconButton
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                hasShadow={false}
                forceFallback
              />
            ) : null,
        })}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettings}
        options={({ navigation }) => ({
          title: 'Notifications',
          headerShown: true,
          headerShadowVisible: true,
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <LiquidGlassIconButton
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                hasShadow={false}
                forceFallback
              />
          ) : null,
        })}
      />
      <Stack.Screen
        name="HouseholdSettings"
        component={HouseholdSettings}
        options={({ navigation }) => ({
          title: 'Household',
          headerShown: true,
          headerShadowVisible: true,
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <LiquidGlassIconButton
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                hasShadow={false}
                forceFallback
              />
            ) : null,
        })}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={({ navigation }) => ({
          title: 'Update Password',
          headerShown: true,
          headerShadowVisible: true,
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <LiquidGlassIconButton
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                hasShadow={false}
                forceFallback
              />
            ) : null,
        })}
      />
      <Stack.Screen
        name="PasskeyDetails"
        component={PasskeyDetailsScreen}
        options={({ navigation }) => ({
          title: 'Passkey Details',
          headerShown: true,
          headerShadowVisible: true,
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <LiquidGlassIconButton
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                hasShadow={false}
                forceFallback
              />
            ) : null,
        })}
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
        options={({ navigation }) => ({
          title: 'Personal Information',
          headerShown: true,
          headerShadowVisible: true,
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.blackColor,
          headerTitleStyle: { color: themeVariables.blackColor, fontWeight: 'bold' },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <LiquidGlassIconButton
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Go back"
                hasShadow={false}
                forceFallback
              />
            ) : null,
        })}
      />
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
