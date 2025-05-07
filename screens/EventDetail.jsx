import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { joinEvent, fetchEventDetails } from '../services/EventService';
import localImages from '../utils/localImages';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faClock, faCarSide } from '@fortawesome/free-solid-svg-icons';

const EventDetail = ({ route }) => {
  const { event: initialEvent, eventId } = route.params || {};
  const { user, token, communityId } = useContext(UserContext);

  const [event, setEvent] = useState(initialEvent || null);
  const [loading, setLoading] = useState(!initialEvent);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!event && eventId && token) {
        try {
          const fetched = await fetchEventDetails(eventId, token);
          setEvent(fetched);
          setHasJoined(fetched.attendees?.some(att => att.refId?.toString() === user?.id?.toString()));
        } catch (err) {
          setError('Failed to fetch event');
        } finally {
          setLoading(false);
        }
      } else if (initialEvent) {
        setHasJoined(initialEvent.attendees?.some(att => att.refId?.toString() === user?.id?.toString()));
      }
    };
    fetchEvent();
  }, [eventId, event, token]);

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
    if (!event?.venue) return;
    const encodedAddress = encodeURIComponent(event.venue);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(mapsUrl);
  };

  const handleJoinEvent = async () => {
    if (!event || !token) return;
    setIsJoining(true);
    try {
      // Join the event and notify community
      await joinEvent(event._id, token, event.title, user, communityId);
      setHasJoined(true);
      Alert.alert('Success', 'You have joined the event.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to join the event.');
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.noEventContainer}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.noEventContainer}>
        <Text style={styles.noEventText}>No event to display.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={localImages[event.imageUrl] || require('../assets/img/placeholder.png')}
        style={styles.banner}
      />
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.type}>{event.eventType || 'Unknown Event'}</Text>

        <View style={styles.iconRow}>
          <FontAwesomeIcon icon={faCalendar} size={22} color="#312783" style={styles.iconSpacing} />
          <Text style={styles.iconText}>{formatDate(event.date)}</Text>
        </View>

        <View style={styles.iconRow}>
          <FontAwesomeIcon icon={faClock} size={22} color="#312783" style={styles.iconSpacing} />
          <Text style={styles.iconText}>
            {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
            {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <TouchableOpacity style={styles.iconRow} onPress={openGoogleMaps}>
          <FontAwesomeIcon icon={faCarSide} size={22} color="#312783" style={styles.iconSpacing} />
          <Text style={[styles.iconText, styles.location]}>{event.venue}</Text>
        </TouchableOpacity>

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
    resizeMode: 'cover',
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconSpacing: {
    marginRight: 8,
  },
  iconText: {
    fontSize: 16,
    color: themeVariables.blackColor,
  },
  location: {
    color: themeVariables.primaryColor,
    textDecorationLine: 'underline',
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
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
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  joinButtonDisabledText: {
    color: themeVariables.whiteColor,
    fontSize: 16,
    fontWeight: '600',
  },
  noEventContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
    padding: 20,
  },
  noEventText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

export default EventDetail;
