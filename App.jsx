// no direct React hooks needed; initialization logic moved to useAppInitialization hook
import React, { useEffect, useContext } from 'react';
import { StatusBar, StyleSheet, View, Linking } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import themeVariables from './styles/theme';

import { UserProvider, CommunityProvider, ChatProvider, VenuesProvider } from './contexts';
import { useAppInitialization } from './hooks/useAppInitialization';
import useMountEffect from './hooks/useMountEffect';

import { Splash } from './screens';
import AppNavigator from './navigation/AppNavigator';
import { UserContext } from './contexts/UserContext';
import { initPushNotifications, getCurrentApnsToken, registerDevice } from './services/PushService';

const MainApp = () => {
  const { initialPosts, homeOverview, showSplash } = useAppInitialization();
  const { token } = useContext(UserContext);

  useMountEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) console.log('Initial URL:', url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('Received URL:', url);
    });

    return () => sub.remove();
  });

  // Initialize APNs listeners once on mount so cold-start taps are handled
  useMountEffect(() => {
    const cleanup = initPushNotifications(token || null);
    return cleanup;
  });

  // When auth token becomes available later, register the device with backend
  useEffect(() => {
    if (!token) return;
    const apnsToken = getCurrentApnsToken?.();
    if (apnsToken) {
      registerDevice(token, apnsToken).catch(() => {});
    }
  }, [token]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={styles.root}>
        <StatusBar
          barStyle={showSplash ? 'light-content' : 'dark-content'}
          backgroundColor={showSplash ? themeVariables.primaryColor : themeVariables.whiteColor}
        />
        {showSplash ? (
          <View style={styles.splashContainer}>
            <Splash />
          </View>
        ) : (
          <AppNavigator initialPosts={initialPosts} homeOverview={homeOverview} />
        )}
      </View>
    </SafeAreaProvider>
  );
};

const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <CommunityProvider>
      <UserProvider>
        <VenuesProvider>
          <ChatProvider>
            <MainApp />
          </ChatProvider>
        </VenuesProvider>
      </UserProvider>
    </CommunityProvider>
  </GestureHandlerRootView>
);

export default App;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  splashContainer: {
    flex: 1,
  },
});
