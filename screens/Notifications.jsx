import React, { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { ChatContext } from '../contexts';
import NotificationService, { filterOutSelfAuthoredPostNotifications } from '../services/NotificationService';
import { navigateToPostDetail } from '../utils/navigateToPostDetail';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
import { navigateToActivityDetail } from '../utils/navigateToActivityDetail';
import { navigateWithinMainTabs } from '../utils/navigateWithTabs';
import { fetchPostDetails } from '../services/PostService';
import { fetchEventDetails } from '../services/EventService';
import { fetchActivityDetails } from '../services/ActivityService';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';
import { prefetchImageSources } from '../utils/imageSource';
import { extractChatNavigationParams, isChatNotificationType } from '../utils/chatNotificationPayload';
// Removed preloading imports for notifications
// import { fetchPostDetails } from '../services/PostService';
// import { fetchActivityDetails } from '../services/ActivityService';
// import { fetchEventDetails } from '../services/EventService';
// import { Image } from 'react-native';

const NotificationIcon = ({ type }) => {
  const iconStyle = { color: themeVariables.blackColor };

  switch (type) {
    case 'post':
      return <Ionicons name="people-outline" size={20} style={iconStyle} />;
    case 'activity':
      return <Ionicons name="list-outline" size={20} style={iconStyle} />;
    case 'event':
      return <Ionicons name="calendar-outline" size={20} style={iconStyle} />;
    case 'announcement':
      return <Ionicons name="information-circle-outline" size={20} style={iconStyle} />;
    default:
      return <Ionicons name="notifications-outline" size={20} style={iconStyle} />;
  }
};

const normalizeIdValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (typeof value === 'object') {
    return (
      normalizeIdValue(value._id) ||
      normalizeIdValue(value.id) ||
      null
    );
  }
  return null;
};

const extractActivityAndSessionIds = (notification) => {
  if (!notification || typeof notification !== 'object') {
    return { activityId: null, sessionId: null };
  }

  const additional = notification.additionalData || {};
  const target = notification.target || {};
  const typeName = (notification.type?.typeName || notification.type || '').toLowerCase();

  const pickFirst = (...values) => values.map(normalizeIdValue).find(Boolean) || null;

  const activityId = pickFirst(
    additional.activityId,
    additional.activity_id,
    additional.activity?.activityId,
    additional.activity?.activity_id,
    additional.activity?._id,
    additional.activity?.id,
    additional.parentActivityId,
    additional.parentId,
    target.activityId,
    target.activity_id,
    target.activity?._id,
    target.activity?.id,
    target.parentActivityId,
    target.parentId,
    target.activity,
    notification.activityId,
    notification.activity_id,
    notification.activity?._id,
    notification.activity?.id,
    typeName.includes('session') ? normalizeIdValue(additional.parent?.id) : null
  );

  const sessionId = pickFirst(
    additional.sessionId,
    additional.session_id,
    additional.session?._id,
    additional.session?.id,
    additional.id,
    target.sessionId,
    target.session_id,
    target.session?._id,
    target.session?.id,
    typeName.includes('session') ? normalizeIdValue(target._id || target.id) : null
  );

  return { activityId, sessionId };
};

const TYPE_CATEGORY_MAP = {
  post_media: 'post',
  post_created: 'post',
  chat_direct_message: 'chat',
  chat_group_message: 'chat',
  new_activity: 'activity',
  join_activity: 'activity',
  activity_updated: 'activity',
  activity_canceled: 'activity',
  activity_cancelled: 'activity',
  join_event: 'event',
  event_reminder: 'event',
  signup: 'announcement',
  session: 'activity',
  session_created: 'activity',
  session_updated: 'activity',
  session_reminder: 'activity',
  session_cancelled: 'activity',
  session_canceled: 'activity',
};

const mapNotificationType = (typeName = '') => {
  const key = typeName.toLowerCase();
  if (TYPE_CATEGORY_MAP[key]) return TYPE_CATEGORY_MAP[key];
  if (isChatNotificationType(key)) return 'chat';
  if (key.includes('session')) return 'activity';
  if (key.includes('activity')) return 'activity';
  if (key.includes('event')) return 'event';
  if (key.includes('post')) return 'post';
  return 'general';
};

