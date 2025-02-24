import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { UserContext } from '../contexts/UserContext';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faMapLocation,
  faCalendar,
  faSort,
  faFilter,
  faHeart,
  faBook,
  faChild,
  faUsers,
  faFire,
  faStar,
} from '@fortawesome/free-solid-svg-icons';

const Activities = ({ navigation }) => {
  const { userActivities } = useContext(UserContext);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedType, setSelectedType] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

  const activityTypes = [
    { name: "Children's Class", icon: faChild },
    { name: 'Junior Youth Group', icon: faUsers },
    { name: 'Study Circle', icon: faBook },
    { name: 'Devotional', icon: faHeart },
    { name: 'Independent Initiative', icon: faStar },
    { name: 'Fireside', icon: faFire },
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
    let filtered = [...activities];

    if (selectedType !== 'All') {
      filtered = filtered.filter((activity) => activity.activityType?.name === selectedType);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
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
    toggleDrawer();
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const renderActivity = ({ item }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: item._id })}
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
          <FontAwesomeIcon icon={faCalendar} size={16} color="#666" />
          <Text style={styles.activityDetails}>
            {new Date(item.date).toDateString()}
          </Text>
        </View>

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
      <View style={styles.controlContainer}>
        <TouchableOpacity style={styles.buttonBase} onPress={toggleDrawer}>
          <FontAwesomeIcon icon={faFilter} size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonBase} onPress={toggleSortOrder}>
          <FontAwesomeIcon icon={faSort} size={16} color="#fff" />
          <Text style={styles.buttonText}>
            {sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.drawerContainer,
          {
            height: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 180] }),
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
                <FontAwesomeIcon icon={icon} size={24} color={selectedType === name ? '#fff' : '#312783'} />
                <Text style={[styles.filterText, selectedType === name && styles.selectedFilterText]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color="#312783" />
      ) : filteredActivities.length > 0 ? (
        <FlatList style={styles.flatListContainer} data={filteredActivities} keyExtractor={(item) => item._id.toString()} renderItem={renderActivity} />
      ) : (
        !drawerOpen && <Text style={styles.noActivities}>No matching activities.</Text>
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
  controlContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    zIndex: 2, // Ensure it stays above other elements
  },
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312783',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
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
    marginTop: 10,
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
    marginTop: 30,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#312783',
    marginTop: 5,
    textAlign: 'center',
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
    backgroundColor: '#58DB33',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    opacity: 0.9,
  },
  activityTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C5C0E',
  },
  cardContent: {
    padding: 16,
  },
  activityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#312783',
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
  }
});

export default Activities;
