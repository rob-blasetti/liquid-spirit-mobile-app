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
  faCompass,
} from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '../contexts/UserContext';
import NotificationService from "../services/NotificationService";

const NotificationIcon = ({ type }) => {
  switch (type) {
    case "post":
      return <FontAwesomeIcon icon={faUsers} size={20} />;
    case "activity":
      return <FontAwesomeIcon icon={faAlignLeft} size={20} />;
    case "event":
      return <FontAwesomeIcon icon={faCalendar} size={20} />;        
    case "announcement":
      return <FontAwesomeIcon icon={faInfo} size={20} />;
    default:
      return <FontAwesomeIcon icon={faBell} size={20} />;
  }
};

export default function Notifications() {
  const navigation = useNavigation();
  const { user, token } = useContext(UserContext);
  const [notifList, setNotifList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { setUnreadCount } = useContext(UserContext);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  const fetchNotifications = async (append = false) => {
    try {
      const response = await NotificationService.getAllNotifications(token, {
        limit: LIMIT,
        offset: append ? notifList.length : 0,
      });

      const newData = response.data;
      if (newData.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      const formatted = response.data.map((n) => ({
        id: n._id,
        type: mapNotificationType(n.type?.typeName || ""),
        targetId: n.target?._id,
        title: n.additionalData?.caption || "Notification",
        message: n.additionalData?.caption || "",
        time: formatTime(n.createdAt),
        timeStamp: n.createdAt,
        read: n.isRead,
      }));
  
      const grouped = {};

      console.log("Formatted Notifications:", formatted);

      formatted.forEach((n) => {
        const group = getDateGroup(n.timeStamp);
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(n);
      });

      const flattened = [];
      Object.entries(grouped).forEach(([section, items]) => {
        flattened.push({ id: `section-${section}-${Date.now()}-${Math.random()}`, type: 'section', title: section });

        items.forEach((item) => {
          flattened.push({ ...item, type: item.type });
        });
      });

      setNotifList((prev) => append ? [...prev, ...flattened] : flattened);

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
  
    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  
    const isYesterday = (d) => {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      return isSameDay(d, y);
    };
  
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
    if (isSameDay(now, date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (diffInDays <= 7) return 'This Week';
    return 'Earlier';
  };

  const markAsRead = async (id) => {
    try {
      await NotificationService.markNotificationAsRead(token, id);
      setNotifList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
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
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Notifications</Text>
      <FlatList
        data={notifList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
        
          return (
            <Pressable
              onPress={() => handleNotificationPress(item)}
              style={[
                styles.notification,
                { backgroundColor: item.read ? "#f5f5f5" : "#dbeafe" },
              ]}
            >
              <NotificationIcon type={item.type} />
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={() =>
          !loading && notifList.length > 0 && !hasMore ? (
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
      {notifList.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You're all caught up!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", marginBottom: 45 },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },
  notification: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  textContainer: { marginLeft: 10 },
  title: { fontWeight: "bold", fontSize: 16, marginRight: 30 },
  message: { fontSize: 14, color: "#555" },
  time: { fontSize: 12, color: "#999" },
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
    color: '#444',
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
});