export default function Notifications() {
  const navigation = useNavigation();
  const {
    token,
    isTokenExpired,
    setUnreadCount,
    userNotifications,
    setUserNotifications,
    user,
    refreshSession,
    clearChatUnread,
  } = useContext(UserContext);
  const { getChatById, getChatMessages, prefetchChatMessages } = useContext(ChatContext);
  const tabIndicatorX = useRef(new Animated.Value(0)).current;
  const tabIndicatorWidth = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState({});
  const [groupedNotifList, setGroupedNotifList] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('community');
  const tabLayoutReady = useMemo(
    () => Object.keys(tabLayouts).length === 2,
    [tabLayouts],
  );
  const [flatNotifications, setFlatNotifications] = useState([]);
  const [prefetchedPosts, setPrefetchedPosts] = useState({});
  const [prefetchedEvents, setPrefetchedEvents] = useState({});
  const [prefetchedActivities, setPrefetchedActivities] = useState({});
  const [openingNotificationId, setOpeningNotificationId] = useState(null);
  const prefetchPromisesRef = useRef({ posts: {}, events: {}, activities: {} });
  const didAttemptTokenRefreshRef = useRef(false);
  const failedPrefetchesRef = useRef({ posts: new Set(), events: new Set(), activities: new Set() });
  const openingNotificationRef = useRef(null);
  const LIMIT = 10;
  const PREFETCH_LIMIT = 6;

  const canUseToken = useCallback(() => {
    if (!token) return false;
    if (typeof isTokenExpired === 'function' && isTokenExpired(token)) {
      return false;
    }
    return true;
  }, [token, isTokenExpired]);

  useEffect(() => {
    if (!token) return;
    if (typeof isTokenExpired === 'function' && isTokenExpired(token)) return;
    didAttemptTokenRefreshRef.current = false;
  }, [token, isTokenExpired]);

  const ensurePostPrefetched = useCallback(async (id, priority = 'low') => {
    if (!id) return null;
    if (prefetchedPosts[id]) return prefetchedPosts[id];
    if (failedPrefetchesRef.current.posts.has(id)) return null;
    if (!canUseToken()) {
      if (
        typeof isTokenExpired === 'function' &&
        token &&
        isTokenExpired(token) &&
        typeof refreshSession === 'function' &&
        !didAttemptTokenRefreshRef.current
      ) {
        didAttemptTokenRefreshRef.current = true;
        try { await refreshSession(); } catch (_) {}
      }
      return null;
    }

    if (prefetchPromisesRef.current.posts[id]) {
      return prefetchPromisesRef.current.posts[id];
    }

    const promise = (async () => {
      try {
        const detailed = await fetchPostDetails(id, token);
        if (detailed) {
          setPrefetchedPosts(prev => (prev[id] ? prev : { ...prev, [id]: detailed }));
          const mediaUrl = resolveMediaUrl(detailed);
          if (mediaUrl) {
            prefetchImageSources([mediaUrl], { priority });
          }
        }
        if (!detailed) {
          failedPrefetchesRef.current.posts.add(id);
        }
        return detailed;
      } catch (err) {
        if (__DEV__) console.warn('Prefetch post failed', err);
        failedPrefetchesRef.current.posts.add(id);
        return null;
      } finally {
        delete prefetchPromisesRef.current.posts[id];
      }
    })();

    prefetchPromisesRef.current.posts[id] = promise;
    return promise;
  }, [prefetchedPosts, canUseToken, refreshSession, token, isTokenExpired]);

  const ensureEventPrefetched = useCallback(async (id, priority = 'low') => {
    if (!id) return null;
    if (prefetchedEvents[id]) return prefetchedEvents[id];
    if (failedPrefetchesRef.current.events.has(id)) return null;
    if (!canUseToken()) {
      if (
        typeof isTokenExpired === 'function' &&
        token &&
        isTokenExpired(token) &&
        typeof refreshSession === 'function' &&
        !didAttemptTokenRefreshRef.current
      ) {
        didAttemptTokenRefreshRef.current = true;
        try { await refreshSession(); } catch (_) {}
      }
      return null;
    }

    if (prefetchPromisesRef.current.events[id]) {
      return prefetchPromisesRef.current.events[id];
    }

    const promise = (async () => {
      try {
        const detailed = await fetchEventDetails(id, token);
        if (detailed) {
          setPrefetchedEvents(prev => (prev[id] ? prev : { ...prev, [id]: detailed }));
          if (detailed.imageUrl) {
            prefetchImageSources([detailed.imageUrl], { priority });
          }
        }
        if (!detailed) {
          failedPrefetchesRef.current.events.add(id);
        }
        return detailed;
      } catch (err) {
        if (__DEV__) console.warn('Prefetch event failed', err);
        failedPrefetchesRef.current.events.add(id);
        return null;
      } finally {
        delete prefetchPromisesRef.current.events[id];
      }
    })();

    prefetchPromisesRef.current.events[id] = promise;
    return promise;
  }, [prefetchedEvents, canUseToken, refreshSession, token, isTokenExpired]);

  const ensureActivityPrefetched = useCallback(async (id, priority = 'low') => {
    if (!id) return null;
    if (prefetchedActivities[id]) return prefetchedActivities[id];
    if (failedPrefetchesRef.current.activities.has(id)) return null;
    if (!canUseToken()) {
      if (
        typeof isTokenExpired === 'function' &&
        token &&
        isTokenExpired(token) &&
        typeof refreshSession === 'function' &&
        !didAttemptTokenRefreshRef.current
      ) {
        didAttemptTokenRefreshRef.current = true;
        try { await refreshSession(); } catch (_) {}
      }
      return null;
    }

    if (prefetchPromisesRef.current.activities[id]) {
      return prefetchPromisesRef.current.activities[id];
    }

    const promise = (async () => {
      try {
        const detailed = await fetchActivityDetails(id, token);
        if (detailed) {
          setPrefetchedActivities(prev => (prev[id] ? prev : { ...prev, [id]: detailed }));
          if (detailed.imageUrl) {
            prefetchImageSources([detailed.imageUrl], { priority });
          }
        }
        if (!detailed) {
          failedPrefetchesRef.current.activities.add(id);
        }
        return detailed;
      } catch (err) {
        if (__DEV__) console.warn('Prefetch activity failed', err);
        failedPrefetchesRef.current.activities.add(id);
        return null;
      } finally {
        delete prefetchPromisesRef.current.activities[id];
      }
    })();

    prefetchPromisesRef.current.activities[id] = promise;
    return promise;
  }, [prefetchedActivities, canUseToken, refreshSession, token, isTokenExpired]);

  // Group notifications when context provides them
  useEffect(() => {
    if (userNotifications == null) {
      setFlatNotifications([]);
      setLoading(true);
      return;
    }
    setLoading(false);
    // Format raw notifications
    const formatted = userNotifications.map((n) => {
      const rawType = n.type?.typeName || n.type || '';
      const typeKey = rawType.toLowerCase();
      let type = mapNotificationType(typeKey);
      const { activityId, sessionId } = extractActivityAndSessionIds(n);
      if (typeKey === 'venue_request_decided' && activityId) {
        type = 'activity';
      }
      const targetId = normalizeIdValue(n.target?._id) || normalizeIdValue(n.target?.id) || normalizeIdValue(n.targetId);
      const chatParams = type === 'chat' ? extractChatNavigationParams(n, { fallbackTypeName: rawType }) : null;
      const resolvedActivityId = type === 'activity' ? (activityId || targetId) : null;
      const resolvedSessionId = sessionId || (type === 'activity' && typeKey.includes('session') ? targetId : null);
      const actorId =
        normalizeIdValue(n.actor) ||
        normalizeIdValue(n.actorId) ||
        normalizeIdValue(n.additionalData?.actor) ||
        normalizeIdValue(n.additionalData?.actorId);
      const caption = n.additionalData?.caption || '';

      return {
        id: n._id,
        scope: n.scope === 'community' ? 'community' : 'personal',
        type,
        rawType,
        targetId,
        activityId: resolvedActivityId,
        sessionId: resolvedSessionId,
        actorId,
        chatId: chatParams?.chatId || '',
        title: caption || 'Notification',
        message: caption || '',
        time: formatTime(n.createdAt),
        timeStamp: n.createdAt,
        read: n.isRead,
      };
    });
    // Group by date
    const grouped = {};
    formatted.forEach((n) => {
      const group = getDateGroup(n.timeStamp);
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(n);
    });
    setGroupedNotifList(grouped);
    setFlatNotifications(formatted);
    setHasMore(userNotifications.length >= LIMIT);
    // Update unread count badge
    const unread = formatted.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [setUnreadCount, userNotifications]);

  useEffect(() => {
    if (!flatNotifications.length) return;
    if (!canUseToken()) return;

    const postsToPrefetch = [];
    const eventsToPrefetch = [];
    for (const notif of flatNotifications) {
      if (!notif?.targetId) continue;
      if (notif.type === 'post' && !prefetchedPosts[notif.targetId]) {
        postsToPrefetch.push(notif.targetId);
      } else if (notif.type === 'event' && !prefetchedEvents[notif.targetId]) {
        eventsToPrefetch.push(notif.targetId);
      }
    }

    const limitedPosts = postsToPrefetch.slice(0, PREFETCH_LIMIT);
    const limitedEvents = eventsToPrefetch.slice(0, PREFETCH_LIMIT);

    if (!limitedPosts.length && !limitedEvents.length) return;

    let cancelled = false;
    (async () => {
      await Promise.all([
        ...limitedPosts.map(id => ensurePostPrefetched(id)),
        ...limitedEvents.map(id => ensureEventPrefetched(id)),
      ]);
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [flatNotifications, canUseToken, ensurePostPrefetched, ensureEventPrefetched, prefetchedPosts, prefetchedEvents]);

  const getDateGroup = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();
    const isYesterday = (d) => isSameDay(d, new Date(Date.now() - 86400000));
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (isSameDay(now, date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (diffInDays <= 7) return 'This Week';
    return 'Earlier';
  };

  const markAsRead = async (id) => {
    try {
      await NotificationService.markNotificationAsRead(token, id);
      setGroupedNotifList((prev) => {
        const updated = {};
        for (const [section, items] of Object.entries(prev)) {
          updated[section] = items.map((n) => (n.id === id ? { ...n, read: true } : n));
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const showContentUnavailableAlert = useCallback(() => {
    Alert.alert('Content unavailable', 'We could not open this notification. It may have been removed.');
  }, []);

  const handleNotificationPress = async (item) => {
    if (openingNotificationRef.current) return;
    openingNotificationRef.current = item.id;
    setOpeningNotificationId(item.id);
    try {
      markAsRead(item.id);
      const rawType = typeof item.rawType === 'string' ? item.rawType.toLowerCase() : '';
      const normalizedRawType = rawType.replace(/[^a-z]/g, '');
      const messageLower = (item.message || '').toLowerCase();
      const isCommunityJoinNotification =
        rawType === 'signup' ||
        normalizedRawType.includes('signup') ||
        normalizedRawType.includes('joincommunity') ||
        normalizedRawType.includes('communityjoin') ||
        normalizedRawType.includes('newmember') ||
        messageLower.includes('joined your community') ||
        messageLower.includes('joined the community');

      if (isCommunityJoinNotification) {
        const profileId = item.actorId || item.targetId;
        if (profileId) {
          navigation.navigate('PublicUserProfile', { userId: profileId });
        } else {
          console.warn('Community join notification missing actorId', item);
          showContentUnavailableAlert();
        }
        return;
      }

      switch (item.type) {
        case 'post': {
          const postId = item.targetId;
          if (!postId) {
            console.warn('Post notification missing targetId', item);
            showContentUnavailableAlert();
            return;
          }
          let preload = prefetchedPosts[postId];
          if (!preload) {
            const ensurePromise = ensurePostPrefetched(postId, 'high');
            preload = await ensurePromise;
          }
          if (!preload) {
            showContentUnavailableAlert();
            return;
          }
          navigateToPostDetail({
            navigation,
            post: preload,
            postId,
            token,
            isTokenExpired,
          });
          break;
        }
        case 'activity': {
          const activityId = item.activityId || item.targetId;
          if (!activityId) {
            console.warn('Activity notification missing activityId', item);
            showContentUnavailableAlert();
            return;
          }
          let preload = prefetchedActivities[activityId];
          if (!preload) {
            const ensurePromise = ensureActivityPrefetched(activityId, 'high');
            preload = await ensurePromise;
          }
          if (!preload) {
            showContentUnavailableAlert();
            return;
          }
          const params = {};
          if (item.sessionId) {
            params.initialSessionId = item.sessionId;
          }
          navigateToActivityDetail({
            navigation,
            activityPreload: preload,
            activityId,
            token,
            isTokenExpired,
            params,
          });
          break;
        }
        case 'event': {
          const eventId = item.targetId;
          if (!eventId) {
            console.warn('Event notification missing targetId', item);
            showContentUnavailableAlert();
            return;
          }
          let preload = prefetchedEvents[eventId];
          if (!preload) {
            const ensurePromise = ensureEventPrefetched(eventId, 'high');
            preload = await ensurePromise;
          }
          if (!preload) {
            showContentUnavailableAlert();
            return;
          }
          navigateToEventDetail({
            navigation,
            event: preload,
            eventId,
            token,
            isTokenExpired,
          });
          break;
        }
        case 'chat': {
          const chatId = item.chatId;
          if (!chatId) {
            console.warn('Chat notification missing chatId', item);
            showContentUnavailableAlert();
            return;
          }
          clearChatUnread?.(chatId);
          prefetchChatMessages?.(chatId, { silent: true }).catch(() => {});
          const cachedMessages = getChatMessages?.(chatId)?.messages;
          const cachedChat = getChatById?.(chatId);
          const params = {
            chatId,
            ...(cachedChat ? { chatRecord: cachedChat } : {}),
            ...(cachedMessages?.length ? { chatMessages: cachedMessages } : {}),
          };
          navigateWithinMainTabs({
            navigation,
            tab: 'Chat',
            screen: 'ChatDetail',
            params,
          });
          break;
        }
        case 'announcement':
          navigation.navigate('Main', { screen: 'Profile' });
          break;
        default:
          console.warn('Unknown notification type', item);
          showContentUnavailableAlert();
          break;
      }
    } catch (err) {
      console.error('Notification press error:', err);
      showContentUnavailableAlert();
    } finally {
      openingNotificationRef.current = null;
      setOpeningNotificationId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await NotificationService.getAllNotifications(token, { limit: LIMIT, offset: 0 });
      const notifs = response.data || [];
      const currentUserId = user?.id || user?._id;
      const sanitized = filterOutSelfAuthoredPostNotifications(notifs, currentUserId);
      setUserNotifications(sanitized);
      const unread = sanitized.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredNotifList = [];

  Object.entries(groupedNotifList).forEach(([section, items]) => {
    const scopedItems = items.filter((item) => item.scope === activeTab);
    if (scopedItems.length > 0) {
      filteredNotifList.push({ id: `section-${section}`, type: 'section', title: section });
      scopedItems.forEach((item) => filteredNotifList.push(item));
    }
  });

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    const targetKey = activeTab;
    const layout = tabLayouts[targetKey];
    if (!layout) return;
    const isLast = targetKey === 'community';
    const inset = isLast ? 4 : 0;
    const targetX = layout.x + inset;
    const targetWidth = Math.max(10, layout.width - inset * 2);
    Animated.timing(tabIndicatorX, {
      toValue: targetX,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(tabIndicatorWidth, {
      toValue: targetWidth,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [activeTab, tabLayouts, tabIndicatorWidth, tabIndicatorX]);

  // Always render header and toggles, show spinner inline while loading

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toggleIndicator,
            {
              transform: [{ translateX: tabIndicatorX }],
              width: tabIndicatorWidth,
              opacity: tabLayoutReady ? 1 : 0,
            },
          ]}
        />
        <Pressable
          style={styles.toggleButton}
          onPress={() => setActiveTab('personal')}
          onLayout={({ nativeEvent }) => {
            const { x, width } = nativeEvent.layout;
            setTabLayouts((prev) => {
              if (prev.personal?.x === x && prev.personal?.width === width) return prev;
              return { ...prev, personal: { x, width } };
            });
            if (!tabLayoutReady && Object.keys(tabLayouts).length === 0) {
              tabIndicatorX.setValue(x);
              tabIndicatorWidth.setValue(width);
            }
          }}
        >
          <Animated.Text
            style={[
              styles.toggleText,
              {
                color: activeTab === 'personal' ? themeVariables.whiteColor : themeVariables.blackColor,
              },
            ]}
          >
            Personal
          </Animated.Text>
        </Pressable>
        <Pressable
          style={styles.toggleButton}
          onPress={() => setActiveTab('community')}
          onLayout={({ nativeEvent }) => {
            const { x, width } = nativeEvent.layout;
            setTabLayouts((prev) => {
              if (prev.community?.x === x && prev.community?.width === width) return prev;
              return { ...prev, community: { x, width } };
            });
            if (!tabLayoutReady && Object.keys(tabLayouts).length === 0) {
              tabIndicatorX.setValue(x);
              tabIndicatorWidth.setValue(width);
            }
          }}
        >
          <Animated.Text
            style={[
              styles.toggleText,
              {
                color: activeTab === 'community' ? themeVariables.whiteColor : themeVariables.blackColor,
              },
            ]}
          >
            Community
          </Animated.Text>
        </Pressable>
      </View>
      {/* Loading indicator while fetching notifications */}
      {loading && (
        <ActivityIndicator size="large" color="#312783" style={styles.loading} />
      )}
      <FlatList
        data={filteredNotifList}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) =>
          item.type === 'section' ? (
            <Text style={styles.sectionHeader}>{item.title}</Text>
          ) : (
            <Pressable
              onPress={() => handleNotificationPress(item)}
              disabled={Boolean(openingNotificationId)}
              style={[styles.notification, { backgroundColor: item.read ? '#f5f5f5' : '#dbeafe' }]}
            >
              <NotificationIcon type={item.type} />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              {openingNotificationId === item.id && (
                <ActivityIndicator size="small" color="#312783" style={styles.inlineSpinner} />
              )}
            </Pressable>
          )
        }
        ListFooterComponent={() =>
          !loading && filteredNotifList.length > 0 && !hasMore ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>No more notifications</Text>
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {/* Empty state message when no notifications */}
      {filteredNotifList.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: themeVariables.whiteColor,
  },
  notification: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeVariables.borderColor, // @LS-SoftGrey
    borderRadius: 20,
    shadowColor: '#000',           // Shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,                  // Android shadow
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 14,
    marginRight: 30,
    marginBottom: 5,
    color: themeVariables.blackColor, // primary text
  },
  message: {
    fontSize: 12,
    marginRight: 30,
    color: '#444', // @dark-grey-color
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    // Center inline empty state below toggles
    flex: 1,
    justifyContent: 'top',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 24,
    color: themeVariables.blackColor,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inlineSpinner: {
    marginLeft: 'auto',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 8,
    backgroundColor: themeVariables.whiteColor,
    borderColor: themeVariables.blackColor,
    borderWidth: 1,
    borderRadius: 25,
    paddingVertical: 3,
    paddingHorizontal: 2,
    marginHorizontal: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: themeVariables.blackColor,
  },
  toggleIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 2,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 18,
  },
  activeTab: {
    backgroundColor: '#312783', // active tab highlight
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
