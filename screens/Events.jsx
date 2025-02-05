import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { UserContext } from '../contexts/UserContext';
import API_URL from '../config';

const Events = () => {
  const { token, userEvents } = useContext(UserContext);
  const [events, setEvents] = useState(userEvents || []);
  const [loading, setLoading] = useState(userEvents ? false : true);
  const navigation = useNavigation();

  const localImages = {
    '/img/feast/Feast of Beauty.png': require('../assets/img/feast/Feast_of_Beauty.png'),
    '/img/feast/Feast of Dominion.jpg': require('../assets/img/feast/Feast_of_Dominion.jpg'),
    '/img/feast/Feast of Glory.jpg': require('../assets/img/feast/Feast_of_Glory.jpg'),
    '/img/feast/Feast of Grandeur.jpg': require('../assets/img/feast/Feast_of_Grandeur.jpg'),
    '/img/feast/Feast of Knowledge.jpg': require('../assets/img/feast/Feast_of_Knowledge.jpg'),
    '/img/feast/Feast of Light.jpg': require('../assets/img/feast/Feast_of_Light.jpg'),
    '/img/feast/Feast of Loftiness.png': require('../assets/img/feast/Feast_of_Loftiness.png'),
    '/img/feast/Feast of Mercy.jpg': require('../assets/img/feast/Feast_of_Mercy.jpg'),
    '/img/feast/Feast of Might.jpg': require('../assets/img/feast/Feast_of_Might.jpg'),
    '/img/feast/Feast of Names.jpg': require('../assets/img/feast/Feast_of_Names.jpg'),
    '/img/feast/Feast of Perfection.jpg': require('../assets/img/feast/Feast_of_Perfection.jpg'),
    '/img/feast/Feast of Power.jpg': require('../assets/img/feast/Feast_of_Power.jpg'),
    '/img/feast/Feast of Questions.jpg': require('../assets/img/feast/Feast_of_Questions.jpg'),
    '/img/feast/Feast of Speech.jpg': require('../assets/img/feast/Feast_of_Speech.jpg'),
    '/img/feast/Feast of Splendour.jpg': require('../assets/img/feast/Feast_of_Splendour.jpg'),
    '/img/feast/Feast of Will.jpg': require('../assets/img/feast/Feast_of_Will.jpg'),
    '/img/feast/Feast of Words.jpg': require('../assets/img/feast/Feast_of_Words.jpg'),
    '/img/feast/Feast of Honor.jpg': require('../assets/img/feast/Feast_of_Honor.jpg'),
    '/img/feast/Feast of Sovereignty.jpg': require('../assets/img/feast/Feast_of_Sovereignty.jpg'),
    '/img/holyday/AscentionOfAbdul.jpg': require('../assets/img/holyday/AscentionOfAbdul.jpg'),
    '/img/holyday/AscentionOfBaha.jpg': require('../assets/img/holyday/AscentionOfBaha.jpg'),
    '/img/holyday/AyyamIHa.png': require('../assets/img/holyday/AyyamIHa.png'),
    '/img/holyday/BirthOfBab.jpeg': require('../assets/img/holyday/BirthOfBab.jpeg'),
    '/img/holyday/BirthOfBaha.jpeg': require('../assets/img/holyday/BirthOfBaha.jpeg'),
    '/img/holyday/DayOfTheCovenant.jpg': require('../assets/img/holyday/DayOfTheCovenant.jpg'),
    '/img/holyday/DeclarationOfBab.png': require('../assets/img/holyday/DeclarationOfBab.png'),
    '/img/holyday/FirstOfRidvan.jpeg': require('../assets/img/holyday/FirstOfRidvan.jpeg'),
    '/img/holyday/MartyrdomOfBab.jpg': require('../assets/img/holyday/MartyrdomOfBab.jpg'),
    '/img/holyday/NawRuz.jpg': require('../assets/img/holyday/NawRuz.jpg'),
    '/img/holyday/NinthOfRidvan.jpg': require('../assets/img/holyday/NinthOfRidvan.jpg'),
    '/img/holyday/TwelfthOfRidvan.jpg': require('../assets/img/holyday/TwelfthOfRidvan.jpg')
  };

  // useEffect(() => {
  //   const fetchEvents = async () => {
  //     try {
  //       const response = await fetch(`${API_URL}/api/events`, {
  //         method: 'GET',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //       const result = await response.json();
  //       if (result.success) {
  //         setEvents(result.data);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching events:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchEvents();
  // }, []);

  // Render each event (memoized for performance)
  const RenderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('EventDetail', { event: item })} // Navigate to EventDetail with event data
    >
      <FastImage
        source={localImages[item.imageUrl] ?? require('../assets/img/placeholder.png')}
        style={styles.eventImage}
        resizeMode={FastImage.resizeMode.cover}
      />
      <Text style={styles.eventTitle}>{item.title || 'No Title Available'}</Text>
      <Text style={styles.eventDate}>
        {new Date(item.date).toLocaleDateString()} -{' '}
        {item.startTime
          ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'No Time'}
      </Text>
      <Text style={styles.eventAddress}>{item.venue || 'No Address, No City'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
    <Text style={styles.header}>Upcoming Events</Text>
    {loading ? (
      <ActivityIndicator size="large" color="#0485e2" />
    ) : (
      <FlatList
        data={events}
        keyExtractor={(item) => item._id.toString()} // Ensure each item has a unique `_id`
        renderItem={({ item }) => <RenderEvent item={item} />}
      />
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
  header: {
    fontSize: 24,
    color: '#0485e2',
    marginBottom: 16,
    textAlign: 'center',
  },
  eventItem: {
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
  eventImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eventDate: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  eventAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default Events;
