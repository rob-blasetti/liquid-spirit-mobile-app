import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TabBar } from 'react-native-tab-view';
import { UserContext } from '../contexts/UserContext';
import { fetchUserById } from '../services/UserService';
import { fetchUserActivities } from '../services/ActivityService';
import { fetchEventsForAttendee } from '../services/EventService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import PostGallery from '../components/PostGallery';
import TabViewCompat from '../components/TabViewCompat';
import resolveImageSource from '../utils/imageSource';
import themeVariables from '../styles/theme';

const normalizeId = (raw) => {
  const str = String(raw || '').trim();
  const match = str.match(/[a-fA-F0-9]{24}/);
  return match ? match[0] : null;
};

const normalizeActivitiesPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload.activities)) return payload.activities.filter(Boolean);
  if (Array.isArray(payload.data?.activities)) return payload.data.activities.filter(Boolean);
  if (Array.isArray(payload.data)) return payload.data.filter(Boolean);
  if (Array.isArray(payload.results)) return payload.results.filter(Boolean);
  return [];
};

const normalizeRuhiBadges = (value) => {
  if (!Array.isArray(value)) return [];

  const parsed = value
    .map((badge) => (typeof badge === 'string' ? badge.trim() : ''))
    .filter((badge) => badge.length > 0);

  return Array.from(new Set(parsed));
};

const normalizeEventsPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload.events)) return payload.events.filter(Boolean);
  if (Array.isArray(payload.data?.events)) return payload.data.events.filter(Boolean);
  if (Array.isArray(payload.data)) return payload.data.filter(Boolean);
  if (Array.isArray(payload.results)) return payload.results.filter(Boolean);
  return [];
};

