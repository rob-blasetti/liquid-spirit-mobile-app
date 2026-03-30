import { getStoredAccessToken } from '../utils/authTokenStorage';
import { API_URL } from '../config';

const CHATS_BASE = '/api/chat';
const CHAT_MESSAGES_BASE = `${CHATS_BASE}/messages`;

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

const normalizeIdValue = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : '';
  }
  if (typeof value === 'object') {
    if (value._id || value.id) {
      const candidate = value._id || value.id;
      if (candidate) return normalizeIdValue(candidate);
    }
    if (typeof value.toString === 'function') {
      const candidate = String(value.toString()).trim();
      if (candidate && candidate !== '[object Object]') {
        return candidate;
      }
    }
  }
  return '';
};

const normalizeChatList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.chats)) return payload.chats;
  if (Array.isArray(payload.items)) return payload.items;

  if (Array.isArray(payload?.data?.chats)) return payload.data.chats;
  if (Array.isArray(payload?.result?.chats)) return payload.result.chats;
  if (Array.isArray(payload?.payload?.chats)) return payload.payload.chats;

  return [];
};

const normalizeChatActivitiesList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.activities)) return payload.activities;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload?.data?.activities)) return payload.data.activities;
  return [];
};

const extractParticipantSource = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'object') {
    return (
      participant.details ||
      participant.user ||
      participant.profile ||
      participant.account ||
      participant.refId ||
      participant.ref ||
      participant.reference ||
      participant
    );
  }
  return participant;
};

const buildChatParticipantProfilesFromEntries = (entries) => {
  if (!entries || (Array.isArray(entries) && entries.length === 0)) return [];
  const list = Array.isArray(entries) ? entries : Object.values(entries || {});
  const map = new Map();
  list.forEach((entry, index) => {
    const source =
      typeof entry === 'object' ? extractParticipantSource(entry) : null;
    const normalizedSource = source || entry;
    const name =
      extractUserName(normalizedSource) ||
      (typeof normalizedSource === 'string' ? normalizedSource : '') ||
      `Participant ${index + 1}`;
    const avatar = extractUserAvatar(normalizedSource);
    const id =
      normalizeIdValue(
        normalizedSource?._id ||
          normalizedSource?.id ||
          normalizedSource?.userId ||
          normalizedSource?.user_id ||
          normalizedSource?.uid ||
          normalizedSource?.email,
      ) ||
      normalizeIdValue(entry) ||
      name ||
      `participant-${index}`;

    const profile = {
      id,
      name,
      avatar: avatar || '',
    };
    const key = profile.id || profile.name;
    if (!map.has(key)) {
      map.set(key, profile);
    }
  });
  return Array.from(map.values());
};

export const buildChatParticipantProfiles = (chat) => {
  if (!chat) return [];
  const rawList =
    chat.participants ||
    chat.members ||
    chat.users ||
    chat.recipients ||
    chat.people ||
    chat.attendees ||
    chat.userIds ||
    [];
  return buildChatParticipantProfilesFromEntries(rawList);
};

const extractActivityIdFromChat = (chat) => {
  if (!chat || typeof chat !== 'object') return '';
  const sources = [
    chat,
    chat.metadata,
    chat.meta,
    chat.details,
    chat.reference,
    chat.context,
    chat.payload,
    chat.data,
  ];

  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
  const candidates = [
    source.activity,
    source.activityId,
    source.activity_id,
    source.activity?.id,
    source.activity?._id,
      source.activity?.activityId,
      source.activity?.activity_id,
      source.activityId || source.activity_id,
      source.activitySlug,
      source.activity?.slug,
    ];
    for (const candidate of candidates) {
      const normalized = normalizeIdValue(candidate);
      if (normalized) return normalized;
    }
  }

  return '';
};

export const resolveChatImageFromChat = (chat) => {
  if (!chat || typeof chat !== 'object') return '';
  const candidates = [
    chat.imageUrl,
    chat.image_url,
    chat.image,
    chat.photo,
    chat.avatar,
    chat.banner,
    chat.bannerUrl,
    chat.metadata?.imageUrl,
    chat.metadata?.image,
    chat.metadata?.avatar,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length) return trimmed;
    }
  }
  return '';
};

export const deriveChatTitleFromChat = (chat, fallback = 'Chat') => {
  if (!chat || typeof chat !== 'object') return fallback;
  return (
    chat.title ||
    chat.name ||
    chat.chatName ||
    chat.roomName ||
    chat.topic ||
    chat.subject ||
    fallback
  );
};

const getAuthToken = async (providedToken) => {
  if (providedToken) return providedToken;
  const storedToken = await getStoredAccessToken();
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

export const fetchChatActivities = async (options = {}) => {
  const response = await request(`${CHATS_BASE}/activities`, {
    ...options,
  });
  return normalizeChatActivitiesList(response);
};

export const createChat = (payload, options = {}) =>
  request(`${CHATS_BASE}/create`, {
    method: 'POST',
    body: payload,
    ...options,
  });

export const fetchChatMessages = (chatId, params = {}, options = {}) =>
  request(`${CHATS_BASE}/${chatId}/messages`, {
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

const USER_REFERENCE_TYPES = ['user', 'use'];

const isUserReferenceEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return true;

  const typeCandidates = [
    entry.type,
    entry.memberType,
    entry.refType,
    entry.referenceType,
    entry.entityType,
    entry.targetType,
    entry.details?.type,
    entry.user?.type,
    entry.profile?.type,
    entry.account?.type,
    entry.ref?.type,
    entry.reference?.type,
  ];

  for (const candidate of typeCandidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const normalized = candidate.trim().toLowerCase();
    if (!normalized) continue;
    return USER_REFERENCE_TYPES.includes(normalized);
  }

  return true;
};

const collectActivityChatMembers = (activity = {}) => {
  const ids = new Set();
  const names = new Set();
  const profileMap = new Map();
  const appendFromList = (list = []) => {
    if (!Array.isArray(list)) return;
    list.forEach((entry) => {
      if (!isUserReferenceEntry(entry)) return;
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
      if (!isUserReferenceEntry(candidate)) return;
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
    if (!isUserReferenceEntry(candidate)) return;
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

export const isUserEligibleForActivityChat = (activity = {}, userId) => {
  if (!userId) return false;
  const normalizedUserId = normalizeIdValue(userId);
  if (!normalizedUserId) return false;
  const { ids } = collectActivityChatMembers(activity);
  return ids.some((id) => String(id) === normalizedUserId);
};

export const findExistingActivityChat = async (activityId, options = {}) => {
  const normalizedActivityId = normalizeIdValue(activityId);
  if (!normalizedActivityId) return null;

  const { token } = options;
  const response = await fetchChats({ token });
  const chats = normalizeChatList(response);
  if (!chats.length) return null;

  const found = chats.find((chat) => {
    const chatActivityId = extractActivityIdFromChat(chat);
    if (!chatActivityId) return false;
    return chatActivityId === normalizedActivityId;
  });

  return found || null;
};
