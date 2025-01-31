import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { UserContext } from '../contexts/UserContext';
import FastImage from 'react-native-fast-image';

const devAPI = 'http://localhost:5005';
const stagingAPI = 'https://liquid-spirit-backend-staging-2a7049350332.herokuapp.com';

const Activities = ({ navigation }) => {
  const { token, userActivities } = useContext(UserContext);
  const [activities, setActivities] = useState(userActivities);
  const [loading, setLoading] = useState(true);

  console.log('activities: ---> ', activities)


  // // Fetch activities data from the backend
  // useEffect(() => {
  //   const fetchActivities = async () => {
  //     try {
  //       const response = await fetch(`${stagingAPI}/api/activities`, {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${token}`, // Include the token here
  //         },
  //       });
  //       const data = await response.json();
  //       console.log('Fetched activities: ', data);
  //       setActivities(data);
  //     } catch (error) {
  //       console.error('Error fetching activities:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchActivities();
  // }, []);

  // Render activity item
  const renderActivity = ({ item }) => (
    <TouchableOpacity
      style={styles.activityItem}
      onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
    >
      <FastImage
        source={{ uri: item.imageUrl }} 
        style={styles.activityImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <Text style={styles.activityTitle}>{item.title}</Text>
      <Text style={styles.activityType}>{item.activityType?.name || 'N/A'}</Text>
      <Text style={styles.activityDetails}>
        {item.groupDetails?.day || 'N/A'},{' '}
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
      <Text style={styles.header}>Upcoming Activities</Text>
      {/* {loading ? (
        <ActivityIndicator size="large" color="#0485e2" />
      ) : ( */}
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id.toString()} // Use `_id` instead of `id`
          renderItem={renderActivity}
        />
      {/* )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    color: '#0485e2',
    marginBottom: 16,
    textAlign: 'center',
  },
  activityItem: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  activityType: {
    fontSize: 16,
    color: '#666',
  },
  activityDetails: {
    fontSize: 14,
    color: '#666',
  },
  activityAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default Activities;
