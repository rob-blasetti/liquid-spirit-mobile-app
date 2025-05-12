import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Share,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { TabView } from 'react-native-tab-view';
import { UserContext } from '../contexts/UserContext';
import PostGallery from '../components/PostGallery';
import { fetchActivities } from '../services/ActivityService';
import { fetchEvents } from '../services/EventService';
import { fetchExploreFeed } from '../services/PostService';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCogs, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import ChangeableProfileImage from '../components/ChangeableProfileImage';
import { approveFacilitator, denyFacilitatorRequest, approveParticipation, denyParticipationRequest } from '../services/ActivityService';

const ProfileScreen = ({ navigation }) => {
  const { user, userPosts, userActivities, userEvents, isLoading, token, setUserPosts, setUserActivities, setUserEvents } = useContext(UserContext);

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'posts', title: 'My Posts' },
    { key: 'activities', title: 'My Activities' },
    { key: 'events', title: 'My Events' },
  ]);

  const [posts, setPosts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);

  const filterUserPosts = (allPosts, userId) => {
    return (allPosts || []).filter(post => post.author._id === userId);
  };

  // Filter activities where the user is a facilitator or participant
  const filterUserActivities = (allActivities, userId) => {
    return (allActivities || []).filter(activity => {
      // Check facilitators array; fac.refId may be string or object, fac.details may hold user
      const isFacilitator = activity.facilitators?.some(fac => {
        const fid = fac.details?._id
          || (fac.refId && typeof fac.refId === 'object' ? fac.refId._id : fac.refId);
        return fid === userId;
      });
      // Check participants array; part.refId may be string or object, part.details may hold user
      const isParticipant = activity.participants?.some(part => {
        const pid = part.details?._id
          || (part.refId && typeof part.refId === 'object' ? part.refId._id : part.refId);
        return pid === userId;
      });
      return isFacilitator || isParticipant;
    });
  };

  // Filter events where the user is an attendee
  const filterUserEvents = (allEvents, userId) => {
    return (allEvents || []).filter(event => {
      return event.attendees?.some(att => {
        const aid = att.details?._id
          || (att.refId && typeof att.refId === 'object' ? att.refId._id : att.refId);
        return aid === userId;
      });
    });
  };

  useEffect(() => {
    if (user?.id) {
      setPosts(filterUserPosts(userPosts, user.id));
      setActivities(filterUserActivities(userActivities, user.id));
      setEvents(filterUserEvents(userEvents, user.id));
    } else {
      setPosts([]);
      setActivities([]);
      setEvents([]);
    }
  }, [userPosts, userActivities, userEvents, user?.id]);
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  // Pending requests for activities created by or facilitated by user
  const [pendingRequests, setPendingRequests] = useState([]);
  useEffect(() => {
    if (user?.id && userActivities) {
      const reqs = [];
      console.log('UserActivities:', userActivities);
      userActivities.forEach(activity => {
        const isCreator = activity.createdBy === user.id
          || (activity.creator && activity.creator._id === user.id);
        // Detect if current user is a facilitator (refId may be string or embedded object)
        const isFacilitator = activity.facilitators?.some(f => {
          // f.refId can be an ID string or an object with _id
          const fid = f.details?._id
            || (f.refId && typeof f.refId === 'object' ? f.refId._id : f.refId);
          return fid === user.id;
        });
        if (isCreator || isFacilitator) {
          (activity.pendingFacilitators || []).forEach(p => {
            // p may be a string ID or an object; user info may live in details or refId
            const raw = typeof p === 'string'
              ? { _id: p }
              : (p.details || p.refId || p);
            const id = raw._id || raw.refId || raw.id;
            const request = { ...raw, _id: id };
            reqs.push({ activity, type: 'facilitator', request });
          });
          (activity.pendingParticipants || []).forEach(p => {
            // p may be a string ID or an object; user info may live in details or refId
            const raw = typeof p === 'string'
              ? { _id: p }
              : (p.details || p.refId || p);
            const id = raw._id || raw.refId || raw.id;
            const request = { ...raw, _id: id };
            reqs.push({ activity, type: 'participant', request });
          });
        }
      });
      setPendingRequests(reqs);
    } else {
      setPendingRequests([]);
    }
  }, [userActivities, user?.id]);
  // Refresh all data (posts, activities, events)
  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const [newPosts, newActivities, newEvents] = await Promise.all([
        fetchExploreFeed(),
        fetchActivities(token),
        fetchEvents(token),
      ]);
      setUserPosts(newPosts);
      setUserActivities(newActivities);
      setUserEvents(newEvents);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  const handleApprove = async (req) => {
    try {
      if (req.type === 'facilitator') {
        await approveFacilitator(req.activity._id, req.request._id, token);
      } else {
        await approveParticipation(req.activity._id, req.request._id, token);
      }
      setPendingRequests(prev => prev.filter(r => !(r.activity._id === req.activity._id && r.type === req.type && r.request._id === req.request._id)));
    } catch (err) {
      alert(err.message || 'Failed to approve request');
    }
  };
  const handleDeny = async (req) => {
    try {
      if (req.type === 'facilitator') {
        await denyFacilitatorRequest(req.activity._id, req.request._id, token);
      } else {
        await denyParticipationRequest(req.activity._id, req.request._id, token);
      }
      setPendingRequests(prev => prev.filter(r => !(r.activity._id === req.activity._id && r.type === req.type && r.request._id === req.request._id)));
    } catch (err) {
      alert(err.message || 'Failed to decline request');
    }
  };


