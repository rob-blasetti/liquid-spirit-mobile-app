import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { useXmtp, PublicIdentity } from '@xmtp/react-native-sdk';

const ChatGroupCreate = ({ navigation }) => {
  const { client } = useXmtp();
  const [addresses, setAddresses] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const createGroup = async () => {
    if (!client) return;
    try {
      const addrs = addresses.split(',').map(a => a.trim()).filter(Boolean);
      if (addrs.length === 0) return;
      if (addrs.length === 1) {
        const convo = await client.conversations.findOrCreateDmWithIdentity(
          new PublicIdentity(addrs[0], 'ETHEREUM')
        );
        if (message) await convo.send({ text: message });
        navigation.navigate('ChatConversation', { topic: convo.topic });
      } else {
        const identities = addrs.map(a => new PublicIdentity(a, 'ETHEREUM'));
        const group = await client.conversations.newGroupWithIdentities(identities);
        if (message) await group.send({ text: message });
        navigation.navigate('ChatConversation', { groupId: group.id });
      }
    } catch (err) {
      console.error('Failed to create chat', err);
      setError('Failed to create chat');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        value={addresses}
        onChangeText={setAddresses}
        placeholder="Enter addresses comma separated"
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Optional message"
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />
      <Button title="Create" onPress={createGroup} />
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
};

export default ChatGroupCreate;
