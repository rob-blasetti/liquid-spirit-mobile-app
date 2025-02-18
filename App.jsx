import * as React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { UserProvider } from './contexts/UserContext';

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

// in App.js
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { faUser, faCompass, faSquarePlus, faBahai, faAlignLeft } from '@fortawesome/free-solid-svg-icons';

library.add(
  fab, 
  faUser, 
  faCompass,
  faSquarePlus,
  faBahai,
  faAlignLeft
);

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Main" // ✅ Ensure Main (BottomBar) is the initial route
              screenOptions={{
                headerStyle: { backgroundColor: '#312783' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            >
              {/* Authentication Screens */}
              <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
              <Stack.Screen name="Login" component={Login} options={{ title: 'Login' }} />
              <Stack.Screen name="Register" component={Register} options={{ title: 'Register' }} />
              <Stack.Screen name="Verification" component={Verification} />
              <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
              <Stack.Screen name="EULA" component={Eula} /> 

              {/* Detail Screens */}
              <Stack.Screen name="EventDetail" component={EventDetail} options={{ title: 'Event Details' }} />
              <Stack.Screen name="ActivityDetail" component={ActivityDetail} options={{ title: 'Activity Details' }} />

              {/* Main Navigation - Bottom Bar */}
              <Stack.Screen name="Main" component={BottomBar} options={{ headerShown: false }} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </UserProvider>
  );
};

export default App;
