import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import Chat from '../screens/Chat';
import ChatDetail from '../screens/ChatDetail';
import NewMessage from '../screens/NewMessage';

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

const ChatStackNavigator = () => (
  <Stack.Navigator screenOptions={withDefaultHeader}>
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
