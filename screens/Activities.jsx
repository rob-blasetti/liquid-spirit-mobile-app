import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { UserContext } from '../contexts/UserContext';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMapLocation, faCalendar } from '@fortawesome/free-solid-svg-icons';

const Activities = ({ navigation }) => {
  const { token, userActivities } = useContext(UserContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userActivities && userActivities.length > 0) {
      setActivities(userActivities);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userActivities]);

  const formatDate = (dateString, timeString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Convert time to 12-hour format with AM/PM
    let formattedTime = 'No Time';
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      const dateObj = new Date();
      dateObj.setHours(parseInt(hours, 10));
      dateObj.setMinutes(parseInt(minutes, 10));

      formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return `${date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })} | ${formattedTime}`;
  };

  const renderActivity = ({ item }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item._id })}
    >
      {/* Image Container with Overlayed Tag */}
      <View style={styles.imageContainer}>
        <FastImage
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/400' }}
          style={styles.activityImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        {item.activityType?.name && (
          <View style={styles.activityTag}>
            <Text style={styles.activityTagText}>{item.activityType.name}</Text>
          </View>
        )}
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Title */}
        <Text style={styles.activityTitle}>{item.title}</Text>

        {/* Date */}
        <View style={styles.infoRow}>
          <FontAwesomeIcon icon={faCalendar} size={16} color="#666" />
          <Text style={styles.activityDetails}>
            {formatDate(item.date, item.groupDetails?.time)}
          </Text>
        </View>

        {/* Address with Location Icon */}
        <View style={styles.infoRow}>
          <FontAwesomeIcon icon={faMapLocation} size={16} color="#666" />
          <Text style={styles.activityAddress}>
            {item.address?.streetAddress || 'No Address'},{' '}
            {item.address?.suburb || 'No Suburb'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#312783" />
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderActivity}
        />
      ) : (
        <Text style={styles.noActivities}>No upcoming activities.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 45,
  },
  noActivities: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: 'rgba(0, 0, 0, 0.16)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 36,
    elevation: 6, // For Android shadow
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)', // Soft border effect
  },
  imageContainer: {
    position: 'relative',
  },
  activityImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  activityTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#58DB33', // Bright green tag
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    opacity: 0.9, // Slight transparency for a modern feel
  },
  activityTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C5C0E', // Darker green for contrast
  },
  cardContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#312783', // Primary color
    flexShrink: 1,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 15,
    color: '#666',
    marginLeft: 6,
  },
  activityAddress: {
    fontSize: 15,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default Activities;