const PublicUserProfile = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token, storageLoaded, isTokenExpired, refreshSession } = useContext(UserContext);
  const { userId } = route.params || {};
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirected, setRedirected] = useState(false);

  const [errorStatus, setErrorStatus] = useState(null);
  const [didRefresh, setDidRefresh] = useState(false);
  const [userActivities, setUserActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  const normalizedRouteUserId = useMemo(() => normalizeId(userId), [userId]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!normalizedRouteUserId) {
        setError('Invalid profile link');
        setErrorStatus('invalid_id');
        setLoading(false);
        setUserActivities([]);
        setActivitiesError(null);
        setActivitiesLoading(false);
        setUserEvents([]);
        setEventsError(null);
        setEventsLoading(false);
        return;
      }

      if (!storageLoaded) return;
      if (!token || isTokenExpired(token)) {
        if (!didRefresh) {
          setDidRefresh(true);
          try { await refreshSession(); } catch (_) {}
          return;
        }
        setError('Please log in to view this profile.');
        setErrorStatus(401);
        setLoading(false);
        setActivitiesLoading(false);
        setUserActivities([]);
        setEventsLoading(false);
        setUserEvents([]);
        return;
      }

      setLoading(true);
      setActivitiesLoading(true);
      setEventsLoading(true);
      try {
        const data = await fetchUserById(normalizedRouteUserId, token);
        if (!isActive) return;
        setUserData(data);
        setError(null);
        setErrorStatus(null);

        try {
          const activityResponse = await fetchUserActivities(normalizedRouteUserId, token);
          if (!isActive) return;
          setUserActivities(normalizeActivitiesPayload(activityResponse));
          setActivitiesError(null);
        } catch (activityErr) {
          if (!isActive) return;
          if (activityErr?.status === 401 && !didRefresh) {
            setDidRefresh(true);
            try { await refreshSession(); } catch (_) {}
            return;
          }
          setActivitiesError(activityErr?.message || 'Failed to load activities');
          setUserActivities([]);
        }

        try {
          const eventsResponse = await fetchEventsForAttendee(normalizedRouteUserId, token);
          if (!isActive) return;
          setUserEvents(normalizeEventsPayload(eventsResponse));
          setEventsError(null);
        } catch (eventsErr) {
          if (!isActive) return;
          if (eventsErr?.status === 401 && !didRefresh) {
            setDidRefresh(true);
            try { await refreshSession(); } catch (_) {}
            return;
          }
          setEventsError(eventsErr?.message || 'Failed to load events');
          setUserEvents([]);
        }
      } catch (err) {
        if (!isActive) return;
        if (err?.status === 401 && !didRefresh) {
          setDidRefresh(true);
          try { await refreshSession(); } catch (_) {}
          return;
        }
        setError(err?.message || 'Failed to load user');
        setErrorStatus(err?.status || 'unknown');
        setUserData(null);
        setUserActivities([]);
        setActivitiesError(null);
        setUserEvents([]);
        setEventsError(null);
      } finally {
        if (isActive) {
          setLoading(false);
          setActivitiesLoading(false);
          setEventsLoading(false);
        }
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [normalizedRouteUserId, token, storageLoaded, didRefresh]);

  const handleRefreshActivities = useCallback(async () => {
    if (!normalizedRouteUserId) return;

    if (!token || isTokenExpired(token)) {
      if (!didRefresh) {
        setDidRefresh(true);
        try { await refreshSession(); } catch (_) {}
      }
      return;
    }

    setActivitiesLoading(true);
    try {
      const activityResponse = await fetchUserActivities(normalizedRouteUserId, token);
      setUserActivities(normalizeActivitiesPayload(activityResponse));
      setActivitiesError(null);
    } catch (activityErr) {
      if (activityErr?.status === 401 && !didRefresh) {
        setDidRefresh(true);
        try { await refreshSession(); } catch (_) {}
        return;
      }
      setActivitiesError(activityErr?.message || 'Failed to load activities');
    } finally {
      setActivitiesLoading(false);
    }
  }, [normalizedRouteUserId, token, isTokenExpired, didRefresh, refreshSession]);

  const handleRefreshEvents = useCallback(async () => {
    if (!normalizedRouteUserId) return;

    if (!token || isTokenExpired(token)) {
      if (!didRefresh) {
        setDidRefresh(true);
        try { await refreshSession(); } catch (_) {}
      }
      return;
    }

    setEventsLoading(true);
    try {
      const eventsResponse = await fetchEventsForAttendee(normalizedRouteUserId, token);
      setUserEvents(normalizeEventsPayload(eventsResponse));
      setEventsError(null);
    } catch (eventsErr) {
      if (eventsErr?.status === 401 && !didRefresh) {
        setDidRefresh(true);
        try { await refreshSession(); } catch (_) {}
        return;
      }
      setEventsError(eventsErr?.message || 'Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  }, [normalizedRouteUserId, token, isTokenExpired, didRefresh, refreshSession]);
  // Redirect to Home if user not found or specific errors
  useEffect(() => {
    if (redirected || loading) return;
    if (errorStatus === 404) {
      navigation.replace('Main', { screen: 'Home', params: { bannerMessage: 'Sorry, that user no longer exists.' } });
      setRedirected(true);
    } else if (errorStatus === 401) {
      navigation.replace('Main', { screen: 'Home', params: { bannerMessage: 'Please log in to view this profile.' } });
      setRedirected(true);
    } else if (errorStatus === 'invalid_id') {
      navigation.replace('Main', { screen: 'Home', params: { bannerMessage: 'Invalid profile link.' } });
      setRedirected(true);
    }
  }, [redirected, loading, errorStatus, navigation]);

  // TabView state (always defined to keep hooks order stable)
  const layout = Dimensions.get('window');
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    { key: 'posts', title: 'Posts' },
    { key: 'activities', title: 'Activities' },
    { key: 'events', title: 'Events' },
  ]);
  const sortedPosts = useMemo(() => {
    if (!Array.isArray(userData?.posts)) return [];
    const items = userData.posts.filter(Boolean).slice();
    const getTimestamp = (item) => {
      const fallback = item?.updatedAt || item?.date || item?.createdDate;
      const raw = item?.createdAt || fallback;
      const time = raw ? new Date(raw).getTime() : NaN;
      return Number.isFinite(time) ? time : 0;
    };
    return items.sort((a, b) => getTimestamp(b) - getTimestamp(a));
  }, [userData?.posts]);
  const filteredActivities = useMemo(
    () => (Array.isArray(userActivities) ? userActivities.filter(Boolean) : []),
    [userActivities]
  );
  const filteredEvents = useMemo(
    () => (Array.isArray(userEvents) ? userEvents.filter(Boolean) : []),
    [userEvents]
  );
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'posts':
        return <PostGallery posts={sortedPosts} refreshing={false} onRefresh={() => {}} />;
      case 'activities':
        if (activitiesError) {
          return (
            <View style={styles.tabMessageContainer}>
              <Text style={styles.errorText}>{activitiesError}</Text>
            </View>
          );
        }
        return (
          <PostGallery
            posts={filteredActivities}
            refreshing={activitiesLoading}
            onRefresh={handleRefreshActivities}
          />
        );
      case 'events':
        if (eventsError) {
          return (
            <View style={styles.tabMessageContainer}>
              <Text style={styles.errorText}>{eventsError}</Text>
            </View>
          );
        }
        return (
          <PostGallery
            posts={filteredEvents}
            refreshing={eventsLoading}
            onRefresh={handleRefreshEvents}
          />
        );
      default:
        return null;
    }
  };
  const renderTabBarCustom = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#312783' }}
      style={{ backgroundColor: '#fff' }}
      labelStyle={{ color: '#312783', fontWeight: '600' }}
      activeColor="#312783"
      inactiveColor="gray"
    />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!userData) {
    return null;
  }

  const { firstName, lastName, profilePicture, bio } = userData.user;
  const communityName = userData.user.community?.name;
  const social = userData.user.socialMedia || userData.user.social || {};
  const certData = userData.certifications || {};
  const ruhiBadges = normalizeRuhiBadges(certData.ruhiBadges);

  // certification badges definitions using Ionicons
  const badgeDefs = [
    { flag: certData.isVerified, icon: 'checkmark', color: '#3e8e41', label: 'Verified User' },
    { flag: certData.hasChildProtection, icon: 'shield-checkmark', color: '#d81b60', label: 'Child Protection' },
    { flag: certData.isLocalAssemblyMember, icon: 'star', color: '#b71c1c', label: 'LSA Member' },
  ];
  const earnedBadges = [
    ...badgeDefs.filter(b => b.flag).map(b => ({
      key: b.label,
      label: b.label,
      icon: b.icon,
      color: b.color,
    })),
    ...ruhiBadges.map(badge => ({
      key: `ruhi:${badge}`,
      label: `RUHI: ${badge}`,
      icon: 'book-outline',
      color: '#4A148C',
    })),
  ];
  const badgeSummaryItems = earnedBadges.slice(0, 3);
  const badgeCount = earnedBadges.length;
  const stats = {
    activities: filteredActivities.length,
    events: filteredEvents.length,
    posts: sortedPosts.length,
  };
  return (
    <View style={styles.flexContainer}>
      <View contentContainerStyle={styles.container} scrollEnabled={false}>
      <View style={styles.headerContainer}>
        <View style={styles.headerProfileInfo}>
          {profilePicture ? (
            <FastImage
              style={styles.profilePictureSmall}
              source={resolveImageSource(profilePicture, { priority: 'high' })}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <Avatar
              size={44}
              name={`${firstName || ''} ${lastName || ''}`.trim()}
              variant="beam"
              colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
              style={styles.profilePictureSmall}
            />
          )}
          <View style={styles.profileDetails}>
            <Text style={styles.nameSmall}>{firstName} {lastName}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsItem}>Activities: {stats.activities}</Text>
              <Text style={styles.statsItem}>Events: {stats.events}</Text>
              <Text style={styles.statsItem}>Posts: {stats.posts}</Text>
            </View>
            {communityName ? (
              <TouchableOpacity
                style={styles.communityChipInline}
                onPress={() =>
                  navigation.navigate('Search', {
                    initialQuery: communityName,
                    initialQueryTs: Date.now(),
                  })
                }
              >
                <Text style={styles.communityChipText}>{communityName}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
      <View style={styles.badgesSection}>
        <View style={styles.badgesHeadingRow}>
          <View style={styles.badgesHeadingText}>
            <Text style={styles.badgesLabel}>Badges</Text>
            <Text style={styles.badgesSummary}>
              {badgeCount > 0 ? `${badgeCount} earned` : 'No badges yet'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('PublicUserBadges', {
                certifications: certData,
                profileName: `${firstName || ''} ${lastName || ''}`.trim() || 'Member',
              })
            }
            style={styles.seeAllButton}
            accessibilityRole="button"
            accessibilityLabel={`View ${firstName || 'member'} ${lastName || ''} badges`}
            accessibilityHint="Opens the full badges screen for this user"
          >
            <Text style={styles.seeAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={16} color={themeVariables.primaryColor} />
          </TouchableOpacity>
        </View>
        {badgeSummaryItems.length > 0 ? (
          <View style={styles.badgesPreviewRow}>
            {badgeSummaryItems.map(item => (
              <View key={item.key} style={styles.badgePreviewItem}>
                <View style={styles.badgePreviewCard}>
                  <View style={[styles.badgePreviewIcon, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon} size={18} color={themeVariables.whiteColor} />
                  </View>
                  <Text style={styles.badgePreviewText} numberOfLines={2}>
                    {item.label}
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
      </View>
      {/* Social links */}
      {Object.entries(social).length > 0 && (
        <View style={styles.socialRow}>
          {social.facebook && (
            <TouchableOpacity onPress={() => Linking.openURL(social.facebook)} style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.instagram && (
            <TouchableOpacity onPress={() => Linking.openURL(social.instagram)} style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.x && (
            <TouchableOpacity onPress={() => Linking.openURL(social.x)} style={styles.socialButton}>
              <FontAwesome6 name="x-twitter" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.linkedin && (
            <TouchableOpacity onPress={() => Linking.openURL(social.linkedin)} style={styles.socialButton}>
              <Ionicons name="logo-linkedin" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          {social.tiktok && (
            <TouchableOpacity onPress={() => Linking.openURL(social.tiktok)} style={styles.socialButton}>
              <Ionicons name="logo-tiktok" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
      </View>
      <TabViewCompat
        navigationState={{ index: tabIndex, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBarCustom}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
        style={styles.tabView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Container padding for header content; bottom padding reduced to minimize space before tabs
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: 'red' },
  tabMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  headerProfileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  profilePictureSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  profileDetails: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    flex: 1,
  },
  nameSmall: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
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
  bio: { fontSize: 16, color: '#444', marginTop: 4, paddingHorizontal: 4, marginBottom: 4 },
  badgesSection: {
    paddingHorizontal: 4,
    paddingVertical: 8,
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
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  badgesHeadingText: {
    marginLeft: 4,
  },
  seeAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
  },
  seeAllText: {
    marginRight: 4,
    fontSize: 13,
    fontWeight: '700',
    color: themeVariables.primaryColor,
  },
  badgesContainer: {
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
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  badgePreviewItem: {
    flex: 1,
    paddingHorizontal: 4,
    maxWidth: '33.33%',
  },
  badgePreviewCard: {
    minHeight: 112,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgePreviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgePreviewText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: themeVariables.primaryColor,
    textAlign: 'center',
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
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  label: { fontWeight: '600', marginRight: 6, fontSize: 16, color: '#333' },
  value: { fontSize: 16, color: '#444', flexShrink: 1 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  socialButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#312783', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  // Certifications badges container and badge styles are now extracted into CertificationsList component
  chipContainer: { marginTop: 12, flexDirection: 'row', borderRadius: 20 },
  chip: { alignSelf: 'flex-start' },
  communityChipInline: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#312783',
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  ruhiSection: {
    marginTop: 10,
    width: '100%',
  },
  ruhiTitle: {
    color: '#312783',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  ruhiBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ruhiBadge: {
    backgroundColor: '#ececff',
    borderWidth: 1,
    borderColor: '#312783',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  ruhiBadgeText: {
    color: '#312783',
    fontSize: 12,
    fontWeight: '600',
  },
  communityChipText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600', color: '#312783' },
  statLabel: { fontSize: 14, color: '#444' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#312783', marginTop: 24, marginBottom: 8 },
  flexContainer: { flex: 1, backgroundColor: themeVariables.screenBackgroundColor },
  tabView: { flex: 1 },
});

export default PublicUserProfile;
