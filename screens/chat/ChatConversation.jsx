import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import { useXmtp } from '@xmtp/react-native-sdk';

const ChatConversation = ({ route }) => {
  const { topic, groupId } = route.params || {};
  const { client } = useXmtp();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!client) return;
    const load = async () => {
      let convo;
      if (topic) {
        const list = await client.conversations.list();
        convo = list.find(c => c.topic === topic);
      } else if (groupId) {
        const groups = await client.conversations.listGroups();
        convo = groups.find(g => g.id === groupId);
      }
      if (!convo) return;
      setConversation(convo);
      await convo.sync();
      const msgs = await convo.messages();
      setMessages(msgs);
    };
    load();
  }, [client, topic, groupId]);

  const send = async () => {
    if (!conversation || !text) return;
    await conversation.send({ text });
    setText('');
    const msgs = await conversation.messages();
    setMessages(msgs);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 4 }}>
            <Text>{item.senderInboxId}: {item.fallback}</Text>
          </View>
        )}
      />
      <TextInput
        value={text}
        onChangeText={setText}
        style={{ borderWidth:1, padding:8, marginBottom:8 }}
      />
      <Button title="Send" onPress={send} />
    </View>
  );
};

export default ChatConversation;
