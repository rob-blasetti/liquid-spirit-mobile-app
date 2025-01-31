import * as React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { UserProvider } from './contexts/UserContext';

// Import Screens
import Welcome from './screens/Welcome';
import Login from './screens/Login';
import Register from './screens/Register';
import EventDetail from './screens/EventDetail';
import ActivityDetail from './screens/ActivityDetail';

import BottomBar from './navigation/BottomBar';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <UserProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Welcome"
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

              {/* Detail Screens */}
              <Stack.Screen name="EventDetail" component={EventDetail} options={{ title: 'Event Details' }} />
              <Stack.Screen name="ActivityDetail" component={ActivityDetail} options={{ title: 'Activity Details' }} />

              {/* Main Navigation */}
              <Stack.Screen name="Main" component={BottomBar} options={{ headerShown: false }} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </UserProvider>
  );
};

export default App;
