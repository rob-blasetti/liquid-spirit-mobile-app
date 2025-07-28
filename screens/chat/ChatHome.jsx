import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import crypto from 'react-native-quick-crypto';
import { useXmtp, Client } from '@xmtp/react-native-sdk';

const ChatHome = ({ navigation }) => {
  const { client, setClient } = useXmtp();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  // initialize XMTP client if none exists
  useEffect(() => {
    if (!client) {
      const key = crypto.getRandomValues(new Uint8Array(32));
      Client.createRandom({ env: 'production', dbEncryptionKey: key })
        .then(setClient)
        .catch(console.error);
    }
  }, [client, setClient]);

  useEffect(() => {
    if (!client) return;
    const load = async () => {
      setLoading(true);
      try {
        const dms = await client.conversations.list();
        const groups = await client.conversations.listGroups();
        setConversations([...dms, ...groups]);
      } catch (err) {
        console.error('Failed loading conversations', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client]);

  const openConversation = (item) => {
    if (item.topic) {
      navigation.navigate('ChatConversation', { topic: item.topic });
    } else {
      navigation.navigate('ChatConversation', { groupId: item.id });
    }
  };

  if (!client || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="New Chat or Group" onPress={() => navigation.navigate('ChatGroupCreate')} />
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.topic || item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openConversation(item)} style={{ padding: 12, borderBottomWidth: 1 }}>
            <Text>{item.topic ? item.topic : item.groupName || item.id}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ChatHome;
