import React, { useContext, useState, useEffect, useMemo } from 'react';
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
import LiquidGlassIconButton from '../components/LiquidGlassIconButton';
import SectionStateCard from '../components/SectionStateCard';
import { approveFacilitator, denyFacilitatorRequest, approveParticipation, denyParticipationRequest } from '../services/ActivityService';
import { shareContent } from '../utils/shareContent';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
import { navigateToPostDetail } from '../utils/navigateToPostDetail';
import { navigateToActivityDetail } from '../utils/navigateToActivityDetail';

const normalizeRuhiBadges = (value) => {
  if (!Array.isArray(value)) return [];

  const parsed = value
    .map((badge) => (typeof badge === 'string' ? badge.trim() : ''))
    .filter((badge) => badge.length > 0);

  return Array.from(new Set(parsed));
};

const TAB_BAR_HEIGHT = 80;

const PROFILE_STAT_CARDS = [
  { key: 'activities', label: 'Current Activities', icon: 'layers-outline' },
  { key: 'events', label: 'Upcoming Events', icon: 'calendar-outline' },
  { key: 'posts', label: 'Total Posts', icon: 'document-text-outline' },
];

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, userDetails, setUserDetails, userPosts, userActivities, userEvents, isLoading, token,
          setUserPosts, setUserActivities, setUserEvents,
          isTokenExpired, refreshSession } = useContext(UserContext);
  // Certification data from context
  const certData = userDetails?.certifications || {};
  const ruhiBadges = useMemo(
    () => normalizeRuhiBadges(certData.ruhiBadges),
    [certData.ruhiBadges],
  );
  const badgeDefs = [
    { flag: certData.isVerified, label: 'Verified User', icon: 'checkmark', color: '#3e8e41' },
    { flag: certData.hasChildProtection, label: 'Child Protection Certified', icon: 'shield-checkmark', color: '#d81b60' },
    { flag: certData.isLocalAssemblyMember, label: 'LSA Member', icon: 'star', color: '#b71c1c' },
  ];
  const certItems = [
    ...badgeDefs
      .filter((b) => b.flag)
      .map((b) => ({ label: b.label, icon: b.icon, color: b.color })),
    ...ruhiBadges.map((badge) => ({
      key: `ruhi:${badge}`,
      label: `Ruhi ${badge}`,
      icon: 'book-outline',
      color: '#4A148C',
    })),
  ];
  const recentBadges = certItems.slice(0, 4);
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
      // Open the activity detail view (prefetch latest detail payload)
      navigateToActivityDetail({ navigation, activity: item, token, isTokenExpired });
    } else if (type === 'events') {
      // Open the event detail view
      navigateToEventDetail({ navigation, event: item, token, isTokenExpired });
    }
  };

