import React, { useState, useContext, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// navigation prop is provided by the navigator, no need for useNavigation()
import FastImage from 'react-native-fast-image';
import themeVariables from '../../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../../contexts/UserContext';
import { navigateToEventDetail } from '../../utils/navigateToEventDetail';
import resolveImageSource from '../../utils/imageSource';
import usePrefetchImages from '../../hooks/usePrefetchImages';
import useEventVenue from './hooks/useEventVenue';
import SlideBanner from '../../components/SlideBanner';

const EventCard = ({ event, onPress, formatDate }) => {
  const { venueLabel, isOnline } = useEventVenue(event);
  const imageSource = resolveImageSource(event.imageUrl, {
    priority: 'high',
    fallback: '/img/events/Event_Placeholder.png',
  });

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => onPress(event)}
    >
      <View style={styles.imageContainer}>
        <FastImage
          source={imageSource}
          style={styles.eventImage}
          resizeMode={FastImage.resizeMode.cover}
        />
        {event.eventType && (
          <View style={styles.eventTag}>
            <Text style={styles.eventTagText}>{event.eventType}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.eventTitle}>{event.title || 'No Title Available'}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text style={styles.eventDate}>{formatDate(event.date, event.startTime)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name={isOnline ? 'videocam-outline' : 'location-outline'} size={16} color="#666" />
          <Text style={styles.eventAddress}>{venueLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Events = ({ navigation, route }) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { userEvents, token, isTokenExpired } = useContext(UserContext);
  // Banner for missing event redirect
  const [bannerMessage, setBannerMessage] = useState('');
  useEffect(() => {
    const msg = route?.params?.bannerMessage;
    if (msg) {
      setBannerMessage(msg);
      navigation.setParams({ bannerMessage: undefined });
    }
  }, [route?.params?.bannerMessage, navigation]);
  const [events, setEvents] = useState(userEvents || []);
  const [loading, setLoading] = useState(userEvents ? false : true);

  // Sorting & Filtering
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedEventType, setSelectedEventType] = useState(null); // null means "show all events" by default


  // Animation setup for the filter drawer
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: drawerOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setDrawerOpen(!drawerOpen));
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    setEvents((prevEvents) =>
      [...prevEvents].sort((a, b) =>
        sortOrder === 'asc'
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date)
      )
    );
  }, [sortOrder]);

  const formatDate = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    let date = new Date(dateString);
    let formattedTime = 'No Time';
    if (timeString) {
      let timeDate = new Date(timeString);
      if (!isNaN(timeDate.getTime())) {
        date.setHours(timeDate.getHours(), timeDate.getMinutes());
        formattedTime = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else {
        console.warn('Invalid startTime format:', timeString);
      }
    } else {
      console.warn('Missing startTime for event:', dateString);
    }
    return `${date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })} | ${formattedTime}`;
  };

  const handleEventPress = useCallback(
    (eventData) => {
      navigateToEventDetail({ navigation, event: eventData, token, isTokenExpired });
    },
    [navigation, token, isTokenExpired],
  );

  const filteredEvents = selectedEventType
    ? events.filter((e) => e.eventType === selectedEventType)
    : events;

  // Prefetch only the first screenful to keep things snappy and avoid flooding the cache/network.
  const prefetchTargets = useMemo(
    () => filteredEvents.map(event => event?.imageUrl).filter(Boolean).slice(0, 12),
    [filteredEvents]
  );

  usePrefetchImages(prefetchTargets, { priority: 'high' });

  const bottomPadding = Math.max(bottomInset, 16);

  // Filter events if an event type is selected; otherwise show all.
  return (
    <>
      {bannerMessage ? <SlideBanner message={bannerMessage} onClose={() => setBannerMessage('')} /> : null}
      <View style={styles.container}>
      {/* Control Bar with Filter & Sort */}
      <View style={styles.controlContainer}>
        <TouchableOpacity style={styles.buttonBase} onPress={toggleDrawer}>
        <Ionicons name="filter" size={16} color="#fff" />
        <Text style={styles.buttonText}>Filter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonBase} onPress={toggleSortOrder}>
        <Ionicons name="swap-vertical" size={16} color="#fff" />
        <Text style={styles.buttonText}>
          {sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}
        </Text>
      </TouchableOpacity>
    </View>

      {/* Animated Filter Drawer */}
      <Animated.View
        style={[
          styles.drawerContainer,
          {
            height: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 90],
            }),
            opacity: slideAnim,
          },
        ]}
      >
        <View style={styles.gridContainer}>
        <TouchableOpacity
          style={[
            styles.filterButtonSquare,
            selectedEventType === 'Feast' && styles.selectedFilter,
          ]}
          onPress={() => {
            setSelectedEventType(selectedEventType === 'Feast' ? null : 'Feast');
          }}
        >
          <Ionicons
            name="flame-outline"
            size={20}
            color={selectedEventType === 'Feast' ? '#fff' : '#312783'}
          />
          <Text
            style={[
              styles.filterText,
              selectedEventType === 'Feast' && styles.selectedFilterText,
            ]}
          >
            Feast
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButtonSquare,
            selectedEventType === 'Holy Day' && styles.selectedFilter,
          ]}
          onPress={() => {
            setSelectedEventType(selectedEventType === 'Holy Day' ? null : 'Holy Day');
          }}
        >
          <Ionicons
            name="hand-left-outline"
            size={20}
            color={selectedEventType === 'Holy Day' ? '#fff' : '#312783'}
          />
          <Text
            style={[
              styles.filterText,
              selectedEventType === 'Holy Day' && styles.selectedFilterText,
            ]}
          >
            Holy Day
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButtonSquare,
            selectedEventType === 'Admin' && styles.selectedFilter,
          ]}
          onPress={() => {
            setSelectedEventType(selectedEventType === 'Admin' ? null : 'Admin');
          }}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={selectedEventType === 'Admin' ? '#fff' : '#312783'}
          />
          <Text
            style={[
              styles.filterText,
              selectedEventType === 'Admin' && styles.selectedFilterText,
            ]}
          >
            Admin
          </Text>
        </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Event List */}
      {loading ? (
        <ActivityIndicator size="large" color="#312783" />
      ) : filteredEvents.length > 0 ? (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={handleEventPress}
              formatDate={formatDate}
            />
          )}
          contentContainerStyle={[styles.listContentContainer, { paddingBottom: bottomPadding }]}
        />
      ) : (
        <Text style={styles.noEvents}>No upcoming events.</Text>
      )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
    padding: 16,
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeVariables.screenBackgroundColor,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12, // Rounded edges to make them feel unified
    marginBottom: 12,
    elevation: 3, // Adds shadow for depth (Android)
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312783', // White buttons contrast well on the dark background
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20, // Rounded buttons for modern UI
    flex: 1, // Makes both buttons take equal space
    justifyContent: 'center',
    marginHorizontal: 5, // Adds space between buttons
    elevation: 2, // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    textAlign: 'center',
    width: Platform.select({ android: 90 }),
  },
  drawerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginTop: 10,
  },
  filterButtonSquare: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#312783',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 8,
    marginHorizontal: 4,

    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    // Elevation for Android
    elevation: 5,
  },
  selectedFilter: {
    backgroundColor: '#312783',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#312783',
    marginTop: 5,
    textAlign: 'center',
    width: Platform.select({ android: 100 }),
  },
  selectedFilterText: {
    color: '#fff',
  },
  noEvents: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  listContentContainer: {
    paddingBottom: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: 'rgba(0, 0, 0, 0.16)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 36,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  imageContainer: {
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  eventTag: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#58DB33',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    opacity: 0.9,
  },
  eventTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C5C0E',
    textAlign: 'center',
  },
  cardContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeVariables.blackColor || '#111',
    flexShrink: 1,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
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
    flexShrink: 1,
  },
});

export default Events;
