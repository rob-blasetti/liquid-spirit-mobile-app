import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import NotificationService, { filterOutSelfAuthoredPostNotifications } from '../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { fetchActivities } from '../services/ActivityService.jsx';
import { fetchEvents } from '../services/EventService.jsx';
import { fetchExploreFeed } from '../services/PostService.jsx';
import { fetchUserById } from '../services/UserService.jsx';
import { parseJwt } from '../utils/parseJwt';
import { API_URL } from '../config';
import { CommunityContext } from './CommunityContext';
import { AppState } from 'react-native';
import { initializeSocket } from '../services/SocketService';
import { fetchChats } from '../services/ChatService';

const CHAT_BADGE_POLL_INTERVAL = 15000;

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
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [hasNewChatMessages, setHasNewChatMessages] = useState(false);
  const [chatNotificationCount, setChatNotificationCount] = useState(0);
  const [isChatTabActive, setIsChatTabActive] = useState(false);
  // Detailed user info (including certifications) fetched on startup
  const [userDetails, setUserDetails] = useState(null);
  // Concurrency guards
  const refreshInFlightRef = useRef(null);
  const biometricInFlightRef = useRef(false);
  const chatTabActiveRef = useRef(false);
  const chatPollingRef = useRef(null);
  const chatServerUnreadRef = useRef({});
  const chatUnreadBaselineRef = useRef({});

  useEffect(() => {
    chatTabActiveRef.current = isChatTabActive;
  }, [isChatTabActive]);

  const syncChatBadgeFromPayload = useCallback(
    (payload) => {
      const { chats } = computeUnreadSummary(payload);
      let total = 0;
      const breakdown = chats.map((chat) => {
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
        return {
          id: chatId || 'unknown',
          serverCount,
          baseline,
          effective,
        };
      });

      setChatNotificationCount(total);
      setHasNewChatMessages(total > 0 && !chatTabActiveRef.current);
      console.log('[ChatBadge] unread total:', total, '| breakdown:', JSON.stringify(breakdown));
    },
    [],
  );

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

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const keys = [
          'authToken',
          'refreshToken',
          'user',
          'userActivities',
          'userEvents',
          'userPosts',
          'userDetails',
        ];
        const stores = await AsyncStorage.multiGet(keys);
        const map = Object.fromEntries(stores);

        if (map.authToken) setToken(map.authToken);
        if (map.user) setUser(JSON.parse(map.user));

        if (map.userActivities) setUserActivities(JSON.parse(map.userActivities));
        if (map.userEvents) setUserEvents(JSON.parse(map.userEvents));
        if (map.userPosts) setUserPosts(JSON.parse(map.userPosts));
        if (map.userDetails) setUserDetails(JSON.parse(map.userDetails));
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadCachedData().finally(() => {
      setStorageLoaded(true);
    });
  }, []);

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
  }, [token]);

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
        ['authToken', authToken],
        ['refreshToken', newRefreshToken],
        ['user', JSON.stringify(userData)],
        ['communityId', userData.community?._id || ''],
      ]);

      if (email && password) {
        // Store credentials securely without prompting biometric on save (will prompt on retrieval)
        await Keychain.setGenericPassword(email, password, {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        console.log('Credentials securely stored.');
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
        'authToken',
        'user',
        'communityId',
        'userActivities',
        'userEvents',
        'userPosts',
        'userDetails',
      ]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [setCommunityId]);

  function isTokenExpired(jwtToken) {
    try {
      const { exp } = parseJwt(jwtToken);

      // If 'exp' doesn't exist or decoding fails, treat token as invalid
      if (!exp) return true;

      // Check if the current time is past the token's expiration time
      return Date.now() >= exp * 1000;
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return true; // Consider invalid if decode fails
    }
  }

  const refreshSession = useCallback(async () => {
    if (refreshInFlightRef.current) {
      try {
        return await refreshInFlightRef.current;
      } catch (error) {
        throw error;
      }
    }

    const refreshPromise = (async () => {
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('Retrieved refresh token from storage:', storedRefreshToken ? '[redacted]' : null);

      if (!storedRefreshToken) {
        console.warn('No stored refresh token.');
        await logout();
        return null;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn('Invalid refresh token, attempting re-login with stored credentials...');
          await AsyncStorage.removeItem('refreshToken');
          try {
            await biometricLogin();
          } catch (err) {
            console.error('Re-login failed:', err);
            await logout();
          }
          return null;
        }

        const { accessToken, newRefreshToken } = data;

        await AsyncStorage.multiSet([
          ['authToken', accessToken],
          ['refreshToken', newRefreshToken || storedRefreshToken],
        ]);

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
  }, [biometricLogin, logout]);

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
  }, [token, refreshSession]);

  const refreshChatBadgeFromServer = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetchChats({ token });
      console.log('[ChatBadge] fetchChats response:', JSON.stringify(response)?.slice(0, 500));
      syncChatBadgeFromPayload(response);
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
            return;
          } catch (retryError) {
            console.error(
              'Error refreshing chat badge after refreshing session:',
              retryError?.message || retryError,
            );
          }
        }
        return;
      }

      console.error('Error refreshing chat badge:', message || error);
    }
  }, [token, syncChatBadgeFromPayload, ensureValidSession]);

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      const wasBackground = appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextAppState;

      if (wasBackground && nextAppState === 'active') {
        ensureValidSession();
        refreshChatBadgeFromServer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [ensureValidSession, refreshChatBadgeFromServer]);
  // Load notifications on token change
  const derivedUserId = user?.id || user?._id;

  useEffect(() => {
    if (!token || !derivedUserId) return;
    // Defer to centralized refresh orchestration; skip if token expired
    if (isTokenExpired(token)) return;
    const loadNotifications = async () => {
      try {
        const resp = await NotificationService.getAllNotifications(token, { limit: 10, offset: 0 });
        const notifs = resp.data || [];
        const sanitized = filterOutSelfAuthoredPostNotifications(notifs, derivedUserId);
        setUserNotifications(sanitized);
        const unread = sanitized.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    loadNotifications();
  }, [token, derivedUserId]);

  useEffect(() => {
    if (!token) {
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }
      return;
    }

    refreshChatBadgeFromServer();
    chatPollingRef.current = setInterval(
      refreshChatBadgeFromServer,
      CHAT_BADGE_POLL_INTERVAL,
    );

    return () => {
      if (chatPollingRef.current) {
        clearInterval(chatPollingRef.current);
        chatPollingRef.current = null;
      }
    };
  }, [token, refreshChatBadgeFromServer]);

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
      refreshChatBadgeFromServer();
    };

    events.forEach((event) => {
      socket.off(event, handler);
      socket.on(event, handler);
    });

    return () => {
      events.forEach((event) => socket.off(event, handler));
    };
  }, [token, refreshChatBadgeFromServer]);

  useEffect(() => {
    if (token) return;
    setHasNewChatMessages(false);
    setChatNotificationCount(0);
    setIsChatTabActive(false);
    chatServerUnreadRef.current = {};
    chatUnreadBaselineRef.current = {};
  }, [token]);

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
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.username,
            password: credentials.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          await login(
            data.user,
            data.token,
            data.refreshToken,
            credentials.username,
            credentials.password
          );
          console.log('Biometric login successful!');
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
