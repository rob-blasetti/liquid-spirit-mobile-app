import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faMapLocation, faMapMarker } from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '../contexts/UserContext';

const Events = () => {
  const { userEvents } = useContext(UserContext);
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

  const RenderEvent = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDetail', { event: item })}
    >
      {/* Event Image */}
      <FastImage
        source={localImages[item.imageUrl] ?? require('../assets/img/placeholder.png')}
        style={styles.eventImage}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* Card Content */}
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle}>{item.title || 'No Title Available'}</Text>

        {/* Date */}
        <View style={styles.infoRow}>
          <FontAwesomeIcon icon={faCalendar} size={14} color="#666" />
          <Text style={styles.eventDate}>
            {new Date(item.date).toLocaleDateString()} -{' '}
            {item.startTime
              ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'No Time'}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <FontAwesomeIcon icon={faMapMarker} size={16} color="#666" />
          <Text style={styles.eventAddress}>{item.venue || 'No Address, No City'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0485e2" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id.toString()}
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
    marginBottom: 45,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,

    // Custom Box Shadow
    shadowColor: 'rgba(0, 0, 0, 0.16)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 36,
    elevation: 6, // For Android

    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventDate: {
    fontSize: 15,
    color: '#666',
    marginLeft: 6,
  },
  eventAddress: {
    fontSize: 15,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default Events;
