import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  buildChatParticipantProfiles,
  createChat,
  deriveChatTitleFromChat,
  findExistingActivityChat,
  getActivityChatParticipantProfiles,
  resolveChatImageFromChat,
} from '../../../../services/ChatService';
import { resolveActivityImage } from '../utils/activityHelpers';

const extractChatIdentifier = (chat) => {
  if (!chat || typeof chat !== 'object') return '';
  const candidates = [
    chat._id,
    chat.id,
    chat.chatId,
    chat.chat_id,
    chat.roomId,
    chat.room_id,
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const value = String(candidate).trim();
    if (value.length) return value;
  }
  return '';
};

const resolveActivityIdentifier = (activity = {}, fallbackId) => {
  const rawActivityId =
    activity._id ||
    activity.id ||
    activity.activityId ||
    activity.activity_id ||
    fallbackId;
  return rawActivityId ? String(rawActivityId).trim() : '';
};

const useChatStarter = ({
  activity,
  activityId,
  token,
  user,
  navigation,
  chatParticipantProfiles,
}) => {
  const [startingChat, setStartingChat] = useState(false);

  const latestActivity = useMemo(() => activity || {}, [activity]);

  const normalizedActivityId = useMemo(
    () => resolveActivityIdentifier(latestActivity, activityId),
    [latestActivity, activityId],
  );

  const fallbackChatTitle = useMemo(
    () => `${latestActivity.title || 'Activity'} Chat`,
    [latestActivity.title],
  );

  const fallbackImage = useMemo(
    () => resolveActivityImage(latestActivity),
    [latestActivity],
  );

  const participants = useMemo(() => {
    if (Array.isArray(chatParticipantProfiles) && chatParticipantProfiles.length) {
      return chatParticipantProfiles;
    }
    return getActivityChatParticipantProfiles(latestActivity);
  }, [chatParticipantProfiles, latestActivity]);

  const openChatDetail = useCallback(
    (params) => {
      if (!navigation) return;
      navigation.navigate('Main', {
        screen: 'Chat',
        params: { screen: 'ChatDetail', params },
      });
    },
    [navigation],
  );

  const startChat = useCallback(async () => {
    if (!latestActivity || Object.keys(latestActivity).length === 0) return;
    const authToken = token || user?.token;
    if (!authToken) {
      Alert.alert('Login Required', 'You must be logged in to start a conversation.');
      return;
    }

    setStartingChat(true);
    try {
      if (normalizedActivityId) {
        const existingChat = await findExistingActivityChat(normalizedActivityId, { token: authToken });
        const existingChatId = extractChatIdentifier(existingChat);
        if (existingChat && existingChatId) {
          const existingParticipants = buildChatParticipantProfiles(existingChat);
          openChatDetail({
            chatId: existingChatId,
            chatTitle: deriveChatTitleFromChat(existingChat, fallbackChatTitle),
            chatParticipants: existingParticipants.length ? existingParticipants : participants,
            chatImage: resolveChatImageFromChat(existingChat) || fallbackImage,
          });
          return;
        }
      }

      if (!normalizedActivityId) {
        throw new Error('Unable to determine the activity identifier for this chat.');
      }

      const payload = {
        activityId: normalizedActivityId,
        name: fallbackChatTitle,
        imageUrl: fallbackImage,
      };

      const response = await createChat(payload, { token: authToken });
      const chatData = response?.data || response?.chat || response || null;
      const newChatId = extractChatIdentifier(chatData);

      if (!newChatId) {
        throw new Error('Unable to open the chat conversation for this activity.');
      }

      const createdParticipants = buildChatParticipantProfiles(chatData);

      openChatDetail({
        chatId: newChatId,
        chatTitle: deriveChatTitleFromChat(chatData, fallbackChatTitle),
        chatParticipants: createdParticipants.length ? createdParticipants : participants,
        chatImage: resolveChatImageFromChat(chatData) || fallbackImage,
      });
    } catch (err) {
      console.error('Failed to start activity chat:', err);
      const message = err?.message || 'Unable to start a chat for this activity right now.';
      Alert.alert('Chat Unavailable', message);
    } finally {
      setStartingChat(false);
    }
  }, [
    fallbackChatTitle,
    fallbackImage,
    normalizedActivityId,
    openChatDetail,
    participants,
    latestActivity,
    token,
    user,
  ]);

  return { startChat, startingChat };
};

export default useChatStarter;
