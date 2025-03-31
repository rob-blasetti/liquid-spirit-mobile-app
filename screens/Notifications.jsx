import React, { useContext, useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from "react-native";
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
  const { user, token } = useContext(UserContext);
  const [notifList, setNotifList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  const fetchNotifications = async () => {
    try {
      const response = await NotificationService.getAllNotifications(token, user.id);
      console.log(response);
      const formatted = response.data.map((n) => ({
        id: n._id,
        type: mapNotificationType(n.type?.typeName || n.type || ""), // handles populated and non-populated
        title: n.additionalData?.caption || "Notification",
        message: n.additionalData?.caption || "",
        time: formatTime(n.createdAt),
        read: n.isRead,
      }));

      setNotifList(formatted);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markAsRead(item.id)}
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
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
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
});
