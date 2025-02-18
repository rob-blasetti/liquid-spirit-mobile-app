import * as React from 'react';
import { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { UserProvider } from './contexts/UserContext';

// Import your splash screen
import Splash from './screens/Splash';

// Import Screens
import Welcome from './screens/Welcome';
import SocialMedia from './screens/SocialMedia';
import Login from './screens/Login';
import Register from './screens/Register';
import Verification from './screens/Verification';
import EventDetail from './screens/EventDetail';
import ActivityDetail from './screens/ActivityDetail';
import ForgotPassword from './screens/ForgotPassword';
import Eula from './screens/Eula';

import BottomBar from './navigation/BottomBar';

// FontAwesome library setup
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { faUser, faCompass, faSquarePlus, faBahai, faAlignLeft } from '@fortawesome/free-solid-svg-icons';

library.add(fab, faUser, faCompass, faSquarePlus, faBahai, faAlignLeft);

const Stack = createNativeStackNavigator();

const App = () => {
  // Local state to control the splash visibility
  const [appIsReady, setAppIsReady] = useState(false);

  // Example: you could store any pre-fetched data here if needed
  // const [initialPosts, setInitialPosts] = useState([]);

  useEffect(() => {
    // 1) Simulate data fetching (and keep splash for an extra second)
    const prepareApp = async () => {
      try {
        // e.g. Fetch some data that you want ready for the first screen
        // const fetchedPosts = await fetchExploreFeed();
        // setInitialPosts(fetchedPosts);

        // 2) Keep splash an extra second for demonstration:
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        // 3) We’re done -> show the app
        setAppIsReady(true);
      }
    };

    prepareApp();
  }, []);

  if (!appIsReady) {
    // Show your splash screen while things load
    return <Splash />;
  }

  // Once ready, render your normal app
  return (
    <UserProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Main"
              screenOptions={{
                headerStyle: { backgroundColor: '#312783' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            >
              {/* Authentication Screens */}
              <Stack.Screen
                name="Welcome"
                component={Welcome}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="Login" component={Login} options={{ title: 'Login' }} />
              <Stack.Screen name="Register" component={Register} options={{ title: 'Register' }} />
              <Stack.Screen name="Verification" component={Verification} />
              <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
              <Stack.Screen name="EULA" component={Eula} /> 

              {/* Detail Screens */}
              <Stack.Screen
                name="EventDetail"
                component={EventDetail}
                options={{ title: 'Event Details' }}
              />
              <Stack.Screen
                name="ActivityDetail"
                component={ActivityDetail}
                options={{ title: 'Activity Details' }}
              />

              {/* Main Navigation - Bottom Bar */}
              <Stack.Screen
                name="Main"
                component={BottomBar}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </UserProvider>
  );
};

export default App;
