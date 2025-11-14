import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
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
import resolveImageSource from '../utils/imageSource';
import { fetchActivityDetails } from '../services/ActivityService';
import { startActivityConversation, getActivityChatParticipantProfiles } from '../services/ChatService';
import { shareContent } from '../utils/shareContent';
import { UserContext } from '../contexts/UserContext';
import UserBadge from '../components/UserBadge';
import Ionicons from 'react-native-vector-icons/Ionicons';
const { height: windowHeight } = Dimensions.get('window');

const ActivityDetail = ({ route, navigation }) => {
  const { user, token } = useContext(UserContext);
  const { activityId, activityPreload } = route.params;

  const [activity, setActivity] = useState(activityPreload || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const storedUserToken = user?.token;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const authToken = token || storedUserToken || '';
        const activityData = await fetchActivityDetails(activityId, authToken);
        setActivity(activityData);
      } catch (err) {
        setError(err.message || 'Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [activityId, token, storedUserToken]);

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
          {activityPreload.imageUrl && (
            <FastImage
              source={resolveImageSource(activityPreload.imageUrl, { priority: 'high' })}
              style={styles.banner}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}

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

  const userId = user?._id || user?.id;
  const isUserAFacilitator = activity.facilitators?.some(facilitator => facilitator.details._id === userId);
  const isUserAParticipant = activity.participants?.some(participant => participant.details._id === userId);
  const hasFacilitatorSpace = activity.facilitators?.length < activity.facilitatorLimit;
  const hasParticipantSpace = activity.participants?.length < activity.participantLimit;
  const canMessageGroup = isUserAFacilitator || isUserAParticipant;
  const chatParticipantProfiles = useMemo(
    () => getActivityChatParticipantProfiles(activity || activityPreload || {}),
    [activity, activityPreload],
  );

  const handleShare = useCallback(() => {
    const sourceActivity = activity || activityPreload;
    const id = sourceActivity?._id || sourceActivity?.id || activityId;
    if (!id) return;
    const url = `https://www.liquidspirit.org/activities/${id}`;
    const title = sourceActivity?.title || 'Liquid Spirit Activity';
    const message = `Check out this activity on Liquid Spirit 👇\n${url}`;
    shareContent({
      url,
      message,
      title,
      alertMessage: 'Something went wrong while trying to share the activity.',
    });
  }, [activity, activityPreload, activityId]);

  const handleStartConversation = useCallback(async () => {
    if (!activity) return;
    const authToken = token || storedUserToken;
    if (!authToken) {
      Alert.alert('Login Required', 'You must be logged in to start a conversation.');
      return;
    }

    setStartingChat(true);
    try {
      const result = await startActivityConversation(activity, {
        token: authToken,
        currentUserId: userId,
        activityId,
      });

      if (!result?.chatId) {
        throw new Error('Unable to open the chat conversation for this activity.');
      }

      navigation.navigate('ChatDetail', {
        chatId: result.chatId,
        chatTitle: result.chatTitle || `${activity.title || 'Activity'} Chat`,
        chatParticipants: result.chatParticipants?.length
          ? result.chatParticipants
          : chatParticipantProfiles,
        chatImage: result.chatImage || activity.imageUrl || activity.imageURL || activity.bannerUrl,
      });
    } catch (err) {
      console.error('Failed to start activity chat:', err);
      const message = err?.message || 'Unable to start a chat for this activity right now.';
      Alert.alert('Chat Unavailable', message);
    } finally {
      setStartingChat(false);
    }
  }, [activity, token, storedUserToken, userId, activityId, navigation, chatParticipantProfiles]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.headerActionButton,
              startingChat && styles.headerActionButtonDisabled,
            ]}
            onPress={handleStartConversation}
            disabled={startingChat}
          >
            {startingChat ? (
              <ActivityIndicator size="small" color={themeVariables.primaryColor} />
            ) : (
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={themeVariables.blackColor} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerActionButton,
              styles.headerActionButtonSpacer,
            ]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color={themeVariables.blackColor} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleShare, handleStartConversation, startingChat]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {activity.imageUrl && (
        <FastImage
          source={resolveImageSource(activity.imageUrl, { priority: 'high' })}
          style={styles.banner}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}
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

        {canMessageGroup && (
          <TouchableOpacity
            style={[styles.chatButton, startingChat && styles.chatButtonDisabled]}
            onPress={handleStartConversation}
            disabled={startingChat}
          >
            {startingChat ? (
              <ActivityIndicator size="small" color={themeVariables.whiteColor} />
            ) : (
              <Text style={styles.chatButtonText}>Message Group</Text>
            )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerActionButtonSpacer: {
    marginLeft: 8,
  },
  headerActionButtonDisabled: {
    opacity: 0.7,
  },
  chatButton: {
    backgroundColor: themeVariables.secondaryColor,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  chatButtonDisabled: {
    opacity: 0.7,
  },
  chatButtonText: {
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
