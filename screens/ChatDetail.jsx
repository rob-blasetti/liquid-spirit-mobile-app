import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { fetchChatMessages, sendChatMessage, markMessagesRead } from '../services/ChatService';
import { initializeSocket, joinChatRoom } from '../services/SocketService';
import { API_URL } from '../config';
import FastImage from 'react-native-fast-image';

const normalizeMessages = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.messages)) return payload.messages;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const getMessageText = (message) => {
  if (!message) return '';
  if (typeof message === 'string') return message;
  const text =
    message.text ||
    message.body ||
    message.content ||
    message.caption ||
    message.summary;
  if (typeof text === 'string') return text;
  if (Array.isArray(message.attachments) && message.attachments.length > 0) {
    return 'Attachment';
  }
  return '';
};

const getSenderName = (message) => {
  const sender =
    message?.sender ||
    message?.author ||
    message?.user ||
    message?.from ||
    message?.owner;
  if (!sender) return 'Unknown';
  if (typeof sender === 'string') return sender;
  const first =
    sender.firstName ||
    sender.first_name ||
    sender.givenName ||
    sender.given_name;
  const last =
    sender.lastName ||
    sender.last_name ||
    sender.familyName ||
    sender.family_name;
  const fallback =
    sender.name ||
    sender.displayName ||
    sender.username ||
    sender.email ||
    sender._id ||
    sender.id;
  const fullName = [first, last].filter(Boolean).join(' ').trim();
  return fullName || (fallback ? String(fallback) : 'Unknown');
};

const getSenderInitials = (name) => {
  if (!name) return '';
  const parts = String(name).trim().split(/\s+/);
  const initials =
    parts.length === 1
      ? parts[0].slice(0, 2)
      : `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`;
  return initials.toUpperCase();
};

const resolveAvatarSource = (sender) => {
  if (!sender) return null;

  if (typeof sender === 'string') {
    const trimmed = sender.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) {
      return { uri: trimmed };
    }
    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return { uri: `${API_URL}${normalized}` };
  }

  if (typeof sender === 'object' && sender.uri) {
    return sender;
  }

  const uriCandidate =
    sender?.profilePicture ||
    sender?.avatar ||
    sender?.avatarUrl ||
    sender?.photo ||
    sender?.image;

  if (!uriCandidate) return null;
  if (typeof uriCandidate === 'object' && uriCandidate.uri) return uriCandidate;
  if (typeof uriCandidate !== 'string') return null;
  if (/^https?:\/\//i.test(uriCandidate) || /^data:/i.test(uriCandidate)) {
    return { uri: uriCandidate };
  }
  const normalized = uriCandidate.startsWith('/')
    ? uriCandidate
    : `/${uriCandidate}`;
  return { uri: `${API_URL}${normalized}` };
};

const extractChatIdFromSocketPayload = (payload = {}) => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const candidates = [
    payload.chatId,
    payload.chat_id,
    payload.chatID,
    payload.roomId,
    payload.room_id,
    payload.conversationId,
    payload.conversation_id,
    payload.channelId,
    payload.channel_id,
    payload.id,
    payload.chat?.id,
    payload.chat?._id,
    payload.chat?.chatId,
    payload.chat?.chat_id,
    payload.message?.chatId,
    payload.message?.chat_id,
    payload.message?.chat?.id,
    payload.message?.chat?._id,
    payload.message?.chat?.chatId,
    payload.data?.chatId,
    payload.data?.chat?.id,
    payload.data?.chat?._id,
  ];

  const found = candidates.find((value) => value !== undefined && value !== null);
  return found == null ? '' : String(found);
};

const normalizeParticipantEntry = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'string' || typeof participant === 'number') {
    const name = String(participant).trim();
    if (!name) return null;
    return { id: name, name, avatar: '' };
  }

  if (typeof participant === 'object' && participant.name && participant.id) {
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

  if (!source || typeof source !== 'object') return null;

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

  const avatar =
    source.profilePicture ||
    source.avatar ||
    source.avatarUrl ||
    source.photo ||
    source.image ||
    source.picture ||
    '';

  const id =
    source._id ||
    source.id ||
    source.userId ||
    source.user_id ||
    source.uid ||
    fallback;

  return {
    id: id ? String(id) : name || String(Date.now()),
    name: name || (fallback ? String(fallback) : 'Member'),
    avatar: avatar ? String(avatar) : '',
  };
};

