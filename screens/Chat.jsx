import React, { useCallback, useContext, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

import themeVariables from '../styles/theme';
import { UserContext, ChatContext } from '../contexts';
import { API_URL } from '../config';

const getLastMessagePreview = (chat) => {
  const message =
    chat?.lastMessage ||
    chat?.last_message ||
    (Array.isArray(chat?.messages) ? chat.messages[chat.messages.length - 1] : null) ||
    chat?.preview;

  if (!message) return 'Tap to view conversation';

  if (typeof message === 'string') {
    return message;
  }

  const text =
    message?.text ||
    message?.body ||
    message?.content ||
    message?.caption ||
    message?.summary;

  if (typeof text === 'string') {
    return text;
  }

  if (Array.isArray(message?.attachments) && message.attachments.length > 0) {
    return 'Shared an attachment';
  }

  if (typeof message?.status === 'string') {
    return message.status;
  }

  return 'New message available';
};

const buildParticipantsList = (chat) => {
  const rawList =
    chat?.participants ||
    chat?.members ||
    chat?.users ||
    chat?.recipients ||
    chat?.people ||
    chat?.attendees ||
    chat?.userIds ||
    [];

  const entries = Array.isArray(rawList)
    ? rawList
    : Object.values(rawList || {});

  const names = entries
    .map((participant) => {
      if (!participant) return null;
      if (typeof participant === 'string') return participant;
      if (typeof participant === 'number') return participant.toString();

      const first =
        participant.firstName ||
        participant.first_name ||
        participant.givenName ||
        participant.given_name;
      const last =
        participant.lastName ||
        participant.last_name ||
        participant.familyName ||
        participant.family_name;
      const fallback =
        participant.name ||
        participant.displayName ||
        participant.username ||
        participant.email ||
        participant.address ||
        participant.phone ||
        participant._id ||
        participant.id;

      const fullName = [first, last].filter(Boolean).join(' ').trim();
      return fullName || (fallback ? String(fallback) : null);
    })
    .filter(Boolean);

  if (!names.length) return [];

  const uniqueNames = Array.from(new Set(names));
  return uniqueNames;
};

const normalizeParticipantEntry = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'string' || typeof participant === 'number') {
    const name = String(participant).trim();
    if (!name) return null;
    return { id: name, name, avatar: '' };
  }

  if (typeof participant === 'object' && participant.name) {
    return {
      id: participant.id || participant._id || participant.name,
      name: participant.name,
      avatar:
        participant.avatar ||
        participant.avatarUrl ||
        participant.profilePicture ||
        participant.photo ||
        participant.image ||
        '',
    };
  }

  const source =
    participant.details ||
    participant.user ||
    participant.profile ||
    participant.account ||
    participant.refId ||
    participant.ref ||
    participant.reference ||
    participant;

  if (!source) return null;

  const first =
    source.firstName ||
    source.first_name ||
    source.givenName ||
    source.given_name;
  const last =
    source.lastName ||
    source.last_name ||
    source.familyName ||
    source.family_name;
  const fallback =
    source.name ||
    source.displayName ||
    source.username ||
    source.email ||
    source.phoneNumber ||
    source.phone_number ||
    source._id ||
    source.id;

  const name = [first, last]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .trim();

  const id =
    source._id ||
    source.id ||
    source.userId ||
    source.user_id ||
    source.uid ||
    fallback;

  const avatar =
    source.profilePicture ||
    source.avatar ||
    source.avatarUrl ||
    source.photo ||
    source.image ||
    '';

  return {
    id: id ? String(id) : name || String(Date.now()),
    name: name || (fallback ? String(fallback) : 'Member'),
    avatar,
  };
};

const buildParticipantProfiles = (chat) => {
  const rawList =
    chat?.participants ||
    chat?.members ||
    chat?.users ||
    chat?.recipients ||
    chat?.people ||
    chat?.attendees ||
    chat?.userIds ||
    [];

  const entries = Array.isArray(rawList)
    ? rawList
    : Object.values(rawList || {});

  const map = new Map();
  entries.forEach((entry, index) => {
    const profile = normalizeParticipantEntry(entry);
    if (!profile) return;
    const key = profile.id || profile.name || `participant-${index}`;
    if (!map.has(key)) {
      map.set(key, profile);
    }
  });

  if (!map.size) {
    buildParticipantsList(chat).forEach((name, index) => {
      if (!name) return;
      const key = `name-${index}`;
      if (!map.has(key)) {
        map.set(key, { id: key, name, avatar: '' });
      }
    });
  }

  return Array.from(map.values());
};

const resolveChatImageUrl = (chat) => {
  const candidate =
    chat?.avatar ||
    chat?.imageUrl ||
    chat?.image ||
    chat?.photo ||
    chat?.picture ||
    chat?.coverImage ||
    chat?.activityImage ||
    chat?.activity?.imageUrl ||
    '';

  if (!candidate || typeof candidate !== 'string') return '';
  const trimmed = candidate.trim();
  return trimmed;
};

