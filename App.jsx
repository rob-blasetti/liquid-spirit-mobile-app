import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { StatusBar, StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import themeVariables from './styles/theme';

import { UserProvider, UserContext } from './contexts/UserContext';
import { fetchExploreFeed } from './services/PostService';
import { useAuthService } from './services/AuthService';

import Splash from './screens/Splash';

import Welcome from './screens/Welcome';
import Login from './screens/Login';
import Register from './screens/Register';
import Verification from './screens/Verification';
import EventDetail from './screens/EventDetail';
import CreateActivity from './screens/CreateActivity';
import ActivityDetail from './screens/ActivityDetail';
import ActivityDetailCard from './screens/ActivityDetailCard';
import ActivitiesScreen from './screens/Activities';
import EventsScreen from './screens/Events';
import EventDetailCard from './screens/EventDetailCard';
import ForgotPassword from './screens/ForgotPassword';
import ForgotBahaiId from './screens/ForgotBahaiId';
import Eula from './screens/Eula';
import PublicUserProfile from './screens/PublicUserProfile';
import CurriculumDetailScreen from './screens/CurriculumDetailScreen';
import RequestAgendaItem from './screens/RequestAgendaItem';

import BottomBar from './navigation/BottomBar';
import NotificationScreen from './screens/Notifications';
// Modal screen for creating posts
import CreatePostScreen from './screens/CreatePost';
import PostModal from './modal/PostModal';

import Ionicons from 'react-native-vector-icons/Ionicons';

const Stack = createNativeStackNavigator();

const MainApp = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialPosts, setInitialPosts] = useState([]);
  const [homeOverview, setHomeOverview] = useState([]);
  const [homeOverviewLoaded, setHomeOverviewLoaded] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const { biometricLogin, isLoggedIn, communityId, storageLoaded,
          token, isTokenExpired, refreshSession } = useContext(UserContext);
  const { fetchHomeOverview } = useAuthService();

  useEffect(() => {
    if (!storageLoaded) return;
    const attemptBiometricLogin = async () => {
      if (!isLoggedIn) {
        await biometricLogin();
      }
      setCheckingSession(false);
    };
    attemptBiometricLogin();
  }, [storageLoaded]);

  // Prepare initial explore posts after storage & session ready
  useEffect(() => {
    if (!storageLoaded || checkingSession) return;
    const prepareApp = async () => {
      // If no token or expired, attempt refresh and retry on token change
      if (!token || isTokenExpired(token)) {
        try {
          await refreshSession();
        } catch (err) {
          console.error('Token refresh failed during initial load:', err);
        }
        return;
      }
      try {
        const fetchedPosts = await fetchExploreFeed(token);
        setInitialPosts(fetchedPosts);
        // Keep splash an extra moment for smooth transition
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Error loading initial explore feed:', error);
      } finally {
        setAppIsReady(true);
      }
    };
    prepareApp();
  }, [storageLoaded, checkingSession, token]);

  // Fetch home overview whenever communityId becomes available
  useEffect(() => {
    const loadHomeOverview = async () => {
      if (!communityId) return;
      setHomeOverviewLoaded(false);
      try {
        const overviewResult = await fetchHomeOverview(communityId);
        if (overviewResult.ok) {
          setHomeOverview(overviewResult.data);
        } else {
          console.warn('Failed to fetch home overview');
        }
      } catch (error) {
        console.error('Error fetching home overview:', error);
      } finally {
        setHomeOverviewLoaded(true);
      }
    };
    loadHomeOverview();
  }, [communityId]);

  // Hide splash when all initial loading is done
  useEffect(() => {
    if (
      appIsReady &&
      !checkingSession &&
      (!isLoggedIn || (communityId && homeOverviewLoaded))
    ) {
      setShowSplash(false);
    }
  }, [appIsReady, checkingSession, isLoggedIn, communityId, homeOverviewLoaded]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={styles.root}>
        <StatusBar
          barStyle={showSplash ? 'light-content' : 'dark-content'}
          backgroundColor={showSplash ? themeVariables.primaryColor : themeVariables.whiteColor}
        />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Main"
            screenOptions={({ navigation }) => ({
              // White background with primary-colored icons/text
              headerStyle: { backgroundColor: themeVariables.whiteColor },
              headerTintColor: themeVariables.primaryColor,
              headerTitleStyle: { fontWeight: 'bold' },
              // Hide default back title
              headerBackTitleVisible: false,
              headerBackTitle: '',
              headerLeftContainerStyle: { paddingLeft: 16 },
              // Custom back arrow button invokes navigation.goBack()
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
            <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }}/>
            <Stack.Screen name="Login" component={Login} options={{ title: 'Login' }} />
            <Stack.Screen name="Register" component={Register} options={{ title: 'Register' }} />
            <Stack.Screen name="Verification" component={Verification} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: 'Forgot Password' }} />
            <Stack.Screen name="ForgotBahaiId" component={ForgotBahaiId} options={{ title: "Forgot Bahá'í ID" }} />
            <Stack.Screen name="EULA" component={Eula} /> 
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="Activities" component={ActivitiesScreen} />
            <Stack.Screen name="CreateActivity" component={CreateActivity} options={{ title: 'Create Activity' }} />
            <Stack.Screen name="EventDetail" component={EventDetail} options={{ title: 'Event Details' }}/>
            <Stack.Screen
              name="EventDetailCard"
              component={EventDetailCard}
              options={{
                // Transparent header so the banner image extends to the top edge
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent', elevation: 0 },
                headerTitle: '',
                headerShadowVisible: false,
                headerTintColor: themeVariables.blackColor,
                // Allow content under status bar on iOS
                safeAreaInsets: { top: 0 },
              }}
            />
            <Stack.Screen name="PublicUserProfile" component={PublicUserProfile} options={{ title: 'User Profile' }}/>
            <Stack.Screen name="ActivityDetail" component={ActivityDetail} options={{ title: 'Activity Details' }}/>
            <Stack.Screen
              name="ActivityDetailCard"
              component={ActivityDetailCard}
              options={{
                // Transparent navigation header to show banner behind
                headerTransparent: true,
                headerStyle: { backgroundColor: 'transparent', elevation: 0 },
                headerTitle: '',
                headerShadowVisible: false,
                headerTintColor: themeVariables.blackColor,
                // Override iOS safe area to allow content under status bar
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
            {/* Modal for creating posts */}
            <Stack.Screen
              name="CreatePostModal"
              component={PostModal}
              options={{
                // full-screen modal to cover the status-bar area
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="CurriculumDetailScreen"
              component={CurriculumDetailScreen}
              options={{ title: 'Curriculum Details' }}
            />
            <Stack.Screen name="Main"
              options={{ headerShown: false }}
            >
              {() => <BottomBar initialPosts={initialPosts} homeOverview={homeOverview}/>}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
        {/* Overlay splash until app is fully ready */}
        {showSplash && (
          <View style={styles.splashOverlay}>
            <Splash />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
};

const App = () => (
  <UserProvider>
    <MainApp />
  </UserProvider>
);

export default App;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});