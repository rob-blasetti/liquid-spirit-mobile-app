import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const CHAT_MESSAGES_BASE = '/api/chat/messages';
const CHATS_BASE = '/api/chats';

const buildQueryString = (params = {}) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null);
  if (!entries.length) return '';
  const query = new URLSearchParams(entries);
  const result = query.toString();
  return result ? `?${result}` : '';
};

const ensureAbsoluteUrl = (path = '') => {
  if (!path) return API_URL;
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? `${API_URL}${path}` : `${API_URL}/${path}`;
};

const getAuthToken = async (providedToken) => {
  if (providedToken) return providedToken;
  const storedToken = await AsyncStorage.getItem('authToken');
  if (!storedToken) {
    throw new Error('User is not authenticated.');
  }
  return storedToken;
};

const serializeBody = (body) => {
  if (body === undefined || body === null) return undefined;
  if (body instanceof FormData || typeof body === 'string') return body;
  return JSON.stringify(body);
};

const parseResponseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
};

const request = async (path, options = {}) => {
  const {
    params,
    headers = {},
    body,
    token,
    skipAuth = false,
    ...fetchOptions
  } = options;

  const urlQuery = params ? buildQueryString(params) : '';
  const url = `${ensureAbsoluteUrl(path)}${urlQuery}`;
  const serializedBody = serializeBody(body);
  const shouldSendJsonHeader = serializedBody !== undefined && !(body instanceof FormData) && typeof serializedBody === 'string';

  const authHeaders = skipAuth ? {} : { Authorization: `Bearer ${await getAuthToken(token)}` };

  const response = await fetch(url, {
    method: 'GET',
    ...fetchOptions,
    headers: {
      Accept: 'application/json',
      ...(shouldSendJsonHeader ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders,
      ...headers,
    },
    ...(serializedBody !== undefined ? { body: serializedBody } : {}),
  });

  const data = await parseResponseBody(response);
  if (!response.ok) {
    const message = (typeof data === 'object' && data?.message) ? data.message : 'Chat service request failed.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const fetchChats = (options = {}) =>
  request(CHATS_BASE, {
    ...options,
  });

export const createChat = (payload, options = {}) =>
  request(`${CHATS_BASE}/create`, {
    method: 'POST',
    body: payload,
    ...options,
  });

export const fetchChatMessages = (chatId, params = {}, options = {}) =>
  request(`/api/chat/${chatId}/messages`, {
    ...options,
    params,
  });

export const sendChatMessage = (payload, options = {}) =>
  request(CHAT_MESSAGES_BASE, {
    method: 'POST',
    body: payload,
    ...options,
  });

export const markMessagesRead = (payload, options = {}) =>
  request(`${CHAT_MESSAGES_BASE}/read`, {
    method: 'POST',
    body: payload,
    ...options,
  });

const resolveUserCandidate = (candidate) => {
  if (candidate && typeof candidate === 'object') {
    return (
      candidate.details ||
      candidate.user ||
      candidate.profile ||
      candidate.account ||
      candidate.refId ||
      candidate.ref ||
      candidate.reference ||
      candidate
    );
  }
  return candidate;
};

const extractUserId = (candidate) => {
  if (!candidate) return '';
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    const value = String(candidate).trim();
    return value.length ? value : '';
  }

  const candidateObject = resolveUserCandidate(candidate);

  const value =
    candidateObject?._id ||
    candidateObject?.id ||
    candidateObject?.userId ||
    candidateObject?.user_id ||
    candidateObject?.uid ||
    candidateObject?.email ||
    candidateObject?.username ||
    candidateObject?.phoneNumber ||
    candidateObject?.phone_number;

  return value ? String(value) : '';
};

const extractUserName = (candidate) => {
  if (!candidate) return '';
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    const trimmed = String(candidate).trim();
    return trimmed.length ? trimmed : '';
  }

  const source = resolveUserCandidate(candidate);
  if (!source || typeof source !== 'object') return '';

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

  const fullName = [first, last]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ')
    .trim();

  if (fullName.length) return fullName;
  return typeof fallback === 'string' ? fallback : '';
};

const extractUserAvatar = (candidate) => {
  const source = resolveUserCandidate(candidate);
  if (!source || typeof source !== 'object') return '';
  const avatarCandidate =
    source.profilePicture ||
    source.avatar ||
    source.avatarUrl ||
    source.photo ||
    source.image ||
    source.picture ||
    source.thumbnail ||
    source.icon;
  if (!avatarCandidate) return '';
  if (typeof avatarCandidate === 'string') return avatarCandidate;
  if (typeof avatarCandidate === 'object' && typeof avatarCandidate.uri === 'string') {
    return avatarCandidate.uri;
  }
  return '';
};

const extractUserProfile = (candidate) => {
  const name = extractUserName(candidate);
  const id = extractUserId(candidate) || name;
  if (!id && !name) return null;
  const avatar = extractUserAvatar(candidate);
  return {
    id: id || String(Date.now()),
    name: name || id || 'Member',
    avatar,
  };
};

const collectActivityChatMembers = (activity = {}) => {
  const ids = new Set();
  const names = new Set();
  const profileMap = new Map();
  const appendFromList = (list = []) => {
    if (!Array.isArray(list)) return;
    list.forEach((entry) => {
      const id = extractUserId(entry);
      if (id) ids.add(id);
      const name = extractUserName(entry);
      if (name) names.add(name);
      const profile = extractUserProfile(entry);
      if (profile) {
        const key = profile.id || profile.name;
        if (!profileMap.has(key)) {
          profileMap.set(key, profile);
        }
      }
    });
  };

  appendFromList(activity.facilitators);
  appendFromList(activity.participants);
  appendFromList(activity.members);
  appendFromList(activity.attendees);
  appendFromList(activity.guests);

  const appendFromSession = (session = {}) => {
    appendFromList(session.facilitators);
    appendFromList(session.participants);
    appendFromList(session.attendees);
    appendFromList(session.members);
    appendFromList(session.users);

    const singleEntries = [
      session.host,
      session.createdBy,
      session.owner,
      session.lead,
    ];
    singleEntries.forEach((candidate) => {
      const id = extractUserId(candidate);
      if (id) ids.add(id);
    });
  };

  if (Array.isArray(activity.sessions)) {
    activity.sessions.forEach((session) => {
      appendFromSession(session || {});
    });
  }

  const ownerCandidates = [
    activity.createdBy,
    activity.owner,
    activity.host,
    activity.organizer,
  ];

  ownerCandidates.forEach((candidate) => {
    const id = extractUserId(candidate);
    if (id) ids.add(id);
    const name = extractUserName(candidate);
    if (name) names.add(name);
    const profile = extractUserProfile(candidate);
    if (profile) {
      const key = profile.id || profile.name;
      if (!profileMap.has(key)) {
        profileMap.set(key, profile);
      }
    }
  });

  return {
    ids: Array.from(ids),
    names: Array.from(names),
    profiles: Array.from(profileMap.values()),
  };
};

export const getActivityChatParticipantNames = (activity = {}) => {
  const { names } = collectActivityChatMembers(activity);
  return names;
};

export const getActivityChatParticipantProfiles = (activity = {}) => {
  const { profiles } = collectActivityChatMembers(activity);
  return profiles;
};

const deriveActivityChatTitle = (activity = {}) => {
  if (!activity) return 'Activity Chat';
  const baseTitle = activity.title || activity.name || 'Activity';
  return `${baseTitle} Chat`;
};

const extractChatIdFromPayload = (payload, visited = new Set()) => {
  if (!payload) {
    return '';
  }

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const nestedId = extractChatIdFromPayload(entry, visited);
      if (nestedId) return nestedId;
    }
    return '';
  }

  if (typeof payload !== 'object') {
    return '';
  }

  if (visited.has(payload)) {
    return '';
  }
  visited.add(payload);

  const candidates = [
    payload.chatId,
    payload.chat_id,
    payload.chatID,
    payload._id,
    payload.id,
    payload.roomId,
    payload.room_id,
    payload.conversationId,
    payload.conversation_id,
  ];

  const found = candidates.find(
    (candidate) => candidate !== undefined && candidate !== null,
  );

  if (found !== undefined) {
    const value = String(found);
    return value.length ? value : '';
  }

  const nestedKeys = [
    'chat',
    'data',
    'result',
    'payload',
    'response',
    'conversation',
    'room',
    'item',
  ];

  for (const key of nestedKeys) {
    if (payload[key]) {
      const nestedId = extractChatIdFromPayload(payload[key], visited);
      if (nestedId) return nestedId;
    }
  }

  if (Array.isArray(payload.chats) && payload.chats.length > 0) {
    const nestedId = extractChatIdFromPayload(payload.chats[0], visited);
    if (nestedId) return nestedId;
  }

  if (Array.isArray(payload.results) && payload.results.length > 0) {
    const nestedId = extractChatIdFromPayload(payload.results[0], visited);
    if (nestedId) return nestedId;
  }

  return '';
};

