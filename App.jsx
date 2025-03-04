import * as React from 'react';
import { useState, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import PushNotification from 'react-native-push-notification';
// import PushNotificationIOS from '@react-native-community/push-notification-ios';
import socket from './socket';
import { useNotifications } from './hooks/useNotifications';
import NotificationHandler from './components/notificationHandler';

import { UserProvider, useUser } from './contexts/UserContext';
import { fetchExploreFeed } from './services/PostService';

import Splash from './screens/Splash';

import Welcome from './screens/Welcome';
import Login from './screens/Login';
import Register from './screens/Register';
import Verification from './screens/Verification';
import EventDetail from './screens/EventDetail';
import ActivityDetail from './screens/ActivityDetail';
import ForgotPassword from './screens/ForgotPassword';
import Eula from './screens/Eula';

import BottomBar from './navigation/BottomBar';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { faUser, faCompass, faSquarePlus, faBahai, faAlignLeft } from '@fortawesome/free-solid-svg-icons';

library.add(fab, faUser, faCompass, faSquarePlus, faBahai, faAlignLeft);

const Stack = createNativeStackNavigator();

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialPosts, setInitialPosts] = useState([]);
  const { notification, sendNotification } = useNotifications();

  // useEffect(() => {
  //   PushNotification.createChannel(
  //     {
  //       channelId: "default-channel-id",
  //       channelName: "Default Channel",
  //       importance: 4,
  //       vibrate: true,
  //     },
  //     (created) => console.log(`📡 Push Channel Created: ${created}`)
  //   );
  // }, []);
  
  // PushNotification.localNotification({
  //   channelId: "default-channel-id",
  //   title: "New Message",
  //   message: "You have received a new message!",
  // });

  useEffect(() => {
    socket.on('connect', () => {
        console.log('✅ Connected to WebSocket:', socket.id);
    });

    return () => {
        socket.off('connect');
    };
  }, []);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        const fetchedPosts = await fetchExploreFeed();
        setInitialPosts(fetchedPosts);

        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setAppIsReady(true);
      }
    };

    prepareApp();
  }, []);

  // useEffect(() => {
  //   console.log('🔔 APNs useEffect triggered');
  
  //   PushNotification.configure({
  //     onRegister: function (token) {
  //       console.log("✅ APNs Token:", token?.token || "No Token Received");
  //       Alert.alert("APNs Token", token?.token || "No Token Received");
  //     },
  
  //     onNotification: function (notification) {
  //       console.log("📩 Notification received:", notification);
  //       notification.finish(PushNotificationIOS.FetchResult.NoData);
  //     },
  
  //     onRegistrationError: function (err) {
  //       console.error("❌ APNs registration error:", err);
  //       Alert.alert("APNs Error", JSON.stringify(err)); // Debugging
  //     },
  
  //     permissions: {
  //       alert: true,
  //       badge: true,
  //       sound: true,
  //     },
  
  //     popInitialNotification: true,
  //     requestPermissions: true, // ✅ Ensure permissions are always requested
  //   });
  
  // }, []);

  if (!appIsReady) {
    return <Splash />;
  }

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

              <Stack.Screen
                name="Main"
                options={{ headerShown: false }}
              >
                {() => <BottomBar initialPosts={initialPosts} />}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
      <NotificationHandler />
    </UserProvider>
  );
};

export default App;
