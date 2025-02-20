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
import { Ionicons } from '@expo/vector-icons'; // For location icon
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMapLocation } from '@fortawesome/free-solid-svg-icons';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });

  const suffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return `${day}${suffix(day)} ${month}`;
};

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

  const renderActivity = ({ item }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item._id })}
    >
      {/* Image */}
      <FastImage
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/400' }}
        style={styles.activityImage}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityType}>{item.activityType?.name || 'N/A'}</Text>
        <Text style={styles.activityDetails}>
          {item.groupDetails?.day || 'N/A'}, {formatDate(item.date)}, {item.groupDetails?.time || 'N/A'}
        </Text>

        {/* Address with Location Icon */}
        <View style={styles.locationRow}>
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
        <ActivityIndicator size="large" color="#0485e2" />
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

    // Custom Box Shadow
    shadowColor: 'rgba(0, 0, 0, 0.16)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 36,
    
    elevation: 6, // For Android shadow

    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)', // Soft border effect
  },
  activityImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  activityType: {
    fontSize: 16,
    color: '#312783',
    fontWeight: '600',
    marginBottom: 6,
  },
  activityDetails: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activityAddress: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default Activities;
