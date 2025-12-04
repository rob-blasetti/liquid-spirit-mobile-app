import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import themeVariables from '../styles/theme';
import Chat from '../screens/Chat';
import ChatDetail from '../screens/ChatDetail';
import NewMessage from '../screens/NewMessage';
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

const ChatStackNavigator = () => (
  <Stack.Navigator
    screenOptions={(navProps) => ({
      ...withDefaultHeader(navProps),
      contentStyle: { backgroundColor: 'transparent' },
      cardStyle: { backgroundColor: 'transparent' },
      presentation: 'card',
    })}
  >
    <Stack.Screen name="ChatScreen" component={Chat} options={{ headerShown: false }} />
    <Stack.Screen name="ChatDetail" component={ChatDetail} options={{ title: 'Chat' }} />
    <Stack.Screen
      name="NewMessage"
      component={NewMessage}
      options={{ title: 'New Message', animation: 'slide_from_bottom' }}
    />
  </Stack.Navigator>
);

export default ChatStackNavigator;
