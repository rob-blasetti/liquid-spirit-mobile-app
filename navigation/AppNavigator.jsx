import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, flushPendingNavigation } from './RootNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import themeVariables from '../styles/theme';
import LiquidGlassIconButton from '../components/LiquidGlassIconButton';

const linking = {
  prefixes: ['liquidspirit://', 'https://www.liquidspirit.org', 'https://liquidspirit.org'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            screens: {
              ActivityDetailCard: 'activities/:activityId',
              EventDetailCard: 'events/:eventId',
            },
          },
          Feed: {
            screens: {
              PostDetailCard: 'posts/:postId',
            },
          },
        },
      },
      PublicUserProfile: 'users/:userId',
    },
  },
};

import { UserContext } from '../contexts';
import {
  Welcome,
  Login,
  Register,
  Verification,
  ForgotPassword,
  ForgotBahaiId,
  Eula,
  Search as SearchScreen,
  CreateActivity,
  CreateSession,
  PublicUserProfile,
  RequestAgendaItem,
  CurriculumDetailScreen,
  Notifications as NotificationScreen,
  PushDiagnostics,
  Badges,
} from '../screens';
import BottomBar from './BottomBar';
import PostModal from '../modal/PostModal';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ initialPosts, homeOverview }) => {
  const { isLoggedIn, ensureValidSession } = useContext(UserContext);
  const initialRoute = isLoggedIn ? 'Main' : 'Welcome';

  return (
    <NavigationContainer
      linking={linking}
      ref={navigationRef}
      onReady={flushPendingNavigation}
      onStateChange={() => {
        ensureValidSession?.();
      }}
    >
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: themeVariables.whiteColor },
          headerTintColor: themeVariables.primaryColor,
          headerTitleStyle: { fontWeight: 'bold', color: themeVariables.blackColor },
          headerBackVisible: false,
          headerBackTitleVisible: false,
          headerBackTitle: '',
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerLeft: () =>
            navigation.canGoBack() ? (
              <LiquidGlassIconButton
                onPress={() => navigation.goBack()}
                iconName="chevron-back"
                iconColor={themeVariables.blackColor}
                accessibilityLabel="Go back"
                hasShadow={false}
              />
            ) : null,
        })}
      >
      <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={Login} options={{ title: 'Login' }} />
      <Stack.Screen name="Register" component={Register} options={{ title: 'Register' }} />
      <Stack.Screen name="Verification" component={Verification} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: 'Forgot Password' }} />
      <Stack.Screen name="ForgotBahaiId" component={ForgotBahaiId} options={{ title: "Forgot Bahá'í ID" }} />
      <Stack.Screen name="EULA" component={Eula} />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={({ navigation }) => ({
          title: 'Search',
          headerLeft: () => (
            <LiquidGlassIconButton
              iconName="chevron-back"
              iconColor={themeVariables.blackColor}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Go back"
              hasShadow={false}
              forceFallback
            />
          ),
          headerBackVisible: false,
        })}
      />
      <Stack.Screen
        name="CreateActivity"
        component={CreateActivity}
        options={{ title: 'Create Activity', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="CreateSession"
        component={CreateSession}
        options={{ title: 'Create Session', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="PublicUserProfile" component={PublicUserProfile} options={{ title: 'User Profile' }} />
      <Stack.Screen
        name="PublicUserBadges"
        component={Badges}
        options={{ title: 'Badges' }}
      />
      <Stack.Screen name="RequestAgendaItem" component={RequestAgendaItem} options={{ title: 'Request Agenda Item' }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={({ navigation }) => ({
          title: 'Notifications',
          headerStyle: { backgroundColor: themeVariables.screenBackgroundColor, elevation: 0 },
          headerShadowVisible: true,
          headerTintColor: themeVariables.blackColor,
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
        name="CreatePostModal"
        component={PostModal}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="PushDiagnostics"
        component={PushDiagnostics}
        options={{ title: 'Push Diagnostics' }}
      />
      <Stack.Screen
        name="CurriculumDetailScreen"
        component={CurriculumDetailScreen}
        options={{ title: 'Curriculum Details' }}
      />
      <Stack.Screen name="Main" options={{ headerShown: false }}>
        {() => <BottomBar initialPosts={initialPosts} homeOverview={homeOverview} />}
      </Stack.Screen>
    </Stack.Navigator>
  </NavigationContainer>
  );
};

export default AppNavigator;
