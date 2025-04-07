import React, { useContext, useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faBell,
  faUsers,
  faCalendar,
  faInfo,
  faAlignLeft,
} from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '../contexts/UserContext';
import NotificationService from "../services/NotificationService";

const NotificationIcon = ({ type }) => {
  const iconStyle = { color: "#312783" };

  switch (type) {
    case "post":
      return <FontAwesomeIcon icon={faUsers} size={20} style={iconStyle} />;
    case "activity":
      return <FontAwesomeIcon icon={faAlignLeft} size={20} style={iconStyle} />;
    case "event":
      return <FontAwesomeIcon icon={faCalendar} size={20} style={iconStyle} />;        
    case "announcement":
      return <FontAwesomeIcon icon={faInfo} size={20} style={iconStyle} />;
    default:
      return <FontAwesomeIcon icon={faBell} size={20} style={iconStyle} />;
  }
};

export default function Notifications() {
  const navigation = useNavigation();
  const { token, setUnreadCount } = useContext(UserContext);
  const [groupedNotifList, setGroupedNotifList] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const LIMIT = 10;

  const fetchNotifications = async (append = false) => {
    try {
      const response = await NotificationService.getAllNotifications(token, {
        limit: LIMIT,
        offset: append ? Object.values(groupedNotifList).flat().length : 0,
      });

      console.log(response);

      const newData = response.data;
      if (newData.length < LIMIT) setHasMore(false);

      const formatted = newData.map((n) => ({
        id: n._id,
        scope: n.scope === 'community' ? 'community' : 'personal',
        type: mapNotificationType(n.type?.typeName || ""),
        targetId: n.target?._id,
        title: n.additionalData?.caption || "Notification",
        message: n.additionalData?.caption || "",
        time: formatTime(n.createdAt),
        timeStamp: n.createdAt,
        read: n.isRead,
      }));

      const grouped = {};
      formatted.forEach((n) => {
        const group = getDateGroup(n.timeStamp);
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(n);
      });

      setGroupedNotifList((prev) => {
        const merged = { ...prev };
        for (let [section, items] of Object.entries(grouped)) {
          if (!merged[section]) merged[section] = items;
          else {
            const existingIds = new Set(merged[section].map((i) => i.id));
            const newUniqueItems = items.filter((i) => !existingIds.has(i.id));
            merged[section] = [...merged[section], ...newUniqueItems];
          }
        }
        return merged;
      });

      const unreadCount = formatted.filter((n) => !n.read).length;
      setUnreadCount(unreadCount);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleNotificationPress = async (item) => {
    try {
      markAsRead(item.id);
      console.log(item.type);
      switch (item.type) {
        case 'post':
          // navigation.navigate("PostDetail", { postId: item.targetId });
          navigation.navigate('Feed');
          break;
        case 'activity':
          navigation.navigate("ActivityDetail", { activityId: item.targetId });
          break;
        case 'event':
          navigation.navigate("EventDetail", { eventId: item.targetId });
          break;
        case 'announcement':
          navigation.navigate("Profile");
          break;
        default:
          console.warn("Unknown notification type");
          break;  
      };
    } catch (err) {
      console.error("Notification press error:", err);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotifications();
    } catch (error) {
      console.error("Error refreshing notifications:", error);
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
    post_media: "post",
    post_created: "post",
    new_activity: "activity",
    join_activity: "activity",
    activity_updated: "activity",
    join_event: "event",
    signup: "announcement",
  };
  
  const mapNotificationType = (typeName) => {
    return typeCategoryMap[typeName] || "general";
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#312783" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Notifications (Beta)</Text>
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
              color: activeTab === 'personal' ? '#fff' : '#312783',
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
              color: activeTab === 'community' ? '#fff' : '#312783',
            }}
          >
            Community
          </Text>
        </Pressable>
      </View>
      <FlatList
        data={filteredNotifList}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) =>
          item.type === 'section' ? (
            <Text style={styles.sectionHeader}>{item.title}</Text>
          ) : (
            <Pressable
              onPress={() => handleNotificationPress(item)}
              style={[styles.notification, { backgroundColor: item.read ? "#f5f5f5" : "#dbeafe" }]}
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
        onEndReached={() => fetchNotifications(true)}
        onEndReachedThreshold={0.5}
      />
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
    padding: 16,
    backgroundColor: "#f3f3f3", // @LS-SoftGrey
    marginBottom: 45,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#312783", // @LS-TrueBlue
  },
  notification: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#312783",
    borderRadius: 20,
    shadowColor: "#000",           // Shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,                  // Android shadow
  },
  textContainer: { marginLeft: 10 },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 30,
    marginBottom: 5,
    color: "blck", // primary text
  },
  message: {
    fontSize: 14,
    marginRight: 30,
    color: "#444", // @dark-grey-color
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: "#312783",
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
