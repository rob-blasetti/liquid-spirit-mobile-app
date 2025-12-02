import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  buildChatParticipantProfiles,
  createChat,
  deriveChatTitleFromChat,
  findExistingActivityChat,
  getActivityChatParticipantProfiles,
  resolveChatImageFromChat,
} from '../../../services/ChatService';
import { resolveActivityImage } from '../Activity/utils/activityHelpers';

const normalizeIdValue = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : '';
  }
  if (typeof value === 'object') {
    const candidate =
      value._id ||
      value.id ||
      value.userId ||
      value.user_id ||
      value.activityId ||
      value.activity_id ||
      value.eventId ||
      value.event_id ||
      value.postId ||
      value.post_id ||
      value.uid ||
      value.email;
    return candidate ? normalizeIdValue(candidate) : '';
  }
  return '';
};

const buildProfileFromUser = (user, fallbackName) => {
  const first = user?.firstName || user?.first_name;
  const last = user?.lastName || user?.last_name;
  const display = user?.displayName || user?.display_name;
  const name = [first, last].filter(Boolean).join(' ').trim() || display || fallbackName;
  const id =
    normalizeIdValue(user) ||
    normalizeIdValue(user?.user) ||
    normalizeIdValue(user?.profile) ||
    normalizeIdValue(user?.account) ||
    normalizeIdValue(user?.ref);
  const avatar =
    user?.profilePicture ||
    user?.avatar ||
    user?.photo ||
    user?.imageUrl ||
    user?.image;
  return { id, name: name || id || fallbackName, avatar: avatar || '' };
};

const uniqueProfiles = (profiles) => {
  const map = new Map();
  profiles.forEach((p, idx) => {
    const key = p.id || p.name || `participant-${idx}`;
    if (!map.has(key)) {
      map.set(key, p);
    }
  });
  return Array.from(map.values());
};

const collectParticipants = ({ context, activity, participantsOverride, committeeMembers, postAuthor }) => {
  if (Array.isArray(participantsOverride) && participantsOverride.length) {
    return uniqueProfiles(participantsOverride);
  }

  if (context === 'activity') {
    const facilitatorProfiles = Array.isArray(activity?.facilitators)
      ? activity.facilitators.map((f, idx) => buildProfileFromUser(f, `Facilitator ${idx + 1}`))
      : [];
    const participantProfiles = Array.isArray(activity?.participants)
      ? activity.participants.map((p, idx) => buildProfileFromUser(p, `Participant ${idx + 1}`))
      : [];
    return uniqueProfiles(
      facilitatorProfiles.length || participantProfiles.length
        ? [...facilitatorProfiles, ...participantProfiles]
        : getActivityChatParticipantProfiles(activity),
    );
  }

  if (context === 'event') {
    if (Array.isArray(committeeMembers) && committeeMembers.length) {
      return uniqueProfiles(committeeMembers.map((m, idx) => buildProfileFromUser(m, `Committee member ${idx + 1}`)));
    }
    return [];
  }

  if (context === 'post') {
    if (postAuthor) {
      return uniqueProfiles([buildProfileFromUser(postAuthor, 'Author')]);
    }
    return [];
  }

  return [];
};

const useChatStarter = ({
  context = 'activity', // 'activity' | 'event' | 'post'
  activity,
  entity,
  entityId,
  token,
  user,
  navigation,
  chatParticipantProfiles,
  committeeMembers,
  postAuthor,
}) => {
  const [startingChat, setStartingChat] = useState(false);
  const latestActivity = useMemo(() => activity || {}, [activity]);
  const contextEntity = entity || latestActivity || {};

  const normalizedContextId = useMemo(() => {
    const sourceId =
      context === 'activity'
        ? normalizeIdValue(latestActivity) || normalizeIdValue(entityId)
        : normalizeIdValue(contextEntity) || normalizeIdValue(entityId);
    return sourceId;
  }, [context, contextEntity, entityId, latestActivity]);

  const fallbackChatTitle = useMemo(() => {
    if (context === 'activity') return `${latestActivity.title || 'Activity'} Chat`;
    if (context === 'event') return `${contextEntity.title || 'Event'} Committee Chat`;
    if (context === 'post') {
      const authorName = postAuthor
        ? buildProfileFromUser(postAuthor, 'Author').name
        : 'Author';
      return `${authorName}`; // direct chat title with author
    }
    return 'Chat';
  }, [context, contextEntity.title, latestActivity.title, postAuthor]);

  const fallbackImage = useMemo(() => {
    if (context === 'activity') return resolveActivityImage(latestActivity);
    if (context === 'event') return contextEntity?.bannerImage || contextEntity?.imageUrl || '';
    if (context === 'post') return contextEntity?.imageUrl || '';
    return '';
  }, [context, contextEntity, latestActivity]);

  const participants = useMemo(() => {
    if (Array.isArray(chatParticipantProfiles) && chatParticipantProfiles.length) {
      return uniqueProfiles(chatParticipantProfiles);
    }
    return collectParticipants({
      context,
      activity: latestActivity,
      participantsOverride: chatParticipantProfiles,
      committeeMembers,
      postAuthor,
    });
  }, [chatParticipantProfiles, context, latestActivity, committeeMembers, postAuthor]);

  const participantIds = useMemo(
    () => Array.from(new Set(participants.map((p) => normalizeIdValue(p.id)).filter(Boolean))),
    [participants],
  );

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
    const authToken = token || user?.token;
    if (!authToken) {
      Alert.alert('Login Required', 'You must be logged in to start a conversation.');
      return;
    }

    setStartingChat(true);
    try {
      // Activity: attempt to reuse an existing chat room if found
      if (context === 'activity' && normalizedContextId) {
        const existingChat = await findExistingActivityChat(normalizedContextId, { token: authToken });
        const existingChatId = normalizeIdValue(existingChat);
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

      if (!normalizedContextId) {
        throw new Error('Unable to determine who to chat with for this item.');
      }

      const payload = {
        name: fallbackChatTitle,
        imageUrl: fallbackImage,
      };

      if (context === 'activity') payload.activityId = normalizedContextId;
      if (context === 'event') payload.eventId = normalizedContextId;
      if (context === 'post') payload.postId = normalizedContextId;
      if (participantIds.length) payload.participantIds = participantIds;

      const response = await createChat(payload, { token: authToken });
      const chatData = response?.data || response?.chat || response || null;
      const newChatId =
        normalizeIdValue(chatData) ||
        normalizeIdValue(chatData?.chat) ||
        normalizeIdValue(chatData?.room) ||
        normalizeIdValue(chatData?.roomId);

      if (!newChatId) {
        throw new Error('Unable to open the chat conversation right now.');
      }

      const createdParticipants = buildChatParticipantProfiles(chatData);

      openChatDetail({
        chatId: newChatId,
        chatTitle: deriveChatTitleFromChat(chatData, fallbackChatTitle),
        chatParticipants: createdParticipants.length ? createdParticipants : participants,
        chatImage: resolveChatImageFromChat(chatData) || fallbackImage,
      });
    } catch (err) {
      console.error('Failed to start chat:', err);
      const message = err?.message || 'Unable to start a chat right now.';
      Alert.alert('Chat Unavailable', message);
    } finally {
      setStartingChat(false);
    }
  }, [
    context,
    fallbackChatTitle,
    fallbackImage,
    normalizedContextId,
    openChatDetail,
    participantIds,
    participants,
    token,
    user,
  ]);

  return { startChat, startingChat };
};

export default useChatStarter;
