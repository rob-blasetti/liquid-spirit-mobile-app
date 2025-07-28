// no direct React hooks needed; initialization logic moved to useAppInitialization hook
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View, Linking } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import themeVariables from './styles/theme';

import { UserProvider, CommunityProvider } from './contexts';
import {
  AuthProvider,
  UserProfileProvider,
  CommunityProvider as CommunityStateProvider,
  EventsProvider,
  ActivitiesProvider,
  NewsProvider,
  NotificationsProvider,
} from './src/contexts';
import { useAppInitialization } from './hooks/useAppInitialization';

import { Splash } from './screens';
import AppNavigator from './navigation/AppNavigator';
import { XmtpProvider } from '@xmtp/react-native-sdk';

const MainApp = () => {
  const { initialPosts, homeOverview, showSplash } = useAppInitialization();

  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url) console.log('Initial URL:', url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('Received URL:', url);
    });

    return () => sub.remove();
  }, []);

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
  <AuthProvider>
    <UserProfileProvider>
      <CommunityStateProvider>
        <EventsProvider>
          <ActivitiesProvider>
            <NewsProvider>
              <NotificationsProvider>
                <CommunityProvider>
                  <UserProvider>
                    <XmtpProvider>
                      <MainApp />
                    </XmtpProvider>
                  </UserProvider>
                </CommunityProvider>
              </NotificationsProvider>
            </NewsProvider>
          </ActivitiesProvider>
        </EventsProvider>
      </CommunityStateProvider>
    </UserProfileProvider>
  </AuthProvider>
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