import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import themeVariables from '../styles/theme';
import { fetchActivityDetails } from '../services/ActivityService';
import { UserContext } from '../contexts/UserContext';
import UserBadge from '../components/UserBadge';

const ActivityDetail = ({ route, navigation }) => {
  const { user } = useContext(UserContext);
  const { activityId } = route.params;

  const [activity, setActivity] = useState(null);
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
    return <ActivityIndicator size="large" color={themeVariables.primaryColor} style={styles.loading} />;
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!activity) {
    return <Text style={styles.errorText}>Activity details not available.</Text>;
  }

  const userId = user?._id;
  const isUserAFacilitator = activity.facilitators?.some(facilitator => facilitator._id === userId);
  const isUserAParticipant = activity.participants?.some(participant => participant._id === userId);
  const hasFacilitatorSpace = activity.facilitators.length < activity.facilitatorLimit;
  const hasParticipantSpace = activity.participants.length < activity.participantLimit;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Activity Banner */}
      {activity.imageUrl && <Image source={{ uri: activity.imageUrl }} style={styles.banner} />}

      {/* Activity Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.type}>{activity.activityType?.name || 'Unknown'}</Text>
        <Text style={styles.date}>📅 Starts: {new Date(activity.startDate).toLocaleDateString()}</Text>
        <Text style={styles.schedule}>
          ⏰ {activity.groupDetails?.day || 'N/A'} - {activity.groupDetails?.time || 'N/A'} (
          {activity.groupDetails?.frequency || 'One-time'})
        </Text>

        {/* Clickable Location */}
        <TouchableOpacity onPress={openGoogleMaps}>
          <Text style={styles.location}>📍 {activity.address?.streetAddress}, {activity.address?.suburb}, {activity.address?.city}</Text>
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
            <Text style={styles.joinButtonText}>Request to Join as Facilitator</Text>
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
            <Text style={styles.joinButtonText}>Request to Join as Participant</Text>
          </TouchableOpacity>
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
  loading: {
    marginTop: 50,
    alignSelf: 'center',
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
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  joinButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActivityDetail;
