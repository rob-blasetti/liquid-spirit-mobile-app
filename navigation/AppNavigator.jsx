import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef, flushPendingNavigation } from './RootNavigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';

const linking = {
  prefixes: ['liquidspirit://', 'https://www.liquidspirit.org', 'https://liquidspirit.org'],
  config: {
    screens: {
      ActivityDetailCard: 'activities/:activityId',
      EventDetailCard: 'events/:eventId',
      PostDetailCard: 'posts/:postId',
      PublicUserProfile: 'users/:userId'
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
  Events as EventsScreen,
  Activities as ActivitiesScreen,
  CreateActivity,
  EventDetail,
  EventDetailCard,
  PublicUserProfile,
  ActivityDetail,
  ActivityDetailCard,
  PostDetailCard,
  RequestAgendaItem,
  CurriculumDetailScreen,
  Notifications as NotificationScreen,
  PushDiagnostics,
} from '../screens';
import BottomBar from './BottomBar';
import PostModal from '../modal/PostModal';

const Stack = createNativeStackNavigator();

const AppNavigator = ({ initialPosts, homeOverview }) => {
  const { isLoggedIn } = useContext(UserContext);
  const initialRoute = isLoggedIn ? 'Main' : 'Welcome';

  return (
  <NavigationContainer linking={linking} ref={navigationRef} onReady={flushPendingNavigation}>
      <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: themeVariables.whiteColor },
        headerTintColor: themeVariables.primaryColor,
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitleVisible: false,
        headerBackTitle: '',
        headerLeftContainerStyle: { paddingLeft: 16 },
        headerLeft: () =>
          navigation.canGoBack() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: themeVariables.greyColor,
                borderRadius: themeVariables.borderRadiusPill,
                padding: 6,
              }}
            >
              <Ionicons
                name="chevron-back"
                color={themeVariables.blackColor}
                size={20}
              />
            </TouchableOpacity>
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
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} />
      <Stack.Screen name="CreateActivity" component={CreateActivity} options={{ title: 'Create Activity' }} />
      <Stack.Screen name="EventDetail" component={EventDetail} options={{ title: 'Event Details' }} />
      <Stack.Screen
        name="EventDetailCard"
        component={EventDetailCard}
        options={{
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent', elevation: 0 },
          headerTitle: '',
          headerShadowVisible: false,
          headerTintColor: themeVariables.blackColor,
          safeAreaInsets: { top: 0 },
        }}
      />
      <Stack.Screen name="PublicUserProfile" component={PublicUserProfile} options={{ title: 'User Profile' }} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetail} options={{ title: 'Activity Details' }} />
      <Stack.Screen
        name="ActivityDetailCard"
        component={ActivityDetailCard}
        options={{
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent', elevation: 0 },
          headerTitle: '',
          headerShadowVisible: false,
          headerTintColor: themeVariables.blackColor,
          safeAreaInsets: { top: 0 },
        }}
      />
      <Stack.Screen
        name="PostDetailCard"
        component={PostDetailCard}
        options={{
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent', elevation: 0 },
          headerTitle: '',
          headerShadowVisible: false,
          headerTintColor: themeVariables.blackColor,
          safeAreaInsets: { top: 0 },
        }}
      />
      <Stack.Screen name="RequestAgendaItem" component={RequestAgendaItem} options={{ title: 'Request Agenda Item' }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          headerTransparent: true,
          headerStyle: { backgroundColor: 'transparent', elevation: 0 },
          headerTitle: '',
          headerShadowVisible: false,
          headerTintColor: themeVariables.blackColor,
          headerLeftContainerStyle: { paddingLeft: 16, paddingTop: 8 },
        }}
      />
      <Stack.Screen
        name="CreatePostModal"
        component={PostModal}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
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
