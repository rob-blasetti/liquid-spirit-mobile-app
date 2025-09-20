import React, { useEffect, useState, useContext } from 'react';
import SlideBanner from '../components/SlideBanner';
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
import { UserContext } from '../contexts/UserContext';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { getNextSessionDate } from '../utils/activityDate';

const Activities = ({ navigation, route }) => {
  const { userActivities } = useContext(UserContext);
  // Banner for missing activity redirect
  const [bannerMessage, setBannerMessage] = useState('');
  useEffect(() => {
    const msg = route?.params?.bannerMessage;
    if (msg) {
      setBannerMessage(msg);
      navigation.setParams({ bannerMessage: undefined });
    }
  }, [route?.params?.bannerMessage, navigation]);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedType, setSelectedType] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];
  console.log(userActivities);

  const activityTypes = [
    { name: "Children's Class", icon: 'accessibility-outline' },
    { name: 'Junior Youth Group', icon: 'people-outline' },
    { name: 'Study Circle', icon: 'book-outline' },
    { name: 'Devotional', icon: 'heart-outline' },
    { name: 'Independent Initiative', icon: 'star-outline' },
    { name: 'Fireside', icon: 'flame-outline' },
  ];

  useEffect(() => {
    if (userActivities?.length > 0) {
      setActivities(userActivities);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userActivities]);

  useEffect(() => {
    filterAndSortActivities();
  }, [activities, selectedType, sortOrder]);

  const filterAndSortActivities = () => {
    // Only include activities with at least one future session
    let filtered = activities.filter((activity) => getNextSessionDate(activity) !== null);

    if (selectedType !== 'All') {
      filtered = filtered.filter((activity) => activity.activityType?.name === selectedType);
    }

    // Sort by the next session date
    filtered.sort((a, b) => {
      const dateA = getNextSessionDate(a) || new Date(0);
      const dateB = getNextSessionDate(b) || new Date(0);
      return sortOrder === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    setFilteredActivities(filtered);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
    Animated.timing(slideAnim, {
      toValue: drawerOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleFilterSelection = (type) => {
    setSelectedType(prevType => prevType === type ? 'All' : type);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const renderActivity = ({ item }) => {
    const nextSession = getNextSessionDate(item);
    let sessionLabel = 'TBA';
    if (nextSession) {
      const datePart = nextSession.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const timePart = nextSession.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      sessionLabel = `${datePart} | ${timePart}`;
    }

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => navigation.navigate('ActivityDetailCard', { activityId: item._id, activityPreload: item })}
      >
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

        <View style={styles.cardContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.activityDetails}>{sessionLabel}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name={item.onlineLink ? 'videocam-outline' : 'location-outline'}
              size={16}
              color="#666"
            />
            <Text style={styles.activityAddress}>
              {item.onlineLink
                ? 'Online'
                : `${item.address?.streetAddress || 'No Address'}, ${item.address?.suburb || 'No Suburb'}`}
            </Text>
          </View>

        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {bannerMessage ? <SlideBanner message={bannerMessage} onClose={() => setBannerMessage('')} /> : null}
      <View style={styles.container}>
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

      <Animated.View
        style={[
          styles.drawerContainer,
          {
            height: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 210] }),
            opacity: slideAnim,
          },
        ]}
      >
        {drawerOpen && (
          <View style={styles.gridContainer}>
            {activityTypes.map(({ name, icon }) => (
              <TouchableOpacity
                key={name}
                style={[styles.filterButtonSquare, selectedType === name && styles.selectedFilter]}
                onPress={() => handleFilterSelection(name)}
              >
                <Ionicons name={icon} size={24} color={selectedType === name ? '#fff' : '#312783'} />
                <Text style={[styles.filterText, selectedType === name && styles.selectedFilterText]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      ) : filteredActivities.length > 0 ? (
        <FlatList style={styles.flatListContainer} data={filteredActivities} keyExtractor={(item) => item._id.toString()} renderItem={renderActivity} />
      ) : (
        !drawerOpen && <Text style={styles.noActivities}>No matching activities.</Text>
      )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: themeVariables.darkGreyColor,
  },
  controlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeVariables.darkGreyColor, // Dark background to visually group buttons
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12, // Rounded edges to make them feel unified
    marginBottom: 4,
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
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4, // Shadow for better visibility
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 5, // Ensures even spacing
    marginTop: 20,
  },
  filterButtonSquare: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: '#312783',
    borderStyle: 'solid',
    borderWidth: 1, // Corrected from '1' to numeric value
    borderRadius: 10,
    marginBottom: 8,
    padding: 8, // Extra padding for better tap area

    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,

    // Elevation for Android
    elevation: 5,
  },
  selectedFilter: {
    backgroundColor: '#312783', // Purple highlight for selected filters
  },
  flatListContainer: {
    marginTop: 20,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#312783',
    marginTop: 5,
    textAlign: 'center',
    width: Platform.select({ android: 100 }),
  },
  selectedFilterText: {
    color: '#fff', // White text for selected filters
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
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    zIndex: 1, // Ensure it stays below the filter drawer
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
    backgroundColor: themeVariables.secondaryColor,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activityTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: Platform.select({ android: 180 }),
  },
  cardContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    flexShrink: 1,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
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