const renderList = (data, type) => {
  const contentPaddingBottom = Math.max(insets.bottom, 0);
  if (isLoading) {
    return (
      <View style={[styles.stateWrap, { paddingBottom: contentPaddingBottom }]}> 
        <SectionStateCard
          loading
          title="Loading your dashboard"
          message="Pulling together your posts, activities, and events."
        />
      </View>
    );
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
      <View style={[styles.stateWrap, { paddingBottom: contentPaddingBottom }]}>
        <SectionStateCard
          icon={icon || 'sparkles-outline'}
          title={message}
          message="New activity will show up here once you join in or create something."
        />
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
      contentContainerStyle={{ paddingBottom: contentPaddingBottom, backgroundColor: 'transparent' }}
      style={{ backgroundColor: 'transparent' }}
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
  const contentPaddingBottom = Math.max(insets.bottom, 0);
  if (isLoading) {
    return (
      <View style={[styles.stateWrap, { paddingBottom: contentPaddingBottom }]}> 
        <SectionStateCard
          loading
          title="Loading requests"
          message="Checking if anyone needs your approval."
        />
      </View>
    );
  }
  if (!pendingRequests.length) {
    return (
      <View style={[styles.stateWrap, { paddingBottom: contentPaddingBottom }]}> 
        <SectionStateCard
          icon="person-add-outline"
          title="No requests right now"
          message="Approvals and join requests will appear here when they come in."
        />
      </View>
    );
  }
  return (
    <FlatList
      data={pendingRequests}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom, backgroundColor: 'transparent' }}
      style={{ backgroundColor: 'transparent' }}
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
    const horizontalPadding = 16;
    const availableWidth = Math.max(totalWidth - horizontalPadding * 2, 0);
    const tabWidth = availableWidth / navigationState.routes.length;
    return (
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: 'transparent',
          paddingHorizontal: horizontalPadding,
        }}
      >
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

  const stats = {
    activities: activities.length,
    events: events.length,
    posts: posts.length,
  };

  const joinedLabel = userDetails?.createdAt
    ? `Member since ${new Date(userDetails.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })}`
    : '';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={[styles.pageHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <LiquidGlassIconButton
            iconName="share-social-outline"
            iconColor={themeVariables.blackColor}
            onPress={() => handleShareProfile(user)}
            hasShadow={false}
            glassStyle={styles.topIconGlass}
          />
          <LiquidGlassIconButton
            iconName="settings-outline"
            iconColor={themeVariables.blackColor}
            onPress={() => navigation.navigate('Settings')}
            hasShadow={false}
            glassStyle={styles.topIconGlass}
            style={styles.headerIconSpacer}
          />
        </View>
      </View>
      {/* Header Section */}
      <View style={styles.headerContainer}>
        <View style={styles.profileHeroCard}>
          <View style={styles.profileHeroColumns}>
            <View style={styles.profileIdentityColumn}>
              <ChangeableProfileImage
                imageStyle={styles.profilePictureLarge}
                avatarSize={92}
                userDetails={userDetails}
                setUserDetails={setUserDetails}
                showEditIndicator
                containerStyle={styles.profileAvatarWrap}
              />
              <Text style={styles.nameCentered} numberOfLines={2}>
                {user?.firstName} {user?.lastName}
              </Text>
              {joinedLabel ? (
                <Text style={styles.memberSinceCentered} numberOfLines={2}>
                  {joinedLabel}
                </Text>
              ) : null}
            </View>

            <View style={styles.profileStatsColumn}>
              {PROFILE_STAT_CARDS.map((card, index) => (
                <View
                  key={card.key}
                  style={[
                    styles.statRowCard,
                    index < PROFILE_STAT_CARDS.length - 1 && styles.statRowDivider,
                  ]}>
                  <Text style={styles.statRowLabel} numberOfLines={1}>
                    {card.label}
                  </Text>
                  <Text style={styles.statRowValue} numberOfLines={1}>
                    {stats[card.key]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
      <View style={styles.badgesHeadingRow}>
        <View>
          <Text style={styles.badgesLabel}>Recent Badges</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Badges')} style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={14} color={themeVariables.primaryColor} />
        </TouchableOpacity>
      </View>
      {recentBadges.length > 0 ? (
        <View style={styles.badgesPreviewRow}>
          {recentBadges.map((badge, index) => (
            <View key={`${badge.label}-${index}`} style={styles.badgePreviewItem}>
              <View style={styles.badgePreviewCard}>
                <View style={[styles.badgePreviewIcon, { backgroundColor: badge.color }]}>
                  <Ionicons name={badge.icon} size={18} color={themeVariables.whiteColor} />
                </View>
                <Text style={styles.badgePreviewText} numberOfLines={2} ellipsizeMode="tail">
                  {badge.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.badgesContainer}>
          <View style={styles.badgesEmptyState}>
            <View style={styles.badgesEmptyIcon}>
              <Ionicons name="ribbon-outline" size={18} color={themeVariables.primaryColor} />
            </View>
            <Text style={styles.badgesEmptyText}>Earn badges and they will show up here.</Text>
          </View>
        </View>
      )}

      <View style={styles.badgesHeadingRow}>
        <View>
          <Text style={styles.badgesLabel}>My Dashboard</Text>
        </View>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBarCustom}
        style={{ backgroundColor: themeVariables.whiteColor, flex: 1 }}
        sceneContainerStyle={{ backgroundColor: themeVariables.whiteColor }}
        pagerStyle={{ backgroundColor: themeVariables.whiteColor }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeVariables.whiteColor },
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
  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingTop: 24,
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
    marginHorizontal: 8,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: themeVariables.blackColor,
  },
  headerContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconSpacer: {
    marginLeft: 10,
  },
  topIconGlass: {
    backgroundColor: 'rgba(240,240,240,0.8)',
    borderColor: 'rgba(200,200,200,0.9)',
    borderWidth: 1,
    shadowColor: 'rgba(255,255,255,0.5)',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  headerProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    flexWrap: 'nowrap',
  },
  profileHeroColumns: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    minHeight: 120,
  },
  profileIdentityColumn: {
    width: '42%',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingTop: 0,
    paddingBottom: 0,
  },
  profileStatsColumn: {
    flex: 1,
    minHeight: 118,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 4,
  },
  iconButton: {
    marginLeft: 8,
  },
  badgesLabel: {
    color: themeVariables.blackColor,
    fontSize: 18,
    fontWeight: '700',
  },
  badgesSummary: {
    marginTop: 2,
    fontSize: 13,
    color: '#6C7690',
  },
  badgesHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  seeAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    marginTop: 0,
  },
  seeAllText: {
    marginRight: 3,
    fontSize: 12,
    fontWeight: '700',
    color: themeVariables.primaryColor,
  },
  badgesContainer: {
    marginHorizontal: 16,
    backgroundColor: '#F8FAFF',
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F4',
  },
  badgesPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  badgePreviewItem: {
    width: '25%',
    paddingHorizontal: 4,
  },
  badgePreviewCard: {
    minHeight: 108,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  badgePreviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  badgePreviewText: {
    minHeight: 28,
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: '100%',
  },
  badgesEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesEmptyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    marginRight: 10,
  },
  badgesEmptyText: {
    flex: 1,
    fontSize: 14,
    color: '#6C7690',
  },
  profilePictureSmall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  profileAvatarWrap: {
    alignSelf: 'center',
  },
  profilePictureLarge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginBottom: 8,
  },
  nameSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    flexShrink: 1,
  },
  nameCentered: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '400',
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  statsItem: {
    marginRight: 10,
    fontSize: 12,
    color: themeVariables.blackColor,
  },
  // Container for the user details next to avatar
  profileDetails: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    width: 0,
    minWidth: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: 0,
    paddingRight: 4,
  },
  memberSinceText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B6780',
    flexShrink: 1,
  },
  memberSinceCentered: {
    marginTop: 1,
    fontSize: 11,
    color: '#6B6780',
    textAlign: 'center',
  },
  statsCardRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 18,
    paddingVertical: 0,
    paddingHorizontal: 8,
    flex: 0.88,
  },
  statRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAF1',
    marginBottom: 0,
    paddingBottom: 0,
  },
  statRowLabelWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexShrink: 1,
  },
  statRowTextBlock: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  statRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: themeVariables.blackColor,
    textAlign: 'left',
    flex: 1,
    marginRight: 12,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'right',
    minWidth: 24,
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
