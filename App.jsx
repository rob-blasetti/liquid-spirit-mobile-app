// no direct React hooks needed; initialization logic moved to useAppInitialization hook
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import themeVariables from './styles/theme';

import { UserProvider, CommunityProvider } from './contexts';
import { useAppInitialization } from './hooks/useAppInitialization';

import { Splash } from './screens';
import AppNavigator from './navigation/AppNavigator';


// Navigation moved into AppNavigator

const MainApp = () => {
  const { initialPosts, homeOverview, showSplash } = useAppInitialization();


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
  <CommunityProvider>
    <UserProvider>
      <MainApp />
    </UserProvider>
  </CommunityProvider>
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