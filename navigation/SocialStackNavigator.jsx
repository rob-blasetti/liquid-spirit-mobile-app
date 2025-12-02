import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import SocialMediaScreen from '../screens/SocialMedia';
import EventDetailCard from '../screens/EventDetailCard';
import ActivityDetailCard from '../screens/ActivityDetailCard';
import PostDetailCard from '../screens/PostDetailCard';

const Stack = createStackNavigator();

const withDefaultHeader = ({ navigation }) => ({
  headerStyle: { backgroundColor: themeVariables.whiteColor },
  headerTintColor: themeVariables.primaryColor,
  headerTitleStyle: { fontWeight: 'bold', color: themeVariables.blackColor },
  headerBackTitleVisible: false,
  headerLeftContainerStyle: { paddingLeft: 16 },
  headerLeft: () =>
    navigation.canGoBack() ? (
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          backgroundColor: themeVariables.greyColor,
          borderRadius: themeVariables.borderRadiusPill,
          padding: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Ionicons name="chevron-back" color={themeVariables.blackColor} size={20} />
      </TouchableOpacity>
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
