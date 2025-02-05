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

  // ✅ Fetch activities and update state
  useEffect(() => {
    if (userActivities && userActivities.length > 0) {
      setActivities(userActivities);
      setLoading(false); // ✅ Stop loading once data is available
    } else {
      setLoading(false); // ✅ Avoid infinite loading state
    }
  }, [userActivities]);

  const renderActivity = ({ item }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item._id })}
    >
      <FastImage
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/200' }} 
        style={styles.activityImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <Text style={styles.activityTitle}>{item.title}</Text>
      <Text style={styles.activityType}>{item.activityType?.name || 'N/A'}</Text>
      <Text style={styles.activityDetails}>
        {item.groupDetails?.day || 'N/A'}, {' '}
        {formatDate(item.startDate)}, {' '}
        {item.groupDetails?.time || 'N/A'}
      </Text>
      <Text style={styles.activityAddress}>
        {item.address?.streetAddress || 'No Address'},{' '}
        {item.address?.suburb || 'No Suburb'}
      </Text>
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
  },
  noActivities: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  activityItem: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  activityImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 26,
  },
  activityType: {
    fontSize: 16,
    color: '#312783',
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22, 
  },
  activityDetails: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
    lineHeight: 22,
  },
  activityAddress: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
    lineHeight: 22,
  },
});

export default Activities;
