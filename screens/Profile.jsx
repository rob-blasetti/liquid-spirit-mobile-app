import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import themeVariables from '../styles/theme';
import CertificationsList from '../components/CertificationsList';
import FastImage from 'react-native-fast-image';
import { TabView } from 'react-native-tab-view';
import { UserContext } from '../contexts/UserContext';
import PostItem from '../components/PostItem';
import ActivityItem from '../components/ActivityItem';
import EventItem from '../components/EventItem';
import { fetchActivities } from '../services/ActivityService';
import { fetchEvents } from '../services/EventService';
import { fetchExploreFeed } from '../services/PostService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RequestItem from '../components/RequestItem';
import ChangeableProfileImage from '../components/ChangeableProfileImage';
import { approveFacilitator, denyFacilitatorRequest, approveParticipation, denyParticipationRequest } from '../services/ActivityService';
import { shareContent } from '../utils/shareContent';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
import { navigateToPostDetail } from '../utils/navigateToPostDetail';

const TAB_BAR_HEIGHT = 80;

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, userDetails, setUserDetails, userPosts, userActivities, userEvents, isLoading, token,
          setUserPosts, setUserActivities, setUserEvents,
          isTokenExpired, refreshSession } = useContext(UserContext);
  // Certification data from context
  const certData = userDetails?.certifications || {};
  const badgeDefs = [
    { flag: certData.isVerified, label: 'Verified User', icon: 'checkmark', color: '#3e8e41' },
    { flag: certData.hasChildProtection, label: 'Child Protection Certified', icon: 'shield-checkmark', color: '#d81b60' },
    { flag: certData.isLocalAssemblyMember, label: 'LSA Member', icon: 'star', color: '#b71c1c' },
  ];
  const certItems = badgeDefs
    .filter(b => b.flag)
    .map(b => ({ label: b.label, icon: b.icon, color: b.color }));
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'activities', title: 'Activities' },
    { key: 'requests', title: 'Requests' },
    { key: 'events', title: 'Events' },
    { key: 'posts', title: 'Posts' },
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
    const status = (activity?.status ?? '').toString().toLowerCase();
    if (status !== 'active') return false;
    const sessions = activity.sessions || [];

    // Check each session for a match
    return sessions.some(session => {
      const isFacilitator = session.facilitators?.some(fac => {
        const fid = fac.details?._id
          || (fac.refId && typeof fac.refId === 'object' ? fac.refId._id : fac.refId);
        return fid?.toString() === userId.toString();
      });

      const isParticipant = session.participants?.some(part => {
        const pid = part.details?._id
          || (part.refId && typeof part.refId === 'object' ? part.refId._id : part.refId);
        return pid?.toString() === userId.toString();
      });

      return isFacilitator || isParticipant;
    });
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
    if (user?.id && Array.isArray(userActivities)) {
      const reqs = [];
      const now = new Date();
      userActivities.forEach(activity => {
        // Extract upcoming sessions
        const upcoming = (activity.sessions || [])
          .map(sess => typeof sess === 'object' ? sess : { date: sess })
          .filter(sess => new Date(sess.date) > now);
        if (upcoming.length === 0) return;
        // Check if user created activity or is facilitator in any upcoming session
        const isCreator = activity.createdBy === user.id
          || (activity.creator && activity.creator._id === user.id);
        const isFacilitator = upcoming.some(sess =>
          Array.isArray(sess.facilitators) && sess.facilitators.some(f => {
            const fid = f.details?._id
              || (f.refId && typeof f.refId === 'object' ? f.refId._id : f.refId);
            return fid === user.id;
          })
        );
        if (!(isCreator || isFacilitator)) return;
        // Collect pending facilitator/participant requests from upcoming sessions
        upcoming.forEach(sess => {
          (sess.pendingFacilitators || []).forEach(p => {
            const raw = typeof p === 'string'
              ? { _id: p }
              : (p.details || p.refId || p);
            const id = raw._id || raw.refId || raw.id;
            const request = { ...raw, _id: id };
            reqs.push({ activity, type: 'facilitator', request });
          });
          (sess.pendingParticipants || []).forEach(p => {
            const raw = typeof p === 'string'
              ? { _id: p }
              : (p.details || p.refId || p);
            const id = raw._id || raw.refId || raw.id;
            const request = { ...raw, _id: id };
            reqs.push({ activity, type: 'participant', request });
          });
        });
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
      // Refresh posts, activities, and events (requires auth token)
      if (!token) return;
      if (isTokenExpired && isTokenExpired(token)) {
        await refreshSession();
        if (!token || (isTokenExpired && isTokenExpired(token))) return;
      }
      const [newPosts, newActivities, newEvents] = await Promise.all([
        fetchExploreFeed(token),
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


  /**
   * Handle item tap: pass imageAspect for posts to detail screen
   */
  const handleItemPress = (type, item, imageAspect) => {
    console.log(`Navigating to ${type} item:`, item);
  if (type === 'posts') {
    // Navigate to Post Detail page, passing preloaded post and image aspect
    navigateToPostDetail({
      navigation,
      post: item,
      postId: item._id,
      imageAspect,
      token,
      isTokenExpired,
    });
    } else if (type === 'activities') {
      // Open the activity detail view
      navigation.navigate('ActivityDetailCard', {
        activityId: item._id,
        activityPreload: item,
      });
    } else if (type === 'events') {
      // Open the event detail view
      navigateToEventDetail({ navigation, event: item, token, isTokenExpired });
    }
  };

const renderList = (data, type) => {
  const contentPaddingBottom = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT;
  if (isLoading) {
    return <ActivityIndicator size="large" color={themeVariables.primaryColor} />;
  }
  if (!data.length) {
    let icon;
    let message;
    switch (type) {
      case 'posts':
        icon = 'document-outline';
        message = 'No posts at the moment';
        break;
      case 'activities':
        icon = 'list-outline';
        message = 'No activities at the moment';
        break;
      case 'events':
        icon = 'calendar-outline';
        message = 'No events at the moment';
        break;
      default:
        icon = null;
        message = `No ${type} at the moment`;
    }
    return (
      <View style={[styles.noDataContainer, { paddingBottom: contentPaddingBottom }]}>
        <Text style={styles.noDataText}>{message}</Text>
        {icon && (
          <Ionicons
            name={icon}
            size={40}
            color="#999"
            style={styles.noDataIcon}
          />
        )}
      </View>
    );
  }

  const ItemComponent =
    type === 'posts' ? PostItem : type === 'activities' ? ActivityItem : EventItem;

  // Sort items chronologically and identify the next upcoming item
  const now = Date.now();
  let listData = [...data];
  if (type === 'activities') {
    listData.sort((a, b) => {
      const nextTime = sess => {
        if (!Array.isArray(sess.sessions)) return Infinity;
        const upcoming = sess.sessions
          .map(s => new Date(s.date || s).getTime())
          .filter(d => d > now)
          .sort((x, y) => x - y);
        return upcoming.length > 0 ? upcoming[0] : Infinity;
      };
      return nextTime(a) - nextTime(b);
    });
  } else if (type === 'events') {
    listData.sort((a, b) => {
      const timeA = new Date(a.startTime || a.date).getTime();
      const timeB = new Date(b.startTime || b.date).getTime();
      return timeA - timeB;
    });
  }
  // Determine the first 'Next Up' item
  let nextUpId = null;
  if (type === 'activities') {
    for (const item of listData) {
      const times = (item.sessions || [])
        .map(s => new Date(s.date || s).getTime())
        .filter(d => d > now)
        .sort((x, y) => x - y);
      if (times.length > 0) {
        nextUpId = item._id;
        break;
      }
    }
  } else if (type === 'events') {
    for (const item of listData) {
      const d = new Date(item.startTime || item.date).getTime();
      if (d > now) {
        nextUpId = item._id;
        break;
      }
    }
  }
  return (
    <FlatList
      data={listData}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      keyExtractor={(item, index) =>
        item._id ? item._id.toString() : index.toString()
      }
      renderItem={({ item }) => (
        <ItemComponent
          item={item}
          // Pass captured imageAspect for posts; undefined for others
          onPress={(imageAspect) => handleItemPress(type, item, imageAspect)}
          nextUp={item._id === nextUpId}
        />
      )}
    />
  );
};


// Render pending requests for Requests tab
const renderRequests = () => {
  const contentPaddingBottom = Math.max(insets.bottom, 16) + TAB_BAR_HEIGHT;
  if (isLoading) {
    return <ActivityIndicator size="large" color={themeVariables.primaryColor} />;
  }
  if (!pendingRequests.length) {
    return (
      <View style={[styles.noDataContainer, { paddingBottom: contentPaddingBottom }]}>
        <Text style={styles.noDataText}>No requests at the moment</Text>
        <Ionicons
          name="person-add-outline"
          size={40}
          color="#999"
          style={styles.noDataIcon}
        />
      </View>
    );
  }
  return (
    <FlatList
      data={pendingRequests}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
      keyExtractor={(req, index) =>
        `${req.activity._id}_${req.request._id}_${req.type}` || index.toString()
      }
      renderItem={({ item }) => (
        <RequestItem
          request={item}
          onAccept={handleApprove}
          onDecline={handleDeny}
        />
      )}
    />
  );
};

const renderScene = ({ route }) => {
  switch (route.key) {
    case 'posts':
      return renderList(posts, 'posts');

    case 'activities':
      return renderList(activities, 'activities');
    case 'events':
      return renderList(events, 'events');
    case 'requests':
      return renderRequests();
    default:
      return null;
  }
};

  const handleShareProfile = async (targetUser) => {
    const userId = targetUser?.id || targetUser?._id;
    if (!userId) return;
    const profileLink = `https://www.liquidspirit.org/users/${userId}`;
    const firstName = targetUser?.firstName || '';
    const lastName = targetUser?.lastName || '';
    const displayName = `${firstName} ${lastName}`.trim() || 'this user';
    const message = `Check out ${displayName}'s profile on Liquid Spirit! ${profileLink}`;
    await shareContent({
      url: profileLink,
      message,
      title: 'Profile Link',
      alertMessage: 'Something went wrong while trying to share the profile.',
      shareOptions: { subject: 'Profile Link' },
    });
  };

  // Custom TabBar to ensure full labels are visible and centered on Android
  const renderTabBarCustom = ({ navigationState, jumpTo, layout }) => {
    const totalWidth = layout?.width ?? Dimensions.get('window').width;
    const tabWidth = totalWidth / navigationState.routes.length;
    return (
      <View style={{ flexDirection: 'row', backgroundColor: themeVariables.darkGreyColor, marginLeft: 10 }}>
        {navigationState.routes.map((route, idx) => {
          const focused = navigationState.index === idx;
          return (
          <TouchableOpacity
              key={route.key}
              style={{
                width: tabWidth,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: focused ? 2 : 0,
                borderBottomColor: themeVariables.primaryColor,
              }}
            onPress={() => jumpTo(route.key)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{
                    color: focused ? themeVariables.primaryColor : themeVariables.blackColor,
                    fontSize: 16,
                    fontWeight: focused ? 'bold' : 'normal',
                    textTransform: 'none',
                    textAlign: 'center',
                    flexWrap: 'wrap',
                  }}>
                  {route.title}
                </Text>
                {route.key === 'requests' && pendingRequests.length > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{pendingRequests.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.headerProfileInfo}>
          <ChangeableProfileImage
            imageStyle={styles.profilePictureSmall}
            avatarSize={60}
            userDetails={userDetails}
            setUserDetails={setUserDetails}
          />
          <View style={styles.profileDetails}>
            <Text style={styles.nameSmall}>{user?.firstName} {user?.lastName}</Text>
            <CertificationsList items={certItems} />
          </View>
        </View>
        <View style={styles.headerActionsContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={20} color={themeVariables.blackColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleShareProfile(user)}>
            <Ionicons name="share-social-outline" size={20} color={themeVariables.blackColor} />
          </TouchableOpacity>
        </View>
      </View>



      <Text style={styles.dashboardHeading}>My Dashboard</Text>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBarCustom}
        style={{ backgroundColor: themeVariables.darkGreyColor, flex: 1 }}
        sceneContainerStyle={{ backgroundColor: themeVariables.greyColor }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeVariables.darkGreyColor },
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
  communityName: { fontSize: 18, fontWeight: 'bold', color: '#fff', width: Platform.select({ android: 95 }), textAlign: 'center' },
  memberCount: { fontSize: 14, color: '#ddd', width: Platform.select({ android: 95 }), textAlign: 'center' },
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
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { textAlign: 'center', padding: 20, fontSize: 16, color: '#999' },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#999',
  },
  noDataIcon: {
    marginTop: 8,
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
    margin: 16,
    borderRadius: themeVariables.borderRadiusPill,
    backgroundColor: themeVariables.whiteColor,
    // Raised shadow effect similar to ListItem & SearchCard
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dashboardHeading: {
    color: themeVariables.blackColor,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 4,
    fontWeight: 'bold',
  },
  headerProfileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: themeVariables.blackColor,
  },
  // Container for the user details next to avatar
  profileDetails: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
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
    color: themeVariables.blackColor,
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
  // Badge for number of requests on Requests tab
  tabBadge: {
    backgroundColor: themeVariables.redColor,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  tabBadgeText: {
    color: themeVariables.whiteColor,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ProfileScreen;