const buildChatAvatarSource = (chat) => {
  const trimmed = resolveChatImageUrl(chat);
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) {
    return { uri: trimmed };
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return { uri: `${API_URL}${normalized}` };
};

const ChatRow = ({ chat, onPress }) => {
  const title =
    chat?.title ||
    chat?.name ||
    chat?.chatName ||
    chat?.roomName ||
    'Conversation';
  const preview = getLastMessagePreview(chat);
  const participants = buildParticipantsList(chat);
  const avatarSource = buildChatAvatarSource(chat);

  return (
    <TouchableOpacity style={styles.chatRow} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.chatAvatarWrapper}>
        {avatarSource ? (
          <FastImage
            source={avatarSource}
            style={styles.chatAvatarImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>
              {title.slice(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.chatContent}>
        <Text style={styles.chatTitle} numberOfLines={1}>
          {title}
        </Text>
        {participants.length > 0 && (
          <Text style={styles.chatParticipants} numberOfLines={1}>
            {participants.join(', ')}
          </Text>
        )}
        <Text style={styles.chatPreview} numberOfLines={2}>
          {preview}
        </Text>
        <View style={styles.chatDivider} />
      </View>
    </TouchableOpacity>
  );
};

const ChatScreen = () => {
  const {
    isLoggedIn,
    setHasNewChatMessages,
    setIsChatTabActive,
    clearChatUnread,
  } = useContext(UserContext);
  const {
    chats,
    loading: chatsLoading,
    error,
    refreshChats,
    hydrated,
    getChatMessages,
    prefetchChatMessages,
    prefetchNewMessageData,
  } = useContext(ChatContext);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;
      refreshChats({ silent: true }).catch(() => {});
    }, [isLoggedIn, refreshChats]),
  );

  useFocusEffect(
    useCallback(() => {
      setIsChatTabActive(true);
      setHasNewChatMessages(false);
      return () => {
        setIsChatTabActive(false);
      };
    }, [setIsChatTabActive, setHasNewChatMessages]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) return;
      prefetchNewMessageData?.({ silent: true }).catch(() => {});
    }, [isLoggedIn, prefetchNewMessageData]),
  );

  const onRefresh = useCallback(() => {
    if (!isLoggedIn) return;
    setRefreshing(true);
    refreshChats({ silent: true })
      .catch(() => {})
      .finally(() => setRefreshing(false));
  }, [isLoggedIn, refreshChats]);

  const handleOpenChat = useCallback(
    (chat) => {
      if (!chat) return;
      const chatId = chat._id || chat.id;
      if (!chatId) return;
      prefetchChatMessages?.(chatId, { silent: true }).catch(() => {});
      clearChatUnread?.(chatId);
      const cachedMessages = getChatMessages?.(chatId)?.messages;
      navigation.navigate('ChatDetail', {
        chatId,
        chatTitle: chat.title || chat.name || chat.chatName || chat.roomName || 'Conversation',
        chatParticipants: buildParticipantProfiles(chat),
        chatImage: resolveChatImageUrl(chat),
        chatRecord: chat,
        chatMessages: cachedMessages,
      });
    },
    [navigation, clearChatUnread, getChatMessages, prefetchChatMessages],
  );

  const renderChat = useCallback(
    ({ item }) => <ChatRow chat={item} onPress={() => handleOpenChat(item)} />,
    [handleOpenChat],
  );
  const keyExtractor = useCallback(
    (item, index) => item?._id || item?.id || `chat-${index}`,
    [],
  );
  const listData = chats;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      {!isLoggedIn ? (
        <View style={styles.centerContent}>
          <Text style={styles.infoTitle}>Sign in to view messages</Text>
          <Text style={styles.infoSubtitle}>
            Chats will appear here once you are logged in.
          </Text>
        </View>
      ) : (chatsLoading && chats.length === 0) || (!hydrated && chats.length === 0) ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={themeVariables.primaryColor} />
          <Text style={styles.loadingText}>Loading conversations…</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderChat}
          contentContainerStyle={
            listData.length === 0 ? styles.emptyListContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeVariables.primaryColor}
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No chats yet. Start a conversation from the web or invite someone
              to chat.
            </Text>
          }
        />
      )}

      {Boolean(error) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  header: {
    marginBottom: 16,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#777',
  },
  listContent: {
    paddingBottom: 48,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 16,
  },
  chatAvatarWrapper: {
    width: 52,
    marginRight: 12,
    alignItems: 'center',
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeVariables.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  chatAvatarText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginBottom: 4,
  },
  chatParticipants: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 13,
    color: '#555',
  },
  chatDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: themeVariables.borderColor,
    marginTop: 12,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: themeVariables.alertErrorBg,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: themeVariables.whiteColor,
    textAlign: 'center',
  },
});