const buildParticipantProfilesFromEntries = (entries) => {
  if (!entries) return [];
  const list = Array.isArray(entries) ? entries : Object.values(entries || {});
  const map = new Map();
  list.forEach((entry, index) => {
    const profile = normalizeParticipantEntry(entry);
    if (!profile) return;
    const key = profile.id || profile.name || `participant-${index}`;
    if (!map.has(key)) {
      map.set(key, profile);
    }
  });
  return Array.from(map.values());
};

const extractParticipantProfilesFromPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return [];
  const sources = [payload, payload.chat, payload.data, payload.result, payload.payload];
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    const candidates =
      source.participants ||
      source.members ||
      source.users ||
      source.attendees ||
      source.recipients ||
      source.memberNames ||
      source.member_names;
    const profiles = buildParticipantProfilesFromEntries(candidates);
    if (profiles.length) return profiles;
  }
  return [];
};

const extractParticipantsFromMessages = (messages) => {
  if (!Array.isArray(messages)) return [];
  const map = new Map();
  messages.forEach((message, index) => {
    const senderName = getSenderName(message);
    if (senderName) {
      const key = senderName.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { id: key, name: senderName, avatar: '' });
      }
    }
    const additional =
      message?.participants ||
      message?.members ||
      message?.recipients ||
      message?.users;
    buildParticipantProfilesFromEntries(additional).forEach((profile, idx) => {
      const key = profile.id || profile.name || `message-${index}-${idx}`;
      if (!map.has(key)) {
        map.set(key, profile);
      }
    });
  });
  return Array.from(map.values());
};

const extractChatImageFromPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return '';
  const sources = [payload, payload.chat, payload.data?.chat, payload.result?.chat];
  const keys = ['avatar', 'imageUrl', 'image_url', 'image', 'photo', 'picture', 'banner', 'bannerUrl', 'banner_url'];
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  return '';
};

const normalizeImageUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_URL}${normalized}`;
};

const extractParticipantsFromParams = (params) => {
  if (!params || typeof params !== 'object') return [];
  const candidates = [
    params.chatParticipants,
    params.participants,
    params.memberNames,
    params.members,
  ];
  for (const entry of candidates) {
    const profiles = buildParticipantProfilesFromEntries(entry);
    if (profiles.length) return profiles;
  }
  return [];
};

const HERO_BASE_HEIGHT = 260;

const ChatDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    token,
    user,
    setHasNewChatMessages,
    setIsChatTabActive,
    refreshChatBadgeFromServer,
    clearChatUnread,
  } = useContext(UserContext);

  const chatId = route?.params?.chatId;
  const chatTitle = route?.params?.chatTitle || 'Chat';
  const routeChatImage = route?.params?.chatImage;
  const initialParticipantProfiles = useMemo(
    () => extractParticipantsFromParams(route?.params),
    [route?.params],
  );
  const initialChatImage = useMemo(
    () => normalizeImageUrl(routeChatImage),
    [routeChatImage],
  );
  const currentUserId = useMemo(
    () => user?._id || user?.id || user?.userId || null,
    [user],
  );

  const [messages, setMessages] = useState([]);
  const [chatParticipants, setChatParticipants] = useState(initialParticipantProfiles);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [participantsExpanded, setParticipantsExpanded] = useState(false);
  const [chatImageUrl, setChatImageUrl] = useState(initialChatImage);
  const insets = useSafeAreaInsets();
  const heroTopInset = useMemo(() => Math.max(insets.top, 0), [insets.top]);
  const heroBannerStyle = useMemo(
    () => ({
      height: HERO_BASE_HEIGHT + heroTopInset,
      marginTop: -heroTopInset,
    }),
    [heroTopInset],
  );
  const bannerTopBarStyle = useMemo(
    () => ({
      paddingTop: heroTopInset + 12,
    }),
    [heroTopInset],
  );
  const fallbackHeaderStyle = useMemo(
    () => ({
      paddingTop: heroTopInset + 12,
    }),
    [heroTopInset],
  );
  const hasChatImage = Boolean(chatImageUrl);
  const bannerBottomOverlayStyle = useMemo(
    () => ({
      paddingBottom: 12,
      paddingTop: 8,
    }),
    [],
  );
  const composerInsetsStyle = useMemo(
    () => ({
      paddingBottom: 20 + Math.max(insets.bottom, 0),
    }),
    [insets.bottom],
  );

  const resolveSenderId = useCallback((message) => {
    const sender =
      message?.sender ||
      message?.author ||
      message?.user ||
      message?.from ||
      message?.owner;
    if (!sender) {
      const fallback = message?.userId || message?.user_id || message?.senderId;
      return fallback ? String(fallback) : '';
    }
    if (typeof sender === 'string') return sender;
    return (
      sender._id ||
      sender.id ||
      sender.userId ||
      sender.user_id ||
      sender.uid ||
      sender.email ||
      sender.username ||
      ''
    ).toString();
  }, []);

  const hasCurrentUserReadMessage = useCallback(
    (message) => {
      if (!currentUserId) return false;
      const entries = Array.isArray(message?.readBy) ? message.readBy : [];
      return entries.some((entry) => {
        const entryUser =
          entry?.user?._id ||
          entry?.user?.id ||
          entry?.user ||
          entry?.userId ||
          entry?.id;
        return entryUser && String(entryUser) === String(currentUserId);
      });
    },
    [currentUserId],
  );

  const isMessageFromCurrentUser = useCallback(
    (message) => {
      if (!currentUserId) return false;
      const senderId = resolveSenderId(message);
      return senderId && String(senderId) === String(currentUserId);
    },
    [currentUserId, resolveSenderId],
  );

  const getUnreadMessageIds = useCallback(
    (list) => {
      if (!Array.isArray(list) || !currentUserId) return [];
      const collected = [];
      const seen = new Set();
      list.forEach((message) => {
        const messageId = message?._id || message?.id;
        if (!messageId || seen.has(messageId)) return;
        if (isMessageFromCurrentUser(message)) return;
        if (hasCurrentUserReadMessage(message)) return;
        seen.add(messageId);
        collected.push(messageId);
      });
      return collected;
    },
    [currentUserId, isMessageFromCurrentUser, hasCurrentUserReadMessage],
  );

  const markMessagesAsRead = useCallback(
    async (messagesList) => {
      if (!chatId || !token || !currentUserId) return;
      const unreadIds = getUnreadMessageIds(messagesList);
      if (!unreadIds.length) return;
      try {
        await markMessagesRead(
          {
            chatId,
            messageIds: unreadIds,
          },
          { token },
        );
      } catch (err) {
        console.warn(
          '[ChatDetail] Unable to mark messages read:',
          err?.message || err,
        );
      }
    },
    [chatId, token, currentUserId, getUnreadMessageIds],
  );

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    setChatParticipants(initialParticipantProfiles);
  }, [initialParticipantProfiles]);

  useEffect(() => {
    if (routeChatImage) {
      setChatImageUrl(normalizeImageUrl(routeChatImage));
    }
  }, [routeChatImage]);

  useEffect(() => {
    if (!chatParticipants.length && participantsExpanded) {
      setParticipantsExpanded(false);
    }
  }, [chatParticipants, participantsExpanded]);

  const loadMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (!chatId || !token) return;
      setError('');
      if (!silent) setLoading(true);
      try {
        const response = await fetchChatMessages(chatId, { limit: 200 }, { token });
        const normalized = normalizeMessages(response);
        setMessages(normalized);
        const payloadParticipants = extractParticipantProfilesFromPayload(response);
        if (payloadParticipants.length) {
          setChatParticipants(payloadParticipants);
        } else {
          setChatParticipants((prev) => {
            if (prev.length) return prev;
            const derived = extractParticipantsFromMessages(normalized);
            return derived.length ? derived : prev;
          });
        }
        const payloadImage = normalizeImageUrl(extractChatImageFromPayload(response));
        if (payloadImage) {
          setChatImageUrl(payloadImage);
        }
        refreshChatBadgeFromServer?.();
        clearChatUnread?.(chatId);
        markMessagesAsRead(normalized);
      } catch (err) {
        const message = err?.message || 'Unable to load messages.';
        setError(message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [chatId, token, refreshChatBadgeFromServer, clearChatUnread, markMessagesAsRead],
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useFocusEffect(
    useCallback(() => {
      setIsChatTabActive(true);
      setHasNewChatMessages(false);
      if (chatId) {
        clearChatUnread?.(chatId);
      }
      return () => {
        setIsChatTabActive(false);
      };
    }, [setIsChatTabActive, setHasNewChatMessages, chatId, clearChatUnread]),
  );

  useEffect(() => {
    if (!chatId) return;
    const socket = initializeSocket({ token });
    if (!socket) return;

    const cleanupRoom = joinChatRoom(socket, chatId, token);

    const events = [
      'chat-message',
      'chat:message',
      'chat:new-message',
      'message-created',
      'chat-message-created',
      'chat:message:created',
      'message',
    ];
    const handler = (payload = {}) => {
      const eventChat = extractChatIdFromSocketPayload(payload);
      if (eventChat && eventChat !== String(chatId)) {
        return;
      }
      loadMessages({ silent: true });
    };

    events.forEach((event) => {
      socket.off(event, handler);
      socket.on(event, handler);
    });

    return () => {
      events.forEach((event) => socket.off(event, handler));
      cleanupRoom();
    };
  }, [chatId, token, loadMessages]);

  const onRefresh = useCallback(() => {
    if (!chatId || !token) return;
    setRefreshing(true);
    loadMessages({ silent: true }).finally(() => setRefreshing(false));
  }, [chatId, token, loadMessages]);

  const renderMessage = useCallback(({ item }) => {
    const senderName = getSenderName(item);
    const messageText = getMessageText(item);
    const createdAt = item?.createdAt || item?.created_at;
    const timestamp = createdAt ? new Date(createdAt).toLocaleString() : '';
    const avatarSource = resolveAvatarSource(item?.sender);
    const initials = getSenderInitials(senderName);

    return (
      <View style={styles.messageRow}>
        {avatarSource ? (
          <Image source={avatarSource} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>{initials || '?'}</Text>
          </View>
        )}
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageSender}>{senderName}</Text>
            {timestamp ? (
              <Text style={styles.messageTimestamp}>{timestamp}</Text>
            ) : null}
          </View>
          <Text style={styles.messageText}>{messageText || ' '}</Text>
        </View>
      </View>
    );
  }, []);

  const keyExtractor = useCallback(
    (item, index) => item?._id || item?.id || `message-${index}`,
    [],
  );

  const handleSendMessage = useCallback(async () => {
    const trimmed = messageText.trim();
    if (!trimmed || sending || !chatId || !token) return;
    setSending(true);
    setError('');
    try {
      await sendChatMessage(
        {
          chatId,
          chat_id: chatId,
          message: trimmed,
          text: trimmed,
          body: trimmed,
          content: trimmed,
        },
        { token },
      );
      setMessageText('');
      await loadMessages({ silent: true });
    } catch (err) {
      const message = err?.message || 'Unable to send message.';
      setError(message);
    } finally {
      setSending(false);
    }
  }, [messageText, sending, chatId, token, loadMessages]);

  const canSend = Boolean(messageText.trim()) && !sending && Boolean(chatId);
  const participantNamesSummary = useMemo(
    () => chatParticipants.map((participant) => participant.name).join(', '),
    [chatParticipants],
  );
  const handleOpenParticipant = useCallback(
    (participant) => {
      if (!participant) return;
      const userId =
        participant.userId ||
        participant.user_id ||
        participant.id ||
        participant._id ||
        participant.uid ||
        participant.email;
      if (!userId) return;
      navigation.navigate('PublicUserProfile', { userId });
    },
    [navigation],
  );
const participantsSection = chatParticipants.length ? (
  <View style={styles.contentWrapper}>
    <View style={styles.participantsContainer}>
        <View style={styles.participantsHeader}>
          <View style={styles.participantsPreviewText}>
            <Text style={styles.participantsLabel}>Participants</Text>
            {!participantsExpanded ? (
              <Text style={styles.participantsNames} numberOfLines={2}>
                {participantNamesSummary}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => setParticipantsExpanded((prev) => !prev)}
            style={styles.participantsToggleButton}
          >
            {!participantsExpanded ? (
              <Text style={styles.participantsToggleText}>View all</Text>
            ) : null}
          </TouchableOpacity>
        </View>
        {participantsExpanded ? (
          <>
            {chatParticipants.map((participant, index) => {
              const avatarUri = normalizeImageUrl(participant.avatar);
              const avatarSource = avatarUri ? { uri: avatarUri } : null;
              const key = participant.id || participant.name || `participant-${index}`;
              const initials = getSenderInitials(participant.name);
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.participantRow}
                  onPress={() => handleOpenParticipant(participant)}
                  activeOpacity={0.85}
                >
                  {avatarSource ? (
                    <FastImage source={avatarSource} style={styles.participantAvatar} />
                  ) : (
                    <View style={styles.participantAvatarPlaceholder}>
                      <Text style={styles.participantAvatarPlaceholderText}>{initials || '?'}</Text>
                    </View>
                  )}
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.participantsHideButton}
              onPress={() => setParticipantsExpanded(false)}
            >
              <Text style={styles.participantsHideButtonText}>Hide participants</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.participantsPreview}>
            <Text style={styles.participantsLabel}>{chatParticipants.length} total</Text>
          </View>
        )}
      </View>
    </View>
  ) : null;

  return (
    <View style={styles.screen}>
      <StatusBar
        translucent
        animated
        backgroundColor="transparent"
        barStyle={hasChatImage ? 'light-content' : 'dark-content'}
        hidden={hasChatImage}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
      >
        <FlatList
          style={styles.list}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponentStyle={styles.listHeaderComponent}
          contentContainerStyle={
            messages.length === 0 ? styles.emptyListContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeVariables.primaryColor}
            />
          }
          ListHeaderComponent={
            <View>
              {hasChatImage ? (
                <View style={[styles.heroContainer, heroBannerStyle]}>
                  <FastImage
                    source={{ uri: chatImageUrl }}
                    style={styles.bannerImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                  <View style={[styles.bannerTopBar, bannerTopBarStyle]}>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.bannerBackButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chevron-back" size={18} color={themeVariables.blackColor} />
                  </TouchableOpacity>
                  </View>
                  <View style={[styles.bannerBottomOverlay, bannerBottomOverlayStyle]}>
                    <Text style={styles.bannerTitle} numberOfLines={2}>
                      {chatTitle}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.fallbackHeader, fallbackHeaderStyle]}>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.fallbackBackButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="chevron-back" size={20} color={themeVariables.blackColor} />
                  </TouchableOpacity>
                  <Text style={styles.fallbackTitle} numberOfLines={2}>
                    {chatTitle}
                  </Text>
                </View>
              )}
              {chatParticipants.length > 0 && participantsSection}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyStateWrapper}>
              {loading ? (
                <>
                  <ActivityIndicator size="large" color={themeVariables.primaryColor} />
                  <Text style={styles.loadingText}>Loading conversation…</Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyText}>No messages yet.</Text>
                  <Text style={styles.loadingText}>Send the first message below.</Text>
                </>
              )}
            </View>
          }
        />
        <View style={[styles.composerContainer, composerInsetsStyle]}>
          <TextInput
            style={styles.composerInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message"
            placeholderTextColor="#888"
            multiline
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {sending ? (
              <ActivityIndicator size="small" color={themeVariables.whiteColor} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {Boolean(error) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default ChatDetail;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  flex: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listHeaderComponent: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  listContent: {
    paddingBottom: 140,
  },
  emptyListContainer: {
    flexGrow: 1,
    paddingBottom: 140,
  },
  emptyStateWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    width: '100%',
    height: HERO_BASE_HEIGHT,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#ddd',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerTopBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeVariables.whiteColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  bannerBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  fallbackHeader: {
    backgroundColor: themeVariables.whiteColor,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fallbackBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeVariables.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: themeVariables.blackColor,
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  participantsContainer: {
    backgroundColor: '#f5f5fc',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsPreviewText: {
    flex: 1,
    marginRight: 12,
  },
  participantsLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#666',
  },
  participantsNames: {
    fontSize: 14,
    color: themeVariables.blackColor,
  },
  participantsToggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  participantsToggleText: {
    color: themeVariables.primaryColor,
    fontWeight: '600',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  participantAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: themeVariables.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarPlaceholderText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
  participantName: {
    fontSize: 15,
    color: themeVariables.blackColor,
  },
  participantInfo: {
    flex: 1,
  },
  participantsHideButton: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  participantsHideButtonText: {
    color: themeVariables.primaryColor,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    color: '#777',
  },
  listContent: {
    paddingBottom: 96,
  },
  emptyListContainer: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  emptyText: {
    color: '#777',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderColor,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: themeVariables.darkGreyColor,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: themeVariables.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  messageSender: {
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  messageText: {
    fontSize: 15,
    color: themeVariables.blackColor,
    marginTop: 4,
    marginBottom: 4,
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#777',
    marginLeft: 8,
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
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: themeVariables.borderColor,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: themeVariables.borderColor,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: themeVariables.blackColor,
    backgroundColor: themeVariables.whiteColor,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: themeVariables.primaryColor,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
});
