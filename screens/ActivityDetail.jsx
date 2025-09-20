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
  Alert,
} from 'react-native';
import themeVariables from '../styles/theme';
import FastImage from 'react-native-fast-image';
import { fetchActivityDetails } from '../services/ActivityService';
import { UserContext } from '../contexts/UserContext';
import UserBadge from '../components/UserBadge';
import Ionicons from 'react-native-vector-icons/Ionicons';
const { height: windowHeight } = Dimensions.get('window');

const ActivityDetail = ({ route }) => {
  const { user } = useContext(UserContext);
  const { activityId, activityPreload } = route.params;

  const [activity, setActivity] = useState(activityPreload || null);
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

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    const [hour, minute] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hour, 10), parseInt(minute, 10));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (!activityId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.noActivityIdText}>No activity to display.</Text>
      </View>
    );
  }

  if (loading && activityPreload) {
    return <>
        <ScrollView contentContainerStyle={styles.container}>
          {activityPreload.imageUrl && <FastImage source={{ uri: activityPreload.imageUrl }} style={styles.banner} resizeMode={FastImage.resizeMode.cover}/>}

          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{activityPreload.title}</Text>
            <Text style={styles.type}>{activityPreload.activityType?.name || 'Unknown'}</Text>

            <View style={styles.iconRow}>
              <Ionicons name="calendar-outline" size={22} color="#312783" style={styles.iconSpacing} />
              <Text style={styles.date}>Starts: {new Date(activityPreload.date).toLocaleDateString()}</Text>
            </View>

            <View style={styles.iconRow}>
              <Ionicons name="time-outline" size={22} color="#312783" style={styles.iconSpacing} />
              <Text style={styles.schedule}>{activityPreload.groupDetails?.day || 'N/A'} - {formatTime(activityPreload.groupDetails?.time) || 'N/A'} ({activityPreload.groupDetails?.frequency || 'One-time'})</Text>
            </View>

            <TouchableOpacity onPress={activityPreload.onlineLink ? () => Linking.openURL(activityPreload.onlineLink) : openGoogleMaps}>
              <View style={styles.iconRow}>
                <Ionicons
                  name={activityPreload.onlineLink ? 'videocam-outline' : 'car-outline'}
                  size={22}
                  color="#312783"
                  style={styles.iconSpacing}
                />
                <Text style={styles.location}>
                  {activityPreload.onlineLink
                    ? 'Join Online'
                    : `${activityPreload.address?.streetAddress || 'No Address'}, ${activityPreload.address?.suburb || 'No Suburb'}, ${activityPreload.address?.city || 'No City'}`}
                </Text>
              </View>
            </TouchableOpacity>

          </View>
        </ScrollView>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} style={styles.loadingIndicator} />
      </>;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!activity) {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeVariables.primaryColor} />
        </View>
      );
    }

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.noActivityIdText}>Activity details not available.</Text>
      </View>
    );
  }

  const userId = user?.id;
  const isUserAFacilitator = activity.facilitators?.some(facilitator => facilitator.details._id === userId);
  const isUserAParticipant = activity.participants?.some(participant => participant.details._id === userId);
  const hasFacilitatorSpace = activity.facilitators?.length < activity.facilitatorLimit;
  const hasParticipantSpace = activity.participants?.length < activity.participantLimit;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {activity.imageUrl && <FastImage source={{ uri: activity.imageUrl }} style={styles.banner} resizeMode={FastImage.resizeMode.cover}/>}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.type}>{activity.activityType?.name || 'Unknown'}</Text>

        <View style={styles.iconRow}>
          <Ionicons name="calendar-outline" size={22} color="#312783" style={styles.iconSpacing} />
          <Text style={styles.date}>Starts: {new Date(activity.date).toLocaleDateString()}</Text>
        </View>

        <View style={styles.iconRow}>
          <Ionicons name="time-outline" size={22} color="#312783" style={styles.iconSpacing} />
          <Text style={styles.schedule}>{activity.groupDetails?.day || 'N/A'} - {formatTime(activity.groupDetails?.time) || 'N/A'} ({activity.groupDetails?.frequency || 'One-time'})</Text>
        </View>

        <TouchableOpacity onPress={activity.onlineLink ? () => Linking.openURL(activity.onlineLink) : openGoogleMaps}>
          <View style={styles.iconRow}>
            <Ionicons
              name={activity.onlineLink ? 'videocam-outline' : 'car-outline'}
              size={22}
              color="#312783"
              style={styles.iconSpacing}
            />
            <Text style={styles.location}>
              {activity.onlineLink
                ? 'Join Online'
                : `${activity.address?.streetAddress || 'No Address'}, ${activity.address?.suburb || 'No Suburb'}, ${activity.address?.city || 'No City'}`}
            </Text>
          </View>
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
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => Alert.alert('Request to Join as Facilitator Sent!')}
          >
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
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => Alert.alert('Request to Join as Participant Sent!')}
          >
            <Text style={styles.joinButtonText}>Request Join</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
    minHeight: windowHeight,
  },
  loadingIndicator: {
    alignSelf: 'center',
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
  noActivityIdText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
  banner: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
    marginRight: 10,
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
    marginBottom: 6,
  },
  iconSpacing: {
    marginRight: 6,
  },
  date: {
    fontSize: 18,
    color: themeVariables.blackColor,
  },
  schedule: {
    fontSize: 16,
    color: themeVariables.blackColor,
  },
  location: {
    fontSize: 16,
    color: themeVariables.primaryColor,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
    padding: 20,
  },
});

export default ActivityDetail;
