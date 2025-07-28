import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatHome from '../screens/chat/ChatHome';
import ChatGroupCreate from '../screens/chat/ChatGroupCreate';
import ChatConversation from '../screens/chat/ChatConversation';

const Stack = createNativeStackNavigator();

const ChatNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="ChatHome" component={ChatHome} options={{ title: 'Chats' }} />
    <Stack.Screen name="ChatGroupCreate" component={ChatGroupCreate} options={{ title: 'New Chat' }} />
    <Stack.Screen name="ChatConversation" component={ChatConversation} options={{ title: 'Conversation' }} />
  </Stack.Navigator>
);

export default ChatNavigator;
