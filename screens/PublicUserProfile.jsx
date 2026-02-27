import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import { UserContext } from '../contexts/UserContext';
import { fetchUserById } from '../services/UserService';
import { fetchUserActivities } from '../services/ActivityService';
import { fetchEventsForAttendee } from '../services/EventService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import PostGallery from '../components/PostGallery';
import CertificationsList from '../components/CertificationsList';
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
  const preferredLang = userData.user.preferredLanguage || userData.user.language;
  const social = userData.user.socialMedia || userData.user.social || {};
  const certData = userData.certifications || {};
  const eventsCount = filteredEvents.length;
  // Build certifications list
  const ruhiBadges = normalizeRuhiBadges(certData.ruhiBadges);

  const certs = [];
  if (certData.isVerified) certs.push('Verified User');
  if (certData.hasChildProtection) certs.push('Child Protection');
  if (certData.isLocalAssemblyMember) certs.push('LSA Member');

  // certification badges definitions using Ionicons
  const badgeDefs = [
    { flag: certData.isVerified, icon: 'checkmark', color: '#3e8e41', label: 'Verified User' },
    { flag: certData.hasChildProtection, icon: 'shield-checkmark', color: '#d81b60', label: 'Child Protection' },
    { flag: certData.isLocalAssemblyMember, icon: 'star', color: '#b71c1c', label: 'LSA Member' },
  ];
  const postsCount = sortedPosts.length;
  const activitiesCount = filteredActivities.length;
  return (
    <View style={styles.flexContainer}>
      <View contentContainerStyle={styles.container} scrollEnabled={false}>
      <View style={styles.header}>
        {profilePicture ? (
          <FastImage
            style={styles.avatar}
            source={resolveImageSource(profilePicture, { priority: 'high' })}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Avatar
            size={100}
            name={`${firstName || ''} ${lastName || ''}`.trim()}
            variant="beam"
            colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
            style={styles.avatar}
          />
        )}
        <Text style={styles.name}>{firstName} {lastName}</Text>
        {/* Certifications badges */}
        <CertificationsList
          items={badgeDefs
            .filter(b => b.flag)
            .map(b => ({ label: b.label, icon: b.icon, color: b.color }))
          }
        />
        {ruhiBadges.length > 0 && (
          <View style={styles.ruhiSection}>
            <Text style={styles.ruhiTitle}>RUHI Badges</Text>
            <View style={styles.ruhiBadgesRow}>
              {ruhiBadges.map((badge) => (
                <View key={badge} style={styles.ruhiBadge}>
                  <Text style={styles.ruhiBadgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {/* Community Chip in header top-right */}
        {communityName ? (
          <TouchableOpacity
            style={styles.communityChip}
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
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}
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
      <TabView
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
  container: { padding: 16, paddingBottom: 0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: 'red' },
  tabMessageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  header: { position: 'relative', alignItems: 'center', marginBottom: 16, marginTop: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 24, fontWeight: '600' },
  bio: { fontSize: 16, color: '#444', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  label: { fontWeight: '600', marginRight: 6, fontSize: 16, color: '#333' },
  value: { fontSize: 16, color: '#444', flexShrink: 1 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  socialButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#312783', justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  // Certifications badges container and badge styles are now extracted into CertificationsList component
  chipContainer: { marginTop: 12, flexDirection: 'row', borderRadius: 20 },
  chip: { alignSelf: 'flex-start' },
  communityChip: {
    position: 'absolute',
    top: 0,
    right: 10,
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
