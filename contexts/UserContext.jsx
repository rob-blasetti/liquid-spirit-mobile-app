import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import NotificationService, { filterOutSelfAuthoredPostNotifications } from '../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { fetchActivities } from '../services/ActivityService.jsx';
import { fetchEvents } from '../services/EventService.jsx';
import { fetchExploreFeed } from '../services/PostService.jsx';
import { fetchUserById } from '../services/UserService.jsx';
import debugLog from '../utils/debugLog';
import { isJwtExpired, resolveAccessToken, resolveRefreshToken } from '../utils/authTokens';
import {
  clearSessionTokens,
  getStoredRefreshToken,
  loadSessionTokens,
  saveSessionTokens,
  setAccessTokenMemory,
} from '../utils/authTokenStorage';
import { API_URL, AUTH_API_URL } from '../config';
import { CommunityContext } from './CommunityContext';
import { AppState } from 'react-native';
import { initializeSocket } from '../services/SocketService';
import { fetchChats } from '../services/ChatService';
import { syncNextEventWidget } from '../services/WidgetService';
import { fetchHouseholdByMemberId } from '../services/HouseholdService';
import { fetchPasskeyCredentialsWithToken } from '../services/PasskeyService';
import useMountEffect from '../hooks/useMountEffect';
import { setAuthExpiredHandler } from '../utils/authSessionEvents';
import { navigateWhenReady } from '../navigation/RootNavigation';

const CHAT_BADGE_POLL_INTERVAL = 15000;
const REFRESH_DEDUP_WINDOW_MS = 5000;
const PASSKEY_CREDENTIALS_STORAGE_KEY = 'passkeyCredentials';

const normalizeChatPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;

  const candidates = [
    payload.data,
    payload.results,
    payload.chats,
    payload.items,
    payload.data?.chats,
  ];

  for (const entry of candidates) {
    if (Array.isArray(entry)) {
      return entry;
    }
  }

  return [];
};

const parseUnreadValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string' && value.trim().length > 0) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === 'true') return 1;
    if (trimmed === 'false') return 0;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === 'object') {
    const nestedKeys = [
      'count',
      'total',
      'length',
      'value',
      'number',
      'unread',
      'pending',
      'messages',
      'unreadCount',
      'newMessages',
    ];
    for (const key of nestedKeys) {
      if (value[key] !== undefined) {
        const parsed = parseUnreadValue(value[key]);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
  }
  return null;
};

const extractExplicitUnreadCount = (chat = {}) => {
  const direct = chat?.unreadCount ?? chat?.unread_count;
  if (direct !== undefined) {
    const parsed = parseUnreadValue(direct);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
};

const deriveChatUnreadCount = (chat = {}) => {
  const explicit = extractExplicitUnreadCount(chat);
  if (explicit !== null) {
    return Math.max(explicit, 0);
  }
  const arrayCandidates = [
    chat.unreadMessages,
    chat.unread_messages,
    chat.unread,
    chat.pendingMessages,
    chat.pending_messages,
  ];

  for (const arr of arrayCandidates) {
    if (Array.isArray(arr)) {
      return arr.length;
    }
  }

  const keys = [
    'unreadCount',
    'unread_count',
    'unreadTotal',
    'unread_total',
    'newMessages',
    'new_messages',
    'newMessageCount',
    'new_message_count',
    'unseenMessages',
    'unseen_messages',
    'unseenCount',
    'unseen_count',
    'hasUnread',
    'has_unread',
    'hasUnreadMessages',
    'has_unread_messages',
  ];

  for (const key of keys) {
    const parsed = parseUnreadValue(chat[key]);
    if (parsed !== null) {
      return Math.max(parsed, 0);
    }
  }

  for (const [key, value] of Object.entries(chat)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('unread') ||
      lowerKey.includes('pending') ||
      lowerKey.includes('newmessage') ||
      lowerKey.includes('new_message') ||
      lowerKey.includes('unseen')
    ) {
      const parsed = parseUnreadValue(value);
      if (parsed !== null) {
        return Math.max(parsed, 0);
      }
    }
  }

  return 0;
};

const computeUnreadSummary = (payload) => {
  const chats = normalizeChatPayload(payload);
  return { chats };
};

const extractPasskeyCredentials = payload => {
  const candidates = [
    payload,
    payload?.data,
    payload?.result,
    payload?.credentials,
    payload?.passkeys,
    payload?.data?.credentials,
    payload?.data?.passkeys,
    payload?.result?.credentials,
    payload?.result?.passkeys,
    payload?.user?.credentials,
    payload?.user?.passkeys,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const { setCommunityId } = useContext(CommunityContext);
  const [userActivities, setUserActivities] = useState(null);
  const [userEvents, setUserEvents] = useState(null);
  const [userPosts, setUserPosts] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userNotifications, setUserNotifications] = useState(null);
  const [householdSettings, setHouseholdSettings] = useState(null);
  const [passkeyCredentials, setPasskeyCredentials] = useState([]);
  const [passkeyCredentialsLoaded, setPasskeyCredentialsLoaded] = useState(false);
  const [passkeyCredentialsLoading, setPasskeyCredentialsLoading] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [hasNewChatMessages, setHasNewChatMessages] = useState(false);
  const [chatNotificationCount, setChatNotificationCount] = useState(0);
  const [, setIsChatTabActiveState] = useState(false);
  // Detailed user info (including certifications) fetched on startup
  const [userDetails, setUserDetails] = useState(null);
  // Concurrency guards
  const refreshInFlightRef = useRef(null);
  const biometricInFlightRef = useRef(false);
  const biometricLoginRef = useRef(null);
  const chatTabActiveRef = useRef(false);
  const chatPollingRef = useRef(null);
  const chatBadgeRefreshInFlightRef = useRef(null);
  const notificationRefreshInFlightRef = useRef(null);
  const passkeyRefreshInFlightRef = useRef(null);
  const passkeyCredentialsRef = useRef([]);
  const lastChatBadgeRefreshAtRef = useRef(0);
  const lastNotificationRefreshAtRef = useRef(0);
  const chatServerUnreadRef = useRef({});
  const chatUnreadBaselineRef = useRef({});

  const setIsChatTabActive = useCallback((value) => {
    setIsChatTabActiveState(prev => {
      const nextValue = typeof value === 'function' ? value(prev) : value;
      chatTabActiveRef.current = nextValue;
      return nextValue;
    });
  }, []);

  const syncChatBadgeFromPayload = useCallback(
    (payload) => {
      const { chats } = computeUnreadSummary(payload);
      let total = 0;
      chats.forEach((chat) => {
        const chatId = chat?._id || chat?.id;
        const serverCount = deriveChatUnreadCount(chat);
        let baseline = 0;
        let effective = serverCount;

        if (chatId) {
          chatServerUnreadRef.current[chatId] = serverCount;
          const storedBaseline = chatUnreadBaselineRef.current[chatId] || 0;
          baseline = Math.min(storedBaseline, serverCount);
          if (baseline !== storedBaseline) {
            chatUnreadBaselineRef.current[chatId] = baseline;
          }
          effective = Math.max(serverCount - baseline, 0);
        }

        total += effective;
      });

      setChatNotificationCount(total);
      setHasNewChatMessages(total > 0 && !chatTabActiveRef.current);
    },
    [],
  );

  const authBase = String(AUTH_API_URL || API_URL || '').replace(/\/$/, '');

  const clearChatUnread = useCallback(
    (chatId) => {
      if (!chatId) return;
      const serverCount = chatServerUnreadRef.current[chatId];
      const baseline = chatUnreadBaselineRef.current[chatId] || 0;
      const normalizedBaseline =
        serverCount === undefined ? baseline : Math.min(baseline, serverCount);
      if (normalizedBaseline !== baseline) {
        chatUnreadBaselineRef.current[chatId] = normalizedBaseline;
      }
      const effectiveBefore =
        serverCount === undefined
          ? 0
          : Math.max(serverCount - normalizedBaseline, 0);
      const nextBaseline =
        serverCount === undefined ? normalizedBaseline : serverCount;
      chatUnreadBaselineRef.current[chatId] = nextBaseline;
      setChatNotificationCount((prev) =>
        effectiveBefore > 0 ? Math.max(prev - effectiveBefore, 0) : prev,
      );
      setHasNewChatMessages(false);
    },
    [],
  );

  useMountEffect(() => {
    const loadCachedData = async () => {
      try {
        const [
          { accessToken },
          storedUser,
          storedUserActivities,
          storedUserEvents,
          storedUserPosts,
          storedUserDetails,
          storedHouseholdSettings,
          storedPasskeyCredentials,
        ] = await Promise.all([
          loadSessionTokens(),
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('userActivities'),
          AsyncStorage.getItem('userEvents'),
          AsyncStorage.getItem('userPosts'),
          AsyncStorage.getItem('userDetails'),
          AsyncStorage.getItem('householdSettings'),
          AsyncStorage.getItem(PASSKEY_CREDENTIALS_STORAGE_KEY),
        ]);

        if (accessToken) {
          setAccessTokenMemory(accessToken);
          setToken(accessToken);
        }
        if (storedUser) setUser(JSON.parse(storedUser));

        if (storedUserActivities) setUserActivities(JSON.parse(storedUserActivities));
        if (storedUserEvents) setUserEvents(JSON.parse(storedUserEvents));
        if (storedUserPosts) setUserPosts(JSON.parse(storedUserPosts));
        if (storedUserDetails) setUserDetails(JSON.parse(storedUserDetails));
        if (storedHouseholdSettings) setHouseholdSettings(JSON.parse(storedHouseholdSettings));
        if (storedPasskeyCredentials) {
          const cachedPasskeyCredentials = JSON.parse(storedPasskeyCredentials);
          passkeyCredentialsRef.current = cachedPasskeyCredentials;
          setPasskeyCredentials(cachedPasskeyCredentials);
          setPasskeyCredentialsLoaded(true);
        }
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadCachedData().finally(() => {
      setStorageLoaded(true);
    });
  });

  useEffect(() => {
    if (!token) return;

    if (isTokenExpired(token)) {
      refreshSession();
      return;
    }

    const loadUserData = async () => {
      try {
        const [posts, activities, events] = await Promise.all([
          fetchExploreFeed(token),
          fetchActivities(token),
          fetchEvents(token),
        ]);

        setUserPosts(posts);
        setUserActivities(activities);
        setUserEvents(events);

        await AsyncStorage.setItem('userActivities', JSON.stringify(activities));
        await AsyncStorage.setItem('userEvents', JSON.stringify(events));
        await AsyncStorage.setItem('userPosts', JSON.stringify(posts));

      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
      }
    };

    loadUserData();
  }, [isTokenExpired, refreshSession, token]);

  useEffect(() => {
    // Synchronizes the native WidgetKit extension with the current auth/event cache.
    syncNextEventWidget({ isLoggedIn: Boolean(token), events: userEvents }).catch(error => {
      console.error('Failed to sync next event widget:', error);
    });
  }, [token, userEvents]);

  const refreshHouseholdSettings = useCallback(async () => {
    if (!token || !user?.id) {
      setHouseholdSettings(null);
      await AsyncStorage.removeItem('householdSettings');
      return null;
    }

    try {
      const household = await fetchHouseholdByMemberId(user.id, token);
      const nextHouseholdSettings = household?.primaryContact ? household : null;
      setHouseholdSettings(nextHouseholdSettings);

      if (nextHouseholdSettings) {
        await AsyncStorage.setItem('householdSettings', JSON.stringify(nextHouseholdSettings));
      } else {
        await AsyncStorage.removeItem('householdSettings');
      }

      return nextHouseholdSettings;
    } catch (error) {
      if (error?.status === 404) {
        setHouseholdSettings(null);
        await AsyncStorage.removeItem('householdSettings');
        return null;
      }
      throw error;
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!token || !user?.id) return;
    refreshHouseholdSettings().catch(() => {});
  }, [refreshHouseholdSettings, token, user?.id]);

  const refreshPasskeyCredentials = useCallback(async ({ tokenOverride = null, force = false } = {}) => {
    const activeToken = tokenOverride || token;
    if (!activeToken) {
      setPasskeyCredentials([]);
      passkeyCredentialsRef.current = [];
      setPasskeyCredentialsLoaded(true);
      await AsyncStorage.removeItem(PASSKEY_CREDENTIALS_STORAGE_KEY);
      return [];
    }

    if (!force && passkeyRefreshInFlightRef.current) {
      return passkeyRefreshInFlightRef.current;
    }

    setPasskeyCredentialsLoading(true);
    const refreshPromise = (async () => {
      try {
        const result = await fetchPasskeyCredentialsWithToken(activeToken);
        if (!result?.ok) {
          const errorMessage =
            result?.data?.error?.message || result?.data?.message || 'Failed to fetch passkeys.';
          const isRateLimited = result?.status === 429 || /too many requests/i.test(errorMessage);

          if (isRateLimited) {
            console.warn('Passkey fetch rate limited. Keeping current list.');
            setPasskeyCredentialsLoaded(true);
            return passkeyCredentialsRef.current;
          }

          console.warn('Failed to fetch passkeys:', result?.data);
          passkeyCredentialsRef.current = [];
          setPasskeyCredentials([]);
          setPasskeyCredentialsLoaded(true);
          await AsyncStorage.removeItem(PASSKEY_CREDENTIALS_STORAGE_KEY);
          return [];
        }

        const credentials = extractPasskeyCredentials(result.data);
        passkeyCredentialsRef.current = credentials;
        setPasskeyCredentials(credentials);
        setPasskeyCredentialsLoaded(true);
        await AsyncStorage.setItem(PASSKEY_CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
        return credentials;
      } catch (error) {
        console.error('Error fetching passkeys:', error);
        passkeyCredentialsRef.current = [];
        setPasskeyCredentials([]);
        setPasskeyCredentialsLoaded(true);
        await AsyncStorage.removeItem(PASSKEY_CREDENTIALS_STORAGE_KEY);
        return [];
      } finally {
        setPasskeyCredentialsLoading(false);
        passkeyRefreshInFlightRef.current = null;
      }
    })();

    passkeyRefreshInFlightRef.current = refreshPromise;
    return refreshPromise;
  }, [token]);

  useEffect(() => {
    if (!token || !user?.id || passkeyCredentialsLoaded) return;
    refreshPasskeyCredentials().catch(() => {});
  }, [passkeyCredentialsLoaded, refreshPasskeyCredentials, token, user?.id]);

  // Fetch full user details (including certifications) and sync profile picture on startup
  useEffect(() => {
    if (!token || !user?.id) return;
    const fetchDetails = async () => {
      try {
        const data = await fetchUserById(user.id, token);
        setUserDetails(data);
        // Persist detailed user to storage
        await AsyncStorage.setItem('userDetails', JSON.stringify(data));
        // Sync main user context with profile picture from detailed data
        if (data.profilePicture) {
          setUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };
    fetchDetails();
  }, [token, user?.id]);

  const login = async (userData, authToken, newRefreshToken, email, password) => {
    try {
      setUser(userData);
      setToken(authToken);
      setCommunityId(userData.community?._id);

      await AsyncStorage.multiSet([
        ['user', JSON.stringify(userData)],
        ['communityId', userData.community?._id || ''],
      ]);

      await saveSessionTokens({
        accessToken: authToken,
        refreshToken: typeof newRefreshToken === 'string' && newRefreshToken.length > 0 ? newRefreshToken : null,
      });

      await refreshPasskeyCredentials({ tokenOverride: authToken, force: true });

      if (email && password) {
        // Store credentials securely without prompting biometric on save (will prompt on retrieval)
        await Keychain.setGenericPassword(email, password, {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        debugLog('Credentials securely stored.');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = useCallback(async () => {
    try {
      setUser(null);
      setToken(null);
      setCommunityId(null);
      setUserActivities(null);
      setUserEvents(null);
      setUserPosts(null);
      setHouseholdSettings(null);
      passkeyCredentialsRef.current = [];
      setPasskeyCredentials([]);
      setPasskeyCredentialsLoaded(false);
      setPasskeyCredentialsLoading(false);
      setHasNewChatMessages(false);
      setChatNotificationCount(0);
      setIsChatTabActive(false);
      chatServerUnreadRef.current = {};
      chatUnreadBaselineRef.current = {};
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }

      await AsyncStorage.multiRemove([
        'user',
        'communityId',
        'userActivities',
        'userEvents',
        'userPosts',
        'userDetails',
        'householdSettings',
        PASSKEY_CREDENTIALS_STORAGE_KEY,
      ]);
      await clearSessionTokens();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [setCommunityId, setIsChatTabActive]);

  const isTokenExpired = useCallback((jwtToken) => isJwtExpired(jwtToken), []);

  const refreshSession = useCallback(async () => {
    if (refreshInFlightRef.current) {
      try {
        return await refreshInFlightRef.current;
      } catch (error) {
        throw error;
      }
    }

    const refreshPromise = (async () => {
      const storedRefreshToken = await getStoredRefreshToken();
      debugLog('Retrieved refresh token from storage:', storedRefreshToken ? '[redacted]' : null);

      if (!storedRefreshToken) {
        console.warn('No stored refresh token.');
        await logout();
        return null;
      }

      try {
        const response = await fetch(`${authBase}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn('Invalid refresh token, attempting re-login with stored credentials...');
          await saveSessionTokens({ accessToken: null, refreshToken: null });
          try {
            await biometricLoginRef.current?.();
          } catch (err) {
            console.error('Re-login failed:', err);
            await logout();
          }
          return null;
        }

        const accessToken = resolveAccessToken(data);
        const newRefreshToken = resolveRefreshToken(data);

        if (!accessToken) {
          console.warn('Refresh response did not include a valid access token.');
          await clearSessionTokens();
          await logout();
          return null;
        }

        await saveSessionTokens({
          accessToken,
          refreshToken: newRefreshToken || storedRefreshToken,
        });

        setAccessTokenMemory(accessToken);
        setToken(accessToken);
        return accessToken;
      } catch (error) {
        console.error('Refresh error:', error);
        await logout();
        return null;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = refreshPromise;
    return refreshPromise;
  }, [authBase, logout]);

  const ensureValidSession = useCallback(async () => {
    if (!token) return null;

    if (!isTokenExpired(token)) {
      return token;
    }

    try {
      const refreshed = await refreshSession();
      return refreshed || null;
    } catch (error) {
      console.error('Failed to ensure valid session:', error);
      return null;
    }
  }, [isTokenExpired, token, refreshSession]);

  useEffect(() => {
    setAuthExpiredHandler(async () => {
      const refreshed = await refreshSession();
      if (refreshed) return;

      navigateWhenReady('Login', {
        bannerMessage: 'Your session has expired. Please log in again.',
      });
    });

    return () => setAuthExpiredHandler(null);
  }, [refreshSession]);

  const refreshChatBadgeFromServer = useCallback(async ({ force = false } = {}) => {
    if (!token) return null;
    if (appStateRef.current !== 'active' && !force) return null;

    const now = Date.now();
    if (!force && chatBadgeRefreshInFlightRef.current) {
      return chatBadgeRefreshInFlightRef.current;
    }
    if (!force && now - lastChatBadgeRefreshAtRef.current < REFRESH_DEDUP_WINDOW_MS) {
      return null;
    }

    const refreshPromise = (async () => {
      try {
        const response = await fetchChats({ token });
        syncChatBadgeFromPayload(response);
        lastChatBadgeRefreshAtRef.current = Date.now();
        return response;
      } catch (error) {
        const message = error?.message || '';
        const tokenExpired =
          error?.status === 401 || /token has expired/i.test(message);

        if (tokenExpired) {
          console.warn('[ChatBadge] Token expired while refreshing badge; refreshing session.');
          const refreshed = await ensureValidSession();
          if (refreshed) {
            try {
              const retryResponse = await fetchChats({ token: refreshed });
              syncChatBadgeFromPayload(retryResponse);
              lastChatBadgeRefreshAtRef.current = Date.now();
              return retryResponse;
            } catch (retryError) {
              console.error(
                'Error refreshing chat badge after refreshing session:',
                retryError?.message || retryError,
              );
            }
          }
          return null;
        }

        console.error('Error refreshing chat badge:', message || error);
        return null;
      } finally {
        chatBadgeRefreshInFlightRef.current = null;
      }
    })();

    chatBadgeRefreshInFlightRef.current = refreshPromise;
    return refreshPromise;
  }, [token, syncChatBadgeFromPayload, ensureValidSession]);

  const ensureValidSessionRef = useRef(ensureValidSession);
  const refreshChatBadgeFromServerRef = useRef(refreshChatBadgeFromServer);
  const refreshNotificationsFromServerRef = useRef(null);
  ensureValidSessionRef.current = ensureValidSession;
  refreshChatBadgeFromServerRef.current = refreshChatBadgeFromServer;
  const syncWidgetRef = useRef(token);
  const syncWidgetEventsRef = useRef(userEvents);
  syncWidgetRef.current = token;
  syncWidgetEventsRef.current = userEvents;

  const appStateRef = useRef(AppState?.currentState || 'active');

  useMountEffect(() => {
    const handleAppStateChange = nextAppState => {
      const wasBackground = appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextAppState;

      if (nextAppState !== 'active' && chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }

      if (wasBackground && nextAppState === 'active') {
        ensureValidSessionRef.current();
        refreshChatBadgeFromServerRef.current({ force: true });
        refreshNotificationsFromServerRef.current?.({ force: true });
        syncNextEventWidget({
          isLoggedIn: Boolean(syncWidgetRef.current),
          events: syncWidgetEventsRef.current,
        }).catch(error => {
          console.error('Failed to refresh widget on app foreground:', error);
        });

        if (token && !chatPollingRef.current) {
          chatPollingRef.current = setInterval(() => {
            if (appStateRef.current === 'active') {
              refreshChatBadgeFromServerRef.current();
            }
          }, CHAT_BADGE_POLL_INTERVAL);
        }
      }
    };

    if (!AppState?.addEventListener) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove?.();
    };
  });
  // Load notifications on token change
  const derivedUserId = user?.id || user?._id;

  const refreshNotificationsFromServer = useCallback(async ({ force = false } = {}) => {
    if (!token || !derivedUserId) return null;
    if (isTokenExpired(token)) return null;
    if (appStateRef.current !== 'active' && !force) return null;

    const now = Date.now();
    if (!force && notificationRefreshInFlightRef.current) {
      return notificationRefreshInFlightRef.current;
    }
    if (!force && now - lastNotificationRefreshAtRef.current < REFRESH_DEDUP_WINDOW_MS) {
      return null;
    }

    const refreshPromise = (async () => {
      try {
        const resp = await NotificationService.getAllNotifications(token, { limit: 10, offset: 0 });
        const notifs = resp.data || [];
        const sanitized = filterOutSelfAuthoredPostNotifications(notifs, derivedUserId);
        setUserNotifications(sanitized);
        const unread = sanitized.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        lastNotificationRefreshAtRef.current = Date.now();
        return sanitized;
      } catch (error) {
        console.error('Error loading notifications:', error);
        return null;
      } finally {
        notificationRefreshInFlightRef.current = null;
      }
    })();

    notificationRefreshInFlightRef.current = refreshPromise;
    return refreshPromise;
  }, [derivedUserId, isTokenExpired, token]);

  refreshNotificationsFromServerRef.current = refreshNotificationsFromServer;

  useEffect(() => {
    refreshNotificationsFromServer({ force: true });
  }, [refreshNotificationsFromServer]);

  useEffect(() => {
    if (!token || appStateRef.current !== 'active') {
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }
      return;
    }

    refreshChatBadgeFromServerRef.current({ force: true });
    chatPollingRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        refreshChatBadgeFromServerRef.current();
      }
    }, CHAT_BADGE_POLL_INTERVAL);

    return () => {
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = initializeSocket({ token });
    if (!socket) return;

    const events = [
      'chat-message',
      'chat:message',
      'chat:new-message',
      'message-created',
      'chat-message-created',
      'chat:message:created',
      'message',
    ];

    const handler = () => {
      refreshChatBadgeFromServerRef.current();
    };

    events.forEach((event) => {
      socket.off(event, handler);
      socket.on(event, handler);
    });

    return () => {
      events.forEach((event) => socket.off(event, handler));
    };
  }, [token]);

  useEffect(() => {
    if (token) return;
    setHasNewChatMessages(false);
    setChatNotificationCount(0);
    setIsChatTabActive(false);
    chatServerUnreadRef.current = {};
    chatUnreadBaselineRef.current = {};
  }, [setIsChatTabActive, token]);

  const biometricLogin = async () => {
    // Prevent parallel biometric prompts/logins
    if (biometricInFlightRef.current) return;
    biometricInFlightRef.current = true;
    try {
      const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: 'Login to Liquid Spirit',
          subtitle: 'Authenticate using Face ID / Touch ID',
        },
      });

      if (credentials) {
        const response = await fetch(`${authBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.username,
            password: credentials.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const authToken = resolveAccessToken(data);
          const refreshToken = resolveRefreshToken(data);
          await login(
            data.user,
            authToken,
            refreshToken,
            credentials.username,
            credentials.password
          );
          debugLog('Biometric login successful!');
        } else {
          console.error('Login failed:', data.message);
        }
      } else {
        console.warn('No credentials found for biometric login.');
      }
    } catch (error) {
      console.error('Biometric login exception:', error);
    } finally {
      biometricInFlightRef.current = false;
    }
  };
  biometricLoginRef.current = biometricLogin;

  return (
    <UserContext.Provider
      value={{
        user,
        // Detailed user info including certifications
        userDetails,
        setUserDetails,
        setUser,
        userActivities,
        setUserActivities,
        userEvents,
        setUserEvents,
        userPosts,
        setUserPosts,
        token,
        setToken,
        unreadCount,
        setUnreadCount,
        hasNewChatMessages,
        setHasNewChatMessages,
        chatNotificationCount,
        setChatNotificationCount,
        setIsChatTabActive,
        syncChatBadgeFromChats: syncChatBadgeFromPayload,
        refreshChatBadgeFromServer,
        clearChatUnread,
        userNotifications,
        setUserNotifications,
        householdSettings,
        setHouseholdSettings,
        refreshHouseholdSettings,
        passkeyCredentials,
        passkeyCredentialsLoaded,
        passkeyCredentialsLoading,
        refreshPasskeyCredentials,
        login,
        logout,
        isLoggedIn: !!token,
        biometricLogin,
        isTokenExpired,
        refreshSession,
        ensureValidSession,
        storageLoaded,
      }}>
      {children}
    </UserContext.Provider>
  );
};
