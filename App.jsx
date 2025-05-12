import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { StatusBar, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import Eula from './screens/Eula';
import PublicUserProfile from './screens/PublicUserProfile';

import BottomBar from './navigation/BottomBar';

// FontAwesome library setup
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { faUser, faCompass, faSquarePlus, faBahai, faAlignLeft, faHome } from '@fortawesome/free-solid-svg-icons';

library.add(fab, faUser, faCompass, faSquarePlus, faBahai, faAlignLeft, faHome);

const Stack = createNativeStackNavigator();

const MainApp = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialPosts, setInitialPosts] = useState([]);
  const [homeOverview, setHomeOverview] = useState([]);
  const [checkingSession, setCheckingSession] = useState(true);
  const { biometricLogin, isLoading, isLoggedIn, communityId } = useContext(UserContext);
  const { fetchHomeOverview } = useAuthService();

  useEffect(() => {
    const attemptBiometricLogin = async () => {
      if (!isLoggedIn) {
        await biometricLogin();
      }
      setCheckingSession(false);
    };

    attemptBiometricLogin();
  }, []);

  useEffect(() => {
    // 1) Fetch initial posts and keep splash for an extra moment
    const prepareApp = async () => {
      try {
        const fetchedPosts = await fetchExploreFeed();
        setInitialPosts(fetchedPosts);
        // Keep splash an extra moment
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        // Done -> show the app
        setAppIsReady(true);
      }
    };
    prepareApp();
  }, []);

  // Fetch home overview whenever communityId becomes available
  useEffect(() => {
    const loadHomeOverview = async () => {
      if (!communityId) return;
      try {
        const overviewResult = await fetchHomeOverview(communityId);
        if (overviewResult.ok) {
          setHomeOverview(overviewResult.data);
        } else {
          console.warn('Failed to fetch home overview');
        }
      } catch (error) {
        console.error('Error fetching home overview:', error);
      }
    };
    loadHomeOverview();
  }, [communityId]);

  if (!appIsReady) {
    // Show your splash screen while things load
    return <Splash />;
  }

  if (checkingSession || isLoading || (isLoggedIn && !communityId)) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </SafeAreaView>
    );
  }

  // Once ready, render your normal app
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <NavigationContainer>
          <Stack.Navigator initialRouteName="Main" screenOptions={{ headerStyle: { backgroundColor: '#312783' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
            <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }}/>
            <Stack.Screen name="Login" component={Login} options={{ title: 'Login' }} />
            <Stack.Screen name="Register" component={Register} options={{ title: 'Register' }} />
            <Stack.Screen name="Verification" component={Verification} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: 'Forgot Password' }} />
            <Stack.Screen name="EULA" component={Eula} /> 
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="Activities" component={ActivitiesScreen} />
            <Stack.Screen name="CreateActivity" component={CreateActivity} options={{ title: 'Create Activity' }} />
            <Stack.Screen name="EventDetail" component={EventDetail} options={{ title: 'Event Details' }}/>
            <Stack.Screen name="EventDetailCard" component={EventDetailCard} options={{ title: 'Event Detail Card' }}/>
            <Stack.Screen name="PublicUserProfile" component={PublicUserProfile} options={{ title: 'User Profile' }}/>
            <Stack.Screen name="ActivityDetail" component={ActivityDetail} options={{ title: 'Activity Details' }}/>
            <Stack.Screen name="ActivityDetailCard" component={ActivityDetailCard} options={{ title: 'Activity Detail Card' }}/>
            <Stack.Screen name="Main"
              options={{ headerShown: false }}
            >
              {() => <BottomBar initialPosts={initialPosts} homeOverview={homeOverview}/>}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const App = () => (
  <UserProvider>
    <MainApp />
  </UserProvider>
);

export default App;