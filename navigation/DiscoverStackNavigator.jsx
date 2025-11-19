import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import Discover from '../screens/Discover';
import Events from '../screens/Events';
import Activities from '../screens/Activities';
import EventDetailCard from '../screens/EventDetailCard';
import ActivityDetailCard from '../screens/ActivityDetailCard';

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