const extractChatTitleFromPayload = (payload, visited = new Set()) => {
  if (!payload) return '';

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      const nestedTitle = extractChatTitleFromPayload(entry, visited);
      if (nestedTitle) return nestedTitle;
    }
    return '';
  }

  const resolveTitle = (data) => {
    if (!data || typeof data !== 'object') return '';
    const title =
      data.title ||
      data.name ||
      data.chatName ||
      data.roomName ||
      data.topic ||
      data.subject;
    return title ? String(title) : '';
  };

  const directTitle = resolveTitle(payload);
  if (directTitle) return directTitle;

  if (visited.has(payload)) {
    return '';
  }
  visited.add(payload);

  const nestedSources = [
    payload.chat,
    payload.data,
    payload.result,
    payload.payload,
  ];

  for (const source of nestedSources) {
    const nestedTitle = resolveTitle(source);
    if (nestedTitle) return nestedTitle;
  }

  if (Array.isArray(payload.chats) && payload.chats.length > 0) {
    const nestedTitle = extractChatTitleFromPayload(payload.chats[0]);
    if (nestedTitle) return nestedTitle;
  }

  if (Array.isArray(payload.results) && payload.results.length > 0) {
    const nestedTitle = extractChatTitleFromPayload(payload.results[0]);
    if (nestedTitle) return nestedTitle;
  }

  return '';
};

