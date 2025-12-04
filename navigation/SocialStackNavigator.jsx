import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import themeVariables from '../styles/theme';
import SocialMediaScreen from '../screens/SocialMedia';
import EventDetailCard from '../screens/EventDetailCard';
import ActivityDetailCard from '../screens/ActivityDetailCard';
import PostDetailCard from '../screens/PostDetailCard';
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

const SocialStackNavigator = ({ initialPosts, scrollToTop }) => (
  <Stack.Navigator
    screenOptions={(navProps) => ({
      ...withDefaultHeader(navProps),
      contentStyle: { backgroundColor: 'transparent' },
      cardStyle: { backgroundColor: 'transparent' },
      presentation: 'card',
    })}
  >
    <Stack.Screen name="SocialFeed" options={{ headerShown: false }}>
      {(props) => (
        <SocialMediaScreen
          {...props}
          initialPosts={initialPosts}
          scrollToTop={scrollToTop}
        />
      )}
    </Stack.Screen>
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
    <Stack.Screen
      name="PostDetailCard"
      component={PostDetailCard}
      options={detailScreenOptions}
    />
  </Stack.Navigator>
);

export default SocialStackNavigator;
