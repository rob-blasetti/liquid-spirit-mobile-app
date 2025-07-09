// no direct React hooks needed; initialization logic moved to useAppInitialization hook
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import themeVariables from './styles/theme';

import { UserProvider } from './contexts';
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
        <AppNavigator initialPosts={initialPosts} homeOverview={homeOverview} />
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