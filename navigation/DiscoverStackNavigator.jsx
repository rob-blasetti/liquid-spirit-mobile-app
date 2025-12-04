import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import themeVariables from '../styles/theme';
import Discover from '../screens/Discover/Discover';
import Events from '../screens/Events';
import Activities from '../screens/Activities';
import EventDetailCard from '../screens/EventDetailCard';
import ActivityDetailCard from '../screens/ActivityDetailCard';
import LiquidGlassIconButton from '../components/LiquidGlassIconButton';

const Stack = createStackNavigator();

const withDefaultHeader = ({ navigation }) => ({
  headerStyle: { backgroundColor: themeVariables.whiteColor },
  headerTintColor: themeVariables.primaryColor,
  headerTitleStyle: { fontWeight: 'bold', color: themeVariables.blackColor },
  headerBackVisible: false,
  headerBackTitleVisible: false,
  headerLeftContainerStyle: { paddingLeft: 16 },
  headerLeft: () =>
    navigation.canGoBack() ? (
      <LiquidGlassIconButton
        iconName="chevron-back"
        iconColor={themeVariables.blackColor}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        hasShadow={false}
      />
    ) : null,
});

const detailScreenOptions = {
  headerTransparent: true,
  headerStyle: { backgroundColor: 'transparent', elevation: 0 },
  headerTitle: '',
  headerShadowVisible: false,
  headerTintColor: themeVariables.blackColor,
  safeAreaInsets: { top: 0 },
};

const DiscoverStackNavigator = () => (
  <Stack.Navigator screenOptions={withDefaultHeader}>
    <Stack.Screen name="DiscoverScreen" component={Discover} options={{ headerShown: false }} />
    <Stack.Screen name="Events" component={Events} options={{ title: 'Events' }} />
    <Stack.Screen name="Activities" component={Activities} options={{ title: 'Activities' }} />
    <Stack.Screen
      name="EventDetailCard"
      component={EventDetailCard}
      options={detailScreenOptions}
    />
    <Stack.Screen
      name="ActivityDetailCard"
      component={ActivityDetailCard}
      options={detailScreenOptions}
    />
  </Stack.Navigator>
);

export default DiscoverStackNavigator;
