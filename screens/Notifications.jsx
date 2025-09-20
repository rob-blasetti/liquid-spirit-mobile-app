import React, { useContext, useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import NotificationService from '../services/NotificationService';
import { Chip } from 'react-native-paper';
import { navigateToPostDetail } from '../utils/navigateToPostDetail';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
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
  const typeName = (notification.type?.typeName || '').toLowerCase();

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

export default function Notifications() {
  const navigation = useNavigation();
  const { token, isTokenExpired, setUnreadCount, userNotifications, setUserNotifications } = useContext(UserContext);
  const [groupedNotifList, setGroupedNotifList] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('community');
  const LIMIT = 10;

  // Group notifications when context provides them
  useEffect(() => {
    if (userNotifications == null) {
      setLoading(true);
      return;
    }
    setLoading(false);
    // Format raw notifications
    const formatted = userNotifications.map((n) => {
      const rawType = n.type?.typeName || '';
      const typeKey = rawType.toLowerCase();
      const type = mapNotificationType(typeKey);
      const { activityId, sessionId } = extractActivityAndSessionIds(n);
      const targetId = normalizeIdValue(n.target?._id) || normalizeIdValue(n.target?.id) || normalizeIdValue(n.targetId);
      const resolvedActivityId = type === 'activity' ? (activityId || targetId) : null;
      const resolvedSessionId = sessionId || (type === 'activity' && typeKey.includes('session') ? targetId : null);

      return {
        id: n._id,
        scope: n.scope === 'community' ? 'community' : 'personal',
        type,
        rawType,
        targetId,
        activityId: resolvedActivityId,
        sessionId: resolvedSessionId,
        title: n.additionalData?.caption || 'Notification',
        message: n.additionalData?.caption || '',
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
    setHasMore(userNotifications.length >= LIMIT);
    // Update unread count badge
    const unread = formatted.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [userNotifications]);

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
        for (let [section, items] of Object.entries(prev)) {
          updated[section] = items.map((n) => (n.id === id ? { ...n, read: true } : n));
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationPress = async (item) => {
    try {
      markAsRead(item.id);
      switch (item.type) {
        case 'post':
          navigateToPostDetail({ navigation, postId: item.targetId, token, isTokenExpired });
          break;
        case 'activity':
          // Navigate to activity detail
          {
            const activityId = item.activityId || item.targetId;
            if (!activityId) {
              console.warn('Activity notification missing activityId', item);
              break;
            }
            const params = { activityId };
            if (item.sessionId) {
              params.initialSessionId = item.sessionId;
            }
            navigation.navigate('ActivityDetailCard', params);
          }
          break;
        case 'event':
          navigateToEventDetail({ navigation, eventId: item.targetId, token, isTokenExpired });
          break;
        case 'announcement':
          // Navigate to Profile tab
          navigation.navigate('Main', { screen: 'Profile' });
          break;
        default:
          console.warn('Unknown notification type');
          break;
      }
    } catch (err) {
      console.error('Notification press error:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await NotificationService.getAllNotifications(token, { limit: LIMIT, offset: 0 });
      const notifs = response.data || [];
      setUserNotifications(notifs);
      const unread = notifs.filter((n) => !n.isRead).length;
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

  const typeCategoryMap = {
    post_media: 'post',
    post_created: 'post',
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
    if (typeCategoryMap[key]) return typeCategoryMap[key];
    if (key.includes('session')) return 'activity';
    if (key.includes('activity')) return 'activity';
    if (key.includes('event')) return 'event';
    if (key.includes('post')) return 'post';
    return 'general';
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Always render header and toggles, show spinner inline while loading

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Notifications</Text>
        <Chip
          mode="outlined"
          style={styles.betaChip}
          textStyle={styles.betaChipText}
        >
          Beta
        </Chip>
      </View>
      <View style={styles.toggleContainer}>
        <Pressable
          style={[
            styles.toggleButton,
            activeTab === 'personal' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('personal')}
        >
          <Text
            style={{
              ...styles.toggleText,
              color: activeTab === 'personal' ? themeVariables.whiteColor : themeVariables.blackColor,
            }}
          >
            Personal
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            activeTab === 'community' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('community')}
        >
          <Text
            style={{
              ...styles.toggleText,
              color: activeTab === 'community' ? themeVariables.whiteColor : themeVariables.blackColor,
            }}
          >
            Community
          </Text>
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
              style={[styles.notification, { backgroundColor: item.read ? '#f5f5f5' : '#dbeafe' }]}
            >
              <NotificationIcon type={item.type} />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
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
    // Space content below transparent header (status bar + header height)
    paddingTop: Platform.select({ ios: 120, android: 120 }),
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: themeVariables.whiteColor,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: themeVariables.blackColor,
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
  textContainer: { marginLeft: 10 },
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
    backgroundColor: '#dcdcdc',
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    width: Platform.select({ android: 95 }),
    textAlign: 'center',
  },
  activeTab: {
    backgroundColor: '#312783', // active tab highlight
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  betaChip: {
    marginLeft: 8,
    marginBottom: 16,
    borderRadius: 20,
  },
});