const handleItemPress = (type, item) => {
  if (type === 'posts') {
    navigation.navigate('Feed', { post: item });
  } else if (type === 'activities') {
    navigation.navigate('ActivityDetail', { activityId: item._id });
  } else if (type === 'events') {
    navigation.navigate('EventDetail', { event: item });
  }
};

const renderList = (data, type) => {
  if (isLoading) {
    return <ActivityIndicator size="large" color={themeVariables.primaryColor} />;
  }
  if (!data.length) {
    return <Text style={styles.noDataText}>No {type} available.</Text>;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item, index) =>
        item._id ? item._id.toString() : index.toString()
      }
      renderItem={({ item }) => {
        let rawDate;
        if (type === 'events') rawDate = item.date || item.startTime;
        else if (type === 'activities') rawDate = item.date || item.createdAt;
        else if (type === 'posts') rawDate = item.createdAt || item.updatedAt;

        let formattedDate = rawDate
          ? new Date(rawDate).toLocaleDateString()
          : 'N/A';

        return (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => handleItemPress(type, item)}
          >
            {type === 'posts' && item.content && (
              <Text style={styles.listContent}>
                {item.content.length > 100
                  ? `${item.content.slice(0, 100)}...`
                  : item.content}
              </Text>
            )}

            {type === 'activities' && item.description && (
              <>
                <Text style={styles.listTitle}>{item.title || item.name}</Text>
                <Text style={styles.listContent}>
                  {item.description.length > 100
                    ? `${item.description.slice(0, 100)}...`
                    : item.description}
                </Text>
              </>
            )}

            {type === 'events' && (
              <>
                <Text style={styles.listTitle}>{item.title || item.name}</Text>
                {item.venue && (
                  <Text style={styles.listContent}>Venue: {item.venue}</Text>
                )}
                {item.description && (
                  <Text style={styles.listContent}>
                    {item.description.length > 100
                      ? `${item.description.slice(0, 100)}...`
                      : item.description}
                  </Text>
                )}
              </>
            )}

            <Text style={styles.listDate}>{formattedDate}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
};


const renderScene = ({ route }) => {
  switch (route.key) {
    case 'posts':
      return <PostGallery posts={posts} refreshing={refreshing} onRefresh={onRefresh} />;
    case 'activities':
      return <PostGallery posts={activities} refreshing={refreshing} onRefresh={onRefresh} />;
    case 'events':
      return <PostGallery posts={events} refreshing={refreshing} onRefresh={onRefresh} />;
    default:
      return null;
  }
};

  const handleShareProfile = async (user) => {
    try {
      const profileLink = `https://liquidspirit.org/user/${user?.id}`;
      const message = `Check out ${user?.firstName} ${user?.lastName}'s profile!`;

      await Share.share({
        message,
        subject: 'Profile Link',
        url: profileLink,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  };

  // Custom TabBar to ensure full labels are visible and centered on Android
  const renderTabBarCustom = ({ navigationState, jumpTo, layout }) => {
    const totalWidth = layout?.width ?? Dimensions.get('window').width;
    const tabWidth = totalWidth / navigationState.routes.length;
    return (
      <View style={{ flexDirection: 'row', backgroundColor: '#312783' }}>
        {navigationState.routes.map((route, idx) => {
          const focused = navigationState.index === idx;
          return (
            <TouchableOpacity
              key={route.key}
              style={{
                width: tabWidth,
                paddingVertical: 12,
                alignItems: 'left',
                justifyContent: 'center',
                borderBottomWidth: focused ? 2 : 0,
                borderBottomColor: '#fff',
              }}
              onPress={() => jumpTo(route.key)}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 16,
                  textTransform: 'none',
                  textAlign: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  console.log('User1:', user);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerProfileInfo}>
          <ChangeableProfileImage imageStyle={styles.profilePictureSmall} avatarSize={60} />
          <Text style={styles.nameSmall}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <View style={styles.headerActionsContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
            <FontAwesomeIcon icon={faCogs} size={20} color="#312783" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleShareProfile(user)}>
            <FontAwesomeIcon icon={faShareAlt} size={20} color="#312783" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Requests Section */}
      <View style={styles.pendingContainer}>
        <Text style={styles.pendingHeader}>Pending Requests</Text>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((req, idx) => (
            <View key={idx} style={styles.pendingItem}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ActivityDetailCard', {
                  activityId: req.activity._id,
                  activityPreload: req.activity,
                })}
              >
                <Text style={styles.pendingActivityTitle}>{req.activity.title}</Text>
              </TouchableOpacity>
              <View style={styles.pendingRequestRow}>
                <FastImage
                  source={{ uri: req.request?.profilePicture }}
                  style={styles.pendingAvatar}
                />
                <Text style={styles.pendingRequestText}>
                  {(req.request?.firstName || req.request?.name || req.request?.username)
                    ? (req.request?.firstName || req.request?.name || req.request?.username) +
                      (req.request?.lastName ? ` ${req.request.lastName}` : '')
                    : req.request?._id}{` requested to join as ${req.type}`}
                </Text>
              </View>
              <View style={styles.pendingButtons}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleApprove(req)}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleDeny(req)}
                >
                  <Text style={[styles.buttonText, styles.declineButtonText]}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No pending requests.</Text>
        )}
      </View>


      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBarCustom}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  bannerContainer: { width: '100%', height: 200 },
  banner: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bannerImage: { resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  bannerContent: {
    // Position the content absolutely on top of the banner
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bannerLeft: { alignItems: 'center' },
  profilePicture: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#fff', marginBottom: 8 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center', width: Platform.select({ android: 105 }) },
  bahaiID: { fontSize: 14, color: '#fff', textAlign: 'center' },
  bannerRight: { alignItems: 'flex-end' },
  communityName: { fontSize: 18, fontWeight: 'bold', color: '#fff', width: Platform.select({ android: 95 }), textAlign: 'center', },
  memberCount: { fontSize: 14, color: '#ddd', width: Platform.select({ android: 95 }), textAlign: 'center', },

  // Profile Actions Section
  profileActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 2,
    flexDirection: 'row',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#312783',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#312783',
    width: Platform.select({ android: 95 }),
    textAlign: 'center',
  },
  placeholderText: { textAlign: 'center', padding: 20, fontSize: 16, color: '#999' },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#999',
  },
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#312783',
  },
  listContent: {
    fontSize: 16,
    color: '#312783',
    marginTop: 8,
  },
  listDate: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#312783',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  profilePictureSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  nameSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#312783',
  },
  pendingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  pendingHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#312783',
  },
  pendingItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  pendingActivityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#312783',
  },
  pendingRequestText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  pendingButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  acceptButton: {
    backgroundColor: '#312783',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  declineButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#312783',
  },
  declineButtonText: {
    color: '#312783',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileScreen;
