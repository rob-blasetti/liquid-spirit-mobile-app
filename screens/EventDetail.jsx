import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator
} from 'react-native';import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { joinEvent } from '../services/EventService'; // adjust the path as needed
import localImages from '../utils/localImages';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faClock, faCarSide } from '@fortawesome/free-solid-svg-icons';

const EventDetail = ({ route }) => {
  const { event } = route.params;
  const { user, token } = useContext(UserContext);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(
    user && event.attendees
      ? event.attendees.some(attendee => attendee.refId.toString() === user.id.toString())
      : false
  );

  const isAttendee = user && event.attendees
    ? event.attendees.some(attendee => attendee.refId.toString() === user.id.toString())
    : false;

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

  const openGoogleMaps = () => {
    if (!event.venue) return;
    const encodedAddress = encodeURIComponent(event.venue);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(mapsUrl);
  };

  const handleJoinEvent = async () => {
    console.log('handleJoinEvent pressed');
    console.log('join event, parameters 1: ', event._id, token); // not working
    setIsJoining(true);
    console.log('post set is joining true');
    try {
      console.log('in try block');
      console.log('join event, parameters 2: ', event._id, token); // not working
      await joinEvent(event._id, token); //not getting called
      setHasJoined(true);
      Alert.alert('Success', 'You have joined the event.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join the event. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Event Image */}
      <Image
        source={localImages[event.imageUrl] || require('../assets/img/placeholder.png')}
        style={styles.banner}
      />

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.type}>{event.eventType || 'Unknown Event'}</Text>

        {/* Event Date & Time */}
        <Text style={styles.date}>
          <FontAwesomeIcon icon={faCalendar} size={16} color="#312783" />
          <Text style={styles.iconText}>{formatDate(event.date)}</Text>
        </Text>

        <Text style={styles.time}>
          <FontAwesomeIcon icon={faClock} size={16} color="#312783" />
          <Text style={styles.iconText}>
            {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
            {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Text>

        {/* Location (Clickable) */}
        <TouchableOpacity onPress={openGoogleMaps}>
          <Text style={styles.location}>
            <FontAwesomeIcon icon={faCarSide} size={16} color="#312783" />
            <Text style={styles.iconText}>{event.venue}</Text>
          </Text>
        </TouchableOpacity>

        {/* Event Description */}
        <Text style={styles.descriptionHeader}>Description:</Text>
        <Text style={styles.description}>{event.description}</Text>

        {!hasJoined ? (
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinEvent} disabled={isJoining}>
            {isJoining ? (
              <ActivityIndicator color={themeVariables.whiteColor} />
            ) : (
              <Text style={styles.joinButtonText}>Join Event</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.joinButtonDisabled}>
            <Text style={styles.joinButtonDisabledText}>You are attending</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: themeVariables.whiteColor,
    flexGrow: 1,
    paddingBottom: 20,
  },
  banner: {
    width: '100%',
    height: 220,
    resizeMode: 'cover'
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    marginBottom: 12,
  },
  type: {
    fontSize: 18,
    color: themeVariables.primaryColor,
    marginBottom: 8,
    fontWeight: '600',
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    fontSize: 18,
    color: themeVariables.blackColor,
    marginBottom: 6,
  },
  time: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
    fontSize: 16,
    color: themeVariables.blackColor,
    marginBottom: 10,
  },
  iconText: {
    marginLeft: 10, // This adds space after the icon
  },
  location: {
    fontSize: 16,
    color: themeVariables.primaryColor,
    marginBottom: 20,
    fontWeight: '600',
    textDecorationLine: 'underline',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: themeVariables.blackColor,
  },
  description: {
    fontSize: 16,
    color: themeVariables.blackColor,
    lineHeight: 24,
  },
  joinButton: {
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  joinButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 16,
    fontWeight: '600',
  },
  joinButtonDisabled: {
    backgroundColor: '#aaa',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  joinButtonDisabledText: {
    color: themeVariables.whiteColor,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EventDetail;