export const startActivityConversation = async (activity, options = {}) => {
  if (!activity) {
    throw new Error('Activity details are required to start a conversation.');
  }
  const { token, currentUserId, extraUserIds = [], activityId: activityIdOverride } = options;

  if (!token) {
    throw new Error('You must be logged in to start a chat conversation.');
  }

  const {
    ids: collectedIds,
    names: collectedNames,
    profiles: collectedProfiles,
  } = collectActivityChatMembers(activity);
  const memberIds = new Set(collectedIds);

  if (currentUserId) {
    memberIds.add(String(currentUserId));
  }

  extraUserIds.forEach((id) => {
    if (id) {
      memberIds.add(String(id));
    }
  });

  const participants = Array.from(memberIds).filter(Boolean);

  if (participants.length < 2) {
    throw new Error('Not enough participants to start a group chat yet.');
  }

  const activityId =
    activityIdOverride ||
    activity._id ||
    activity.id ||
    activity.activityId ||
    activity.activity_id ||
    activity.slug ||
    '';

  const chatTitle = deriveActivityChatTitle(activity);
  const chatAvatar =
    activity.imageUrl ||
    activity.imageURL ||
    activity.bannerUrl ||
    activity.bannerURL ||
    activity.heroImage ||
    activity.photo ||
    activity.image ||
    '';
  const requestPayload = {
    name: chatTitle,
    title: chatTitle,
    avatar: chatAvatar,
    image: chatAvatar,
    photo: chatAvatar,
    imageUrl: chatAvatar,
    image_url: chatAvatar,
    participantIds: participants,
    participants,
    userIds: participants,
    memberIds: participants,
    activityId,
    activity_id: activityId,
    metadata: {
      type: 'activity',
      activityId,
      activityTitle: activity.title || activity.name || '',
    },
  };

  const response = await createChat(requestPayload, { token });
  const chatId = extractChatIdFromPayload(response) || extractChatIdFromPayload(response?.chat || {});
  const responseTitle =
    extractChatTitleFromPayload(response) ||
    extractChatTitleFromPayload(response?.chat || {}) ||
    chatTitle;

  return {
    chatId,
    chatTitle: responseTitle,
    chatParticipants: collectedProfiles,
    chatImage: chatAvatar,
    response,
  };
};
