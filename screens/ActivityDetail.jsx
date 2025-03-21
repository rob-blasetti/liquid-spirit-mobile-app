import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import themeVariables from '../styles/theme';
import FastImage from 'react-native-fast-image';
import { fetchActivityDetails } from '../services/ActivityService';
import { UserContext } from '../contexts/UserContext';
import UserBadge from '../components/UserBadge';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faClock, faCarSide } from '@fortawesome/free-solid-svg-icons';
const { height: windowHeight } = Dimensions.get('window');

const ActivityDetail = ({ route }) => {
  const { user } = useContext(UserContext);
  const { activityId, activityPreload } = route.params;

  const [activity, setActivity] = useState({ activityPreload });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = user?.token || '';
        const activityData = await fetchActivityDetails(activityId, token);
        setActivity(activityData);
      } catch (err) {
        setError(err.message || 'Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [activityId]);

  const openGoogleMaps = () => {
    if (!activity.address) return;
    const address = `${activity.address.streetAddress}, ${activity.address.suburb}, ${activity.address.city}`;
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    Linking.openURL(mapsUrl);
  };

  if (loading) {
    return <>
      <View style={styles.loadingContainer}>
        <ScrollView contentContainerStyle={styles.container}>
          {activityPreload.imageUrl && <FastImage source={{ uri: activityPreload.imageUrl }} style={styles.banner} resizeMode={FastImage.resizeMode.cover}/>}

          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{activityPreload.title}</Text>
            <Text style={styles.type}>{activityPreload.activityType?.name || 'Unknown'}</Text>
            <Text style={styles.date}><FontAwesomeIcon icon={faCalendar} size={16} color="#312783" /> Starts: {new Date(activityPreload.date).toLocaleDateString()}</Text>
            <Text style={styles.schedule}>
            <FontAwesomeIcon icon={faClock} size={16} color="#312783" /> {activityPreload.groupDetails?.day || 'N/A'} - {activityPreload.groupDetails?.time || 'N/A'} (
              {activityPreload.groupDetails?.frequency || 'One-time'})
            </Text>

            <TouchableOpacity onPress={openGoogleMaps}>
              <Text style={styles.location}><FontAwesomeIcon icon={faCarSide} size={16} color="#312783" /> {activityPreload.address?.streetAddress}, {activityPreload.address?.suburb}, {activityPreload.address?.city}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} style={styles.loadingIndicator} />
      </View>
    </>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!activity) {
    return <Text style={styles.errorText}>Activity details not available.</Text>;
  }

  const userId = user?.id;
  const isUserAFacilitator = activity.facilitators?.some(facilitator => facilitator.details._id === userId);
  const isUserAParticipant = activity.participants?.some(participant => participant.details._id === userId);
  const hasFacilitatorSpace = activity.facilitators?.length < activity.facilitatorLimit;
  const hasParticipantSpace = activity.participants?.length < activity.participantLimit;
  console.log('activity: ', activityPreload);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {activity.imageUrl && <FastImage source={{ uri: activity.imageUrl }} style={styles.banner} resizeMode={FastImage.resizeMode.cover}/>}

      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.type}>{activity.activityType?.name || 'Unknown'}</Text>
        <Text style={styles.date}><FontAwesomeIcon icon={faCalendar} size={16} color="#312783" /> Starts: {new Date(activity.date).toLocaleDateString()}</Text>
        <Text style={styles.schedule}>
        <FontAwesomeIcon icon={faClock} size={16} color="#312783" /> {activity.groupDetails?.day || 'N/A'} - {activity.groupDetails?.time || 'N/A'} (
          {activity.groupDetails?.frequency || 'One-time'})
        </Text>

        {/* Clickable Location */}
        <TouchableOpacity onPress={openGoogleMaps}>
          <Text style={styles.location}><FontAwesomeIcon icon={faCarSide} size={16} color="#312783" /> {activity.address?.streetAddress}, {activity.address?.suburb}, {activity.address?.city}</Text>
        </TouchableOpacity>

        {/* Facilitators List */}
        <Text style={styles.sectionHeader}>Facilitators:</Text>
        <View style={styles.badgesContainer}>
          {activity.facilitators?.length > 0 ? (
            activity.facilitators.map((facilitator, index) => (
              <UserBadge key={index} user={facilitator.details} userCertifications={facilitator.certifications} />
            ))
          ) : (
            <Text style={styles.noBadgesText}>No facilitators assigned.</Text>
          )}
        </View>

        {/* Join as Facilitator */}
        {hasFacilitatorSpace && !isUserAFacilitator && !isUserAParticipant && (
          <TouchableOpacity style={styles.joinButton} onPress={() => alert('Request to Join as Facilitator Sent!')}>
            <Text style={styles.joinButtonText}>Request Join</Text>
          </TouchableOpacity>
        )}

        {/* Participants List */}
        <Text style={styles.sectionHeader}>Participants:</Text>
        <View style={styles.badgesContainer}>
          {activity.participants?.length > 0 ? (
            activity.participants.map((participant, index) => (
              <UserBadge key={index} user={participant.details} userCertifications={participant.certifications} />
            ))
          ) : (
            <Text style={styles.noBadgesText}>No participants yet.</Text>
          )}
        </View>

        {/* Join as Participant */}
        {hasParticipantSpace && !isUserAParticipant && !isUserAFacilitator && (
          <TouchableOpacity style={styles.joinButton} onPress={() => alert('Request to Join as Participant Sent!')}>
            <Text style={styles.joinButtonText}>Request Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'relative',
    backgroundColor: themeVariables.whiteColor,
    minHeight: windowHeight,
  },
  loadingIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
  },
  container: {
    backgroundColor: themeVariables.whiteColor,
    flexGrow: 1,
    paddingBottom: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
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
    fontSize: 18,
    color: themeVariables.blackColor,
    marginBottom: 6,
  },
  schedule: {
    fontSize: 16,
    color: themeVariables.blackColor,
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    color: themeVariables.primaryColor,
    marginBottom: 20,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: themeVariables.blackColor,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  noBadgesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  joinButton: {
    backgroundColor: themeVariables.primaryColor,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  joinButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActivityDetail;
