// Amount to offset content so top corners are hidden initially
const HEADER_OFFSET = 0;
import React, { useContext, useEffect, useState, useLayoutEffect, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Dimensions,
  UIManager,
  Platform,
  Modal,
  StatusBar,
  Share,
  Alert,
  Image,
} from 'react-native';
import {
  Card,
  CardTitle,
  CardContent,
} from 'react-native-material-cards';
import SwipeToCloseScrollView from '../components/SwipeToCloseScrollView';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Tooltip } from 'react-native-elements';

import themeVariables from '../styles/theme';
import MapView, { Marker } from 'react-native-maps';
import {
  fetchActivityDetails,
  requestParticipation,
  requestFacilitator,
} from '../services/ActivityService';
import { UserContext } from '../contexts/UserContext';
import UserBadge from '../components/UserBadge';
import SessionCard from '../components/SessionCard';
import { resolveSessionDate } from '../utils/activityDate';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Screen dimensions
const { height: windowHeight, width: screenWidth } = Dimensions.get('window');

const MAP_VENUE_TYPES = new Set(['Residence', 'CommunityVenue']);

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const coalesceString = (...values) => {
  for (const value of values) {
    const trimmed = normalizeString(value);
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
};

const selectPrimaryVenue = (venues) => {
  if (!Array.isArray(venues) || venues.length === 0) return null;
  const priority = ['Residence', 'CommunityVenue'];
  for (const type of priority) {
    const match = venues.find(venue => venue?.type === type);
    if (match) return match;
  }
  const fallback = venues.find(venue => MAP_VENUE_TYPES.has(venue?.type) || Boolean(venue?.address));
  return fallback || venues[0] || null;
};

const formatAddress = (address) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [
    address.streetAddress,
    address.suburb,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ];
  return parts
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(part => part.length > 0)
    .join(', ');
};

const coerceCoordinates = (value) => {
  const makePoint = (lat, lng) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }
    return null;
  };

  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2) {
    const [lng, lat] = value;
    return makePoint(lat, lng);
  }
  if (typeof value === 'object') {
    if ('latitude' in value || 'longitude' in value) {
      return makePoint(value.latitude ?? value.lat, value.longitude ?? value.lng);
    }
    if ('lat' in value || 'lng' in value) {
      return makePoint(value.lat, value.lng);
    }
    if (Array.isArray(value.coordinates) && value.coordinates.length >= 2) {
      const [lng, lat] = value.coordinates;
      return makePoint(lat, lng);
    }
  }
  return null;
};

const getVenueCoordinates = (venue) => {
  if (!venue || typeof venue !== 'object') return null;
  return (
    coerceCoordinates(venue.coordinates) ||
    coerceCoordinates(venue.location) ||
    coerceCoordinates(venue.address?.coordinates) ||
    coerceCoordinates(venue.address?.location) ||
    null
  );
};

const normalizeVenueEntry = (entry) => {
  if (!entry) return null;
  if (typeof entry === 'string') return null;
  if (entry.venue) return normalizeVenueEntry(entry.venue);
  if (entry.venueDetails) return normalizeVenueEntry(entry.venueDetails);
  return entry;
};

const getStreetAndSuburb = (address) => {
  if (!address || typeof address !== 'object') return '';
  const parts = [address.streetAddress, address.suburb]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(part => part.length > 0);
  if (parts.length > 0) return parts.join(', ');
  return formatAddress(address);
};

const isOnlineVenue = (venue) => {
  if (!venue || typeof venue !== 'object') return false;
  const type = normalizeString(venue.type).toLowerCase();
  if (type === 'online') return true;
  return normalizeString(venue.onlineLink).length > 0;
};

const hasPhysicalVenueData = (venue) => {
  if (!venue || typeof venue !== 'object') return false;
  if (isOnlineVenue(venue)) return false;
  const hasAddress = formatAddress(venue.address).length > 0;
  return hasAddress || Boolean(getVenueCoordinates(venue));
};

const SectionTitle = ({ title, note, showTooltip = true }) => {
  if (!showTooltip || !note) {
    return <Text style={styles.mapTitle}>{title}</Text>;
  }

  const tooltipWidth = 260;
  const tooltipHeight = note.length > 55 ? 72 : 52;

  return (
    <View style={styles.titleWithTooltip}>
      <Text style={styles.mapTitle}>{title}</Text>
      <Tooltip
        popover={<Text style={styles.tooltipPopoverText}>{note}</Text>}
        skipAndroidStatusBar
        withOverlay={false}
        backgroundColor="rgba(33, 33, 33, 0.95)"
        pointerColor="rgba(33, 33, 33, 0.95)"
        placement="bottom"
        width={tooltipWidth}
        height={tooltipHeight}
        tooltipStyle={styles.tooltipBubble}
      >
        <View style={styles.tooltipIconTarget}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={themeVariables.primaryColor}
          />
        </View>
      </Tooltip>
    </View>
  );
};

/* ─── Helper Functions ────────────────────────────────────────────── */
// (Removed getDayName/getDayMonth: using groupDetails.day and formatTime now)

/* ────────────────────────────────────────────────────────────────────────────
   Screen
   ──────────────────────────────────────────────────────────────────────────── */
const ActivityDetailCard = ({ route }) => {
  const navigation = useNavigation();
  const { user, token, storageLoaded, isTokenExpired, refreshSession } = useContext(UserContext);
  const { activityId, activityPreload, initialSessionId = null } = route.params;

  const [activity, setActivity] = useState(activityPreload || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirected, setRedirected] = useState(false);
  // Flag to indicate full activity details have been loaded
  const detailsLoaded = !loading;

  const handleShare = async () => {
    const id = activity?._id || activityId;
    if (!id) return;
    const url = `https://www.liquidspirit.org/activities/${id}`;
    const title = activity?.title || 'Liquid Spirit Activity';
    const message = `Check out this activity on Liquid Spirit \uD83D\uDC47\n${url}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const messengerUrl = `fb-messenger://share?link=${encodeURIComponent(url)}`;

    try {
      if (await Linking.canOpenURL(whatsappUrl)) {
        await Linking.openURL(whatsappUrl);
        return;
      }
      if (await Linking.canOpenURL(messengerUrl)) {
        await Linking.openURL(messengerUrl);
        return;
      }
      await Share.share({ message, url, title });
    } catch (err) {
      console.error('Error sharing:', err);
      Alert.alert('Sharing Error', 'Something went wrong while trying to share the activity.');
    }
  };
  // Add share button in header, styled like back arrow
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{
            backgroundColor: themeVariables.greyColor,
            borderRadius: themeVariables.borderRadiusPill,
            padding: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color={themeVariables.blackColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, activity]);
  const [errorStatus, setErrorStatus] = useState(null);
  const [didRefresh, setDidRefresh] = useState(false);

  const normalizeId = (raw) => {
    const str = String(raw || '').trim();
    const match = str.match(/[a-fA-F0-9]{24}/);
    return match ? match[0] : null;
  };

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      // preload
      if (activityPreload) {
        setActivity(activityPreload);
      }

      const id = normalizeId(activityId);
      if (!id) {
        setError('Invalid activity link');
        setErrorStatus('invalid_id');
        setLoading(false);
        return;
      }

      if (!storageLoaded) return; // wait for storage to hydrate token
      if (!token || isTokenExpired(token)) {
        if (!didRefresh) {
          setDidRefresh(true);
          try { await refreshSession(); } catch (_) {}
          return;
        } else {
          setError('Please log in to view this activity.');
          setErrorStatus(401);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      try {
        const data = await fetchActivityDetails(id, token);
        if (!isMounted) return;
        if (!data) {
          setError('Activity not found');
          setErrorStatus(404);
        } else {
          setActivity(data);
          setError(null);
          setErrorStatus(null);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 401 && !didRefresh) {
          setDidRefresh(true);
          try { await refreshSession(); } catch (_) {}
          return;
        }
        setError(err?.message || 'Failed to load activity details');
        setErrorStatus(err?.status || 'unknown');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, [activityId, token, storageLoaded, didRefresh, activityPreload]);

  // Redirect to Activities screen for specific errors
  useEffect(() => {
    if (redirected || loading) return;
    if (errorStatus === 404) {
      navigation.replace('Activities', { bannerMessage: 'Sorry, that activity no longer exists.' });
      setRedirected(true);
    } else if (errorStatus === 401) {
      navigation.replace('Activities', { bannerMessage: 'Please log in to view this activity.' });
      setRedirected(true);
    } else if (errorStatus === 'invalid_id') {
      navigation.replace('Activities', { bannerMessage: 'Invalid activity link.' });
      setRedirected(true);
    }
  }, [errorStatus, redirected, loading, navigation]);

  const formatTime = (t) => {
    if (!t) return 'N/A';
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const openGoogleMaps = (addr) => {
    const cleaned = normalizeString(addr);
    if (!cleaned) return;
    const query = encodeURIComponent(cleaned);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(err => {
      console.warn('Failed to open maps', err);
    });
  };

  /* ── early returns ────────────────────────────────────────────── */
  if (!activityId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noActivityText}>No activity to display.</Text>
      </View>
    );
  }

  if (loading && activityPreload) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right', 'bottom' ]}>
        <StatusBar
          animated={true}
          translucent={true}
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <SwipeToCloseScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: HEADER_OFFSET, paddingBottom: 30 }}
          overScrollMode="always"
          scrollEventThrottle={16}
          // swipe down past half the header offset to go back
          threshold={HEADER_OFFSET / 2}
        >
          <ActivityCardBody
            activity={activityPreload}
            setActivity={setActivity}
            formatTime={formatTime}
            openGoogleMaps={openGoogleMaps}
            userId={user?.id}
            detailsLoaded={detailsLoaded}
          />
        </SwipeToCloseScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noActivityText}>
          Activity details not available.
        </Text>
      </View>
    );
  }

  /* ── main render ────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right', 'bottom' ]}>
      <StatusBar
        animated={true}
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <SwipeToCloseScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_OFFSET, paddingBottom: 30 }}
        overScrollMode="always"
        scrollEventThrottle={16}
        // swipe down past half the header offset to go back
        threshold={HEADER_OFFSET / 2}
      >
        <ActivityCardBody
          activity={activity}
          setActivity={setActivity}
          formatTime={formatTime}
          openGoogleMaps={openGoogleMaps}
          userId={user?.id}
          detailsLoaded={detailsLoaded}
          initialSessionId={initialSessionId}
        />
      </SwipeToCloseScrollView>
    </SafeAreaView>
  );
};

export default ActivityDetailCard;

/* ────────────────────────────────────────────────────────────────────────────
   Card Body
   ──────────────────────────────────────────────────────────────────────────── */
const ActivityCardBody = ({
  activity,
  setActivity,
  formatTime,
  openGoogleMaps,
  userId,
  // Indicates that full details have been fetched from backend
  detailsLoaded,
  initialSessionId,
}) => {
  const {
    imageUrl,
    title,
    activityType,
    groupDetails,
    onlineLink: activityOnlineLink,
    address,
    venues: activityVenues,
    facilitators = [],
    participants = [],
    facilitatorLimit,
    participantLimit,
  } = activity;

  // Derived values for display
  // Use groupDetails.day explicitly for the Day cell
  const dayOfWeek = groupDetails?.day ?? 'N/A';
  // Time of session
  const timeMain = formatTime(groupDetails?.time);

  const getNormalizedVenues = (session) => {
    const source = [];
    if (session && Array.isArray(session.venues) && session.venues.length > 0) {
      source.push(...session.venues);
    }
    if (Array.isArray(activityVenues) && activityVenues.length > 0) {
      source.push(...activityVenues);
    }
    const seen = new Set();
    return source
      .map(normalizeVenueEntry)
      .filter(Boolean)
      .filter(venue => {
        const id = venue?._id || venue?.id;
        if (!id) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  };

  const upcomingSessions = useMemo(() => {
    if (!Array.isArray(activity.sessions)) return [];
    const now = new Date();
    return activity.sessions
      .filter(session => ['Scheduled', 'Confirmed'].includes(session.status))
      .map(session => {
        const dateObj = resolveSessionDate(session, activity);
        return { session, dateObj };
      })
      .filter(({ dateObj }) => dateObj instanceof Date && !isNaN(dateObj) && dateObj >= now)
      .map(({ session, dateObj }) => {
        const normalizedForSession = getNormalizedVenues(session);
        const primaryVenue = selectPrimaryVenue(normalizedForSession);
        const venueAddress = primaryVenue?.address || session.address || address;
        const displayAddress = normalizeString(getStreetAndSuburb(venueAddress));
        const displayName = coalesceString(
          session.name,
          session.title,
          primaryVenue?.name,
          activity.title,
          'Upcoming Session'
        );
        return {
          ...session,
          dateObj,
          normalizedVenues: normalizedForSession,
          primaryVenue,
          displayAddress,
          displayName,
        };
      })
      .sort((a, b) => a.dateObj - b.dateObj);
  }, [activity]);

  const normalizedInitialSessionId = useMemo(() => normalizeString(initialSessionId), [initialSessionId]);

  const sessionMatchesInitialId = useCallback((sessionCandidate) => {
    if (!normalizedInitialSessionId || !sessionCandidate) return false;
    const candidates = [
      sessionCandidate._id,
      sessionCandidate.id,
      sessionCandidate.sessionId,
      sessionCandidate.session_id,
      sessionCandidate.session?._id,
      sessionCandidate.session?.id,
    ];
    return candidates.some(value => normalizeString(value) === normalizedInitialSessionId);
  }, [normalizedInitialSessionId]);

  const highlightedSessionIndex = useMemo(() => {
    if (!normalizedInitialSessionId) return -1;
    return upcomingSessions.findIndex(sessionMatchesInitialId);
  }, [upcomingSessions, normalizedInitialSessionId, sessionMatchesInitialId]);

  const orderedUpcomingSessions = useMemo(() => {
    if (highlightedSessionIndex <= 0) {
      return upcomingSessions;
    }
    const clone = [...upcomingSessions];
    const [highlighted] = clone.splice(highlightedSessionIndex, 1);
    clone.unshift(highlighted);
    return clone;
  }, [upcomingSessions, highlightedSessionIndex]);

  const nextSession = orderedUpcomingSessions[0] || null;

  const curriculumLesson = nextSession?.curriculumLesson || activity?.curriculumLesson || null;

  const curriculumDetails = useMemo(() => {
    if (!curriculumLesson || typeof curriculumLesson !== 'object') return null;
    const grade = curriculumLesson.grade;
    const setTitle = normalizeString(curriculumLesson.setTitle || curriculumLesson.set);
    const lessonNumber = curriculumLesson.lessonNumber;
    const lessonTitle = normalizeString(curriculumLesson.lessonTitle || curriculumLesson.title);
    if (grade == null && !setTitle && lessonNumber == null && !lessonTitle) {
      return null;
    }
    const lessonSummary = (() => {
      if (lessonNumber == null && !lessonTitle) return null;
      const parts = [];
      if (lessonNumber != null) parts.push(`Lesson ${lessonNumber}`);
      if (lessonTitle) parts.push(lessonTitle);
      return parts.join(': ');
    })();
    return {
      grade,
      setTitle,
      lessonSummary,
    };
  }, [curriculumLesson]);

  const normalizedVenues = useMemo(() => getNormalizedVenues(nextSession), [nextSession, activityVenues]);

  const mapVenue = useMemo(() => {
    if (nextSession?.primaryVenue) return nextSession.primaryVenue;
    return selectPrimaryVenue(normalizedVenues);
  }, [nextSession, normalizedVenues]);

  const nextSessionVenueAddress = useMemo(() => {
    if (nextSession?.primaryVenue?.address) return nextSession.primaryVenue.address;
    if (nextSession?.address) return nextSession.address;
    if (mapVenue?.address) return mapVenue.address;
    return address;
  }, [nextSession, mapVenue, address]);

  const mapAddress = useMemo(() => {
    const primary = formatAddress(nextSessionVenueAddress);
    if (primary) return primary;
    return formatAddress(address);
  }, [nextSessionVenueAddress, address]);

  const mapDisplayName = coalesceString(nextSession?.displayName, mapVenue?.name, mapVenue?.title, mapVenue?.label, activity.title, 'Upcoming Session');
  const mapDisplayAddress = coalesceString(nextSession?.displayAddress, getStreetAndSuburb(nextSessionVenueAddress), getStreetAndSuburb(address));

  const mapCoordinates = useMemo(() => getVenueCoordinates(nextSession?.primaryVenue) || getVenueCoordinates(mapVenue), [nextSession, mapVenue]);

  const sessionOnlineLink = useMemo(() => {
    const onlineVenue = normalizedVenues.find(venue => venue?.type === 'Online' || Boolean(venue?.onlineLink));
    const raw = onlineVenue?.onlineLink || nextSession?.onlineLink || activityOnlineLink;
    return normalizeString(raw);
  }, [normalizedVenues, nextSession, activityOnlineLink]);

  const resolvedOnlineLink = useMemo(() => {
    if (!sessionOnlineLink) return '';
    if (/^https?:\/\//i.test(sessionOnlineLink)) return sessionOnlineLink;
    return `https://${sessionOnlineLink}`;
  }, [sessionOnlineLink]);

  const showOnlineSection = sessionOnlineLink.length > 0;

  const hasPhysicalSessionLocation = useMemo(() => {
    const venuesToInspect = [];
    if (nextSession?.primaryVenue) {
      venuesToInspect.push(nextSession.primaryVenue);
    }
    if (Array.isArray(normalizedVenues) && normalizedVenues.length > 0) {
      venuesToInspect.push(...normalizedVenues);
    }
    if (venuesToInspect.some(hasPhysicalVenueData)) {
      return true;
    }
    return formatAddress(nextSession?.address).length > 0;
  }, [normalizedVenues, nextSession]);

  const isOnlineOnlySession = showOnlineSection && !hasPhysicalSessionLocation;
  const isHybridSession = showOnlineSection && hasPhysicalSessionLocation;
  const showMapSection = !isOnlineOnlySession && (Boolean(mapCoordinates) || Boolean(mapDisplayAddress));

  // Region state for map
  const [region, setRegion] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!showMapSection) {
      setRegion(null);
      return;
    }

    if (mapCoordinates) {
      setRegion({
        latitude: mapCoordinates.latitude,
        longitude: mapCoordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      return;
    }

    if (!mapAddress) {
      setRegion(null);
      return;
    }

    const q = encodeURIComponent(mapAddress);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`, {
      headers: {
        'User-Agent': 'LiquidSpiritApp/1.0 (info@liquidspirit.org)',
        'Accept-Language': 'en',
      },
    })
      .then(res => res.json())
      .then(results => {
        if (!cancelled && results && results.length > 0) {
          const { lat, lon } = results[0];
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lon);
          if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      })
      .catch(err => console.warn('Geocode error', err));

    return () => {
      cancelled = true;
    };
  }, [mapAddress, mapCoordinates, showMapSection]);


  const isUserFacilitator = facilitators.some(
    (f) => f.details?._id === userId
  );
  const isUserParticipant = participants.some(
    (p) => p.details?._id === userId
  );

  // Determine if there's room based on provided limits (null/undefined = no limit)
  const hasFacilitatorSpace =
    facilitatorLimit == null ? true : facilitators.length < facilitatorLimit;
  const hasParticipantSpace =
    participantLimit == null ? true : participants.length < participantLimit;

  // Local state for modals for facilitators/participants
  const [facilitatorsModalVisible, setFacilitatorsModalVisible] = useState(false);
  const [participantsModalVisible, setParticipantsModalVisible] = useState(false);
  // Optimistic request flags
  const [optimisticFacilitatorRequest, setOptimisticFacilitatorRequest] = useState(false);
  const [optimisticParticipantRequest, setOptimisticParticipantRequest] = useState(false);



  // User context and request handlers (token from context)
  const { token } = useContext(UserContext);
  const handleFacilitatorRequest = async () => {
    // Optimistic facilitator request
    setOptimisticFacilitatorRequest(true);
    try {
      await requestFacilitator(activity._id, userId, token || '');
      // refresh activity data
      const updated = await fetchActivityDetails(activity._id, token || '');
      setActivity(updated);
    } catch (err) {
      const msg = err.message || 'Failed to send facilitator request';
      // If already requested, treat as pending
      if (msg.toLowerCase().includes('already')) {
        setOptimisticFacilitatorRequest(true);
        try {
          const updated = await fetchActivityDetails(activity._id, token || '');
          setActivity(updated);
        } catch (_) {}
      } else {
        setOptimisticFacilitatorRequest(false);
      }
      Alert.alert('Request Error', msg);
    }
  };
  const handleParticipantRequest = async () => {
    // Optimistic participant request
    setOptimisticParticipantRequest(true);
    try {
      await requestParticipation(activity._id, userId, token || '');
      // refresh activity data
      const updated = await fetchActivityDetails(activity._id, token || '');
      setActivity(updated);
    } catch (err) {
      const msg = err.message || 'Failed to send participation request';
      // If already requested, treat as pending
      if (msg.toLowerCase().includes('already')) {
        setOptimisticParticipantRequest(true);
        try {
          const updated = await fetchActivityDetails(activity._id, token || '');
          setActivity(updated);
        } catch (_) {}
      } else {
        setOptimisticParticipantRequest(false);
      }
      Alert.alert('Request Error', msg);
    }
  };
  // Determine current user status for display
  // Determine current and pending user status for display
  // Determine if the current user has a pending facilitator/participant request
  const isPendingFacilitator =
    Array.isArray(activity.pendingFacilitators) &&
    activity.pendingFacilitators.some((p) =>
      (typeof p === 'string' ? p : p.details?._id) === userId
    );
  const isPendingParticipant =
    Array.isArray(activity.pendingParticipants) &&
    activity.pendingParticipants.some((p) =>
      (typeof p === 'string' ? p : p.details?._id) === userId
    );
  const hasRequestedFacilitator =
    optimisticFacilitatorRequest || isPendingFacilitator;
  const hasRequestedParticipant =
    optimisticParticipantRequest || isPendingParticipant;
  return (
    <>
    <Card style={styles.card}>
      {imageUrl && (
        <FastImage
          source={{ uri: imageUrl }}
          style={styles.banner}
          resizeMode={FastImage.resizeMode.cover}
        />
      )}

      <View style={styles.overlayCard}>
        <CardTitle
          title={title}
          subtitle={activityType?.name ?? 'Unknown'}
          style={styles.titleBlock}
          titleStyle={styles.cardTitleText}
          subtitleStyle={styles.cardSubtitleText}
        />
        {/* Header Info: Day.Time and Host Address */}
        <View style={styles.headerInfoContainer}>
          <Text style={styles.headerInfoText}>{dayOfWeek} ‧ {timeMain}</Text>
        </View>
        {/* Divider above description */}
        <View style={styles.divider} />
        {/* Description section */}
        <Text style={styles.mapTitle}>Description</Text>
        <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
          {activity.description}
        </Text>
        {/* Divider above upcoming sessions */}
        <View style={styles.divider} />
        {orderedUpcomingSessions.length > 0 && (
          <>
            <Text style={styles.mapTitle}>Upcoming Sessions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContent}
            >
              {orderedUpcomingSessions.map((sess, idx) => (
                <SessionCard
                  key={sess._id || idx}
                  session={sess}
                  detailsLoaded={detailsLoaded}
                  hasFacilitatorSpace={hasFacilitatorSpace}
                  hasParticipantSpace={hasParticipantSpace}
                  isUserFacilitator={isUserFacilitator}
                  isUserParticipant={isUserParticipant}
                  hasRequestedFacilitator={hasRequestedFacilitator}
                  hasRequestedParticipant={hasRequestedParticipant}
                  onFacilitatorRequest={handleFacilitatorRequest}
                  onParticipantRequest={handleParticipantRequest}
                  width={screenWidth - 32}
                />
              ))}
            </ScrollView>
            <View style={styles.divider} />
          </>
        )}

        {curriculumDetails && (
          <>
            <SectionTitle
              title="Class Curriculum"
              note="Curriculum details reflect the next upcoming session."
            />
            <View style={styles.curriculumBox}>
              <View style={styles.curriculumRowContainer}>
                <Text style={styles.curriculumLabel}>Grade</Text>
                <Text style={styles.curriculumValue}>
                  {curriculumDetails.grade != null ? curriculumDetails.grade : '—'}
                </Text>
              </View>
              {(curriculumDetails.setTitle || curriculumDetails.lessonSummary) && (
                <View style={styles.curriculumDivider} />
              )}
              {curriculumDetails.setTitle ? (
                <View style={styles.curriculumRowContainer}>
                  <Text style={styles.curriculumLabel}>Set</Text>
                  <Text style={styles.curriculumValue}>{curriculumDetails.setTitle}</Text>
                </View>
              ) : null}
              {curriculumDetails.lessonSummary ? (
                <View style={styles.curriculumRowContainer}>
                  <Text style={styles.curriculumLabel}>Lesson</Text>
                  <Text style={styles.curriculumValue}>{curriculumDetails.lessonSummary}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {showMapSection && (
          <>
            <SectionTitle
              title="Host Address"
              note="Address reflects the next upcoming session."
            />
            <View style={styles.mapWrapper}>
              {region ? (
                <MapView
                  provider={Platform.OS === 'android' ? MapView.PROVIDER_GOOGLE : null}
                  style={styles.map}
                  initialRegion={region}
                >
                  <Marker coordinate={region} />
                </MapView>
              ) : (
                <View style={styles.mapLoader}>
                  <ActivityIndicator size="small" color={themeVariables.primaryColor} />
                </View>
              )}
            </View>
            {mapDisplayName || mapDisplayAddress ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => mapAddress && openGoogleMaps(mapAddress)}
                style={styles.hostAddressContainer}
              >
                {mapDisplayName ? (
                  <Text style={styles.hostAddressTitle}>{mapDisplayName}</Text>
                ) : null}
                {mapDisplayAddress ? (
                  <Text style={styles.hostAddressSubtitle}>{mapDisplayAddress}</Text>
                ) : null}
              </TouchableOpacity>
            ) : (
              <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
                Address unavailable
              </Text>
            )}
            <View style={styles.divider} />
          </>
        )}
        {showOnlineSection && (
          <>
            <SectionTitle
              title="Join Online"
              note="This session is available in person and online."
              showTooltip={isHybridSession}
            />
            <View style={styles.onlineRow}>
              <Ionicons
                name="videocam-outline"
                size={20}
                color={themeVariables.primaryColor}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.headerInfoText,
                  { color: themeVariables.primaryColor, textDecorationLine: 'underline' },
                ]}
                onPress={() => resolvedOnlineLink && Linking.openURL(resolvedOnlineLink)}
              >
                Tap to join the online session
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        )}
        {!showMapSection && !showOnlineSection && (
          <>
            <Text style={styles.mapTitle}>Location</Text>
            <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
              Location details will be shared soon.
            </Text>
            <View style={styles.divider} />
          </>
        )}


        {/* Details grid */}
        <CardContent style={styles.cardContent}>
        {/* Upcoming Sessions Carousel */}

          {/* Activity Guidelines Section */}
          {activity.guidelines ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Activity Guidelines</Text>
              <Text style={styles.guidelinesText}>{activity.guidelines}</Text>
            </View>
          ) : null}

          {/* Forms Section */}
          {Array.isArray(activity.forms) && activity.forms.length > 0 ? (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Forms</Text>
              {activity.forms.map((form, idx) => (
                <TouchableOpacity
                  key={form._id || idx}
                  onPress={() => Linking.openURL(form.url)}
                  style={styles.formLink}
                >
                  <Text style={styles.formLinkText}>{form.name || form.title || `Form ${idx + 1}`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

        </CardContent>

      </View>

      {/* Facilitators Modal */}
      <BadgeModal
        visible={facilitatorsModalVisible}
        onClose={() => setFacilitatorsModalVisible(false)}
        list={facilitators}
        title="Facilitators"
      />

      {/* Participants Modal */}
      <BadgeModal
        visible={participantsModalVisible}
        onClose={() => setParticipantsModalVisible(false)}
        list={participants}
        title="Participants"
      />
    </Card>

    <View style={styles.footerContainer}>
      <Image
        source={require('../assets/appstore.png')}
        style={styles.footerLogo}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Liquid Spirit"
      />
      <Text style={styles.footerText}>Liquid Spirit</Text>
    </View>
    </>
  );
};

/* ───────────── Badge Modal Component ──────────────────────────────
   This modal displays detailed info (name and certifications) for each user.
──────────────────────────────────────────────────────────────────────── */
const BadgeModal = ({ visible, onClose, list, title }) => {
  const navigation = useNavigation();
  return (
  <Modal visible={visible} animationType="slide" transparent>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView contentContainerStyle={styles.modalList}>
          {list.map((item, idx) => {
            const key = item?.details?._id || item?._id || idx;
            const user = item.details || item;
            const certs = item.certifications;
            return (
              <TouchableOpacity
                key={key}
                style={styles.modalBadgeWrap}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PublicUserProfile', { userId: user._id })}
              >
                <UserBadge user={user} userCertifications={certs} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          onPress={onClose}
          style={styles.modalCloseButton}
          activeOpacity={0.8}
        >
          <Text style={styles.modalCloseText}>Close</Text>
        </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
  );
};

/* ───────────── Styles ───────────────────────────────────────────── */
const styles = StyleSheet.create({
  // Primary scroll container style for full-screen background
  container: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  scroll: {
    backgroundColor: 'transparent',
    flexGrow: 1,
    // Offset content so card’s top corners are hidden behind header
    paddingBottom: 30,
  },
  // Wrapper for preload content with loading overlay
  loadingWrapper: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor,
  },
  // Semi-transparent overlay with spinner
  loadingOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    minHeight: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
  },
  errorText: { color: 'red', fontSize: 16 },
  noActivityText: { color: '#666', fontSize: 18 },

  card: {
    width: '100%',
    backgroundColor: 'transparent',
    elevation: 0,
    margin: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  banner: { width: '100%', height: 300, borderRadius: 0 },
  overlayCard: {
    width: '100%',
    marginTop: -40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  titleBlock: { fontWeight: 'bold', alignItems: 'center' },
  // Overrides for CardTitle text
  cardTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  cardSubtitleText: {
    fontSize: 20,
    color: '#444',
    textAlign: 'center',
  },

  /* facts */
  factRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 14,
  },
  factBox: { flex: 1, alignItems: 'center' },
  factLabel: { fontSize: 11, color: '#666', marginTop: 4, textAlign: 'center', width: Platform.select({ android: 150 })},
  factValue: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: Platform.select({ android: 150 }),
  },
  linkText: {
    color: themeVariables.primaryColor,
    textDecorationLine: 'underline',
  },

  /* details grid */
  cardContent: { paddingTop: 8, marginHorizontal: -15 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 14,
  },
  detailCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  detailIcon: { marginBottom: 6 },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
    width: Platform.select({ android: 65 }),
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312783',
    marginBottom: 4,
    textAlign: 'center',
    width: Platform.select({ android: 65 }),
  },
  detailSub: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  /* Section styles for Facilitators and Participants */
  sectionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: Platform.select({ android: 150 }),
  },
  avatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    // Adjust size of avatars as needed
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },

  /* Modal styles */
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeVariables.whiteColor,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: themeVariables.blackColor,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  modalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  modalDetails: {
    flex: 1,
  },
  modalName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  modalCerts: {
    fontSize: 14,
    color: '#666',
  },
  modalCloseButton: {
    padding: 12,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
    fontSize: 16,
  },
  /* Header Info below title */
  headerInfoContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  headerInfoText: {
    fontSize: 16,
    color: '#666',
  },
  carouselTitle: {
    color: themeVariables.blackColor,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 14,
  },
  carouselContent: {
    paddingLeft: 4,
  },
  sessionCard: {
    backgroundColor: themeVariables.whiteColor,
    padding: 8,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  sessionCardDate: {
    fontSize: 14,
    fontWeight: '500',
    color: themeVariables.primaryColor,
    marginBottom: 4,
    textAlign: 'left',
  },
  sessionCardTime: {
    fontSize: 12,
    color: '#666',
  },
  // Session status chip at top right
  sessionStatusChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sessionStatusText: {
    color: themeVariables.whiteColor,
    fontSize: 10,
    fontWeight: '600',
  },
  // Info row for facilitators/participants
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  sessionSection: {
    flex: 1,
    alignItems: 'center',
  },
  sessionSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginBottom: 4,
    textAlign: 'center',
  },
  sessionInfoText: {
    fontSize: 12,
    color: '#666',
  },
  /* Combined Facilitators/Participants styles */
  sectionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 14,
    overflow: 'hidden',
  },
  // Divider line
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  // (Deprecated) Map container, no longer used; replaced by mapWrapper
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
  },
  // Wrapper for MapView with 20px corner radius on all corners
  mapWrapper: {
    width: '100%',
    height: 300,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    marginBottom: 8,
  },
  // Loader area matching mapWrapper dimensions
  mapLoader: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAddressContainer: {
    alignSelf: 'flex-start',
    marginVertical: 12,
  },
  hostAddressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 4,
  },
  hostAddressSubtitle: {
    fontSize: 14,
    color: themeVariables.textColor || '#555',
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  // Row for online link section
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginVertical: 12,
  },
  titleWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  tooltipIconTarget: {
    padding: 6,
    marginLeft: 6,
  },
  tooltipBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tooltipPopoverText: {
    fontSize: 12,
    color: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  sideSection: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#ddd',
  },
  /* New styles for Upcoming Sessions layout */
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  sessionStatusInline: {
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sessionStatusInlineText: {
    color: themeVariables.whiteColor,
    fontSize: 12,
    fontWeight: '600',
  },
  userListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 6,
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  extraCount: {
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: Platform.select({ android: 40 }),
  },
  /* Modal badge list layout */
  modalList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  modalBadgeWrap: {
    width: 100,
    alignItems: 'center',
    margin: 8,
  },

  /* CTA */
  ctaButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
    marginTop: 6,
  },
  ctaText: { fontSize: 14, fontWeight: '600' },
  /* Request Join button under sections */
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: themeVariables.primaryColor,
    marginTop: 8,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.whiteColor,
    marginLeft: 6,
  },

  /* Activity Guidelines & Forms */
  guidelinesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  curriculumBox: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: themeVariables.primaryColor + '0D',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  curriculumRowContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginVertical: 6,
  },
  curriculumLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.textColor || '#333',
    width: 80,
  },
  curriculumValue: {
    flex: 1,
    fontSize: 14,
    color: themeVariables.textColor || '#444',
    marginLeft: 16,
  },
  curriculumDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginVertical: 6,
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 36,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  footerLogo: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#999',
  },
  formLink: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  formLinkText: {
    fontSize: 14,
    color: themeVariables.primaryColor,
    textDecorationLine: 'underline',
  },
  /* Status chip in top-right corner */
  statusChip: {
    position: 'absolute',
    top: 48,
    right: 20,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  statusChipText: {
    color: themeVariables.whiteColor,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    width: Platform.select({ android: 100 }),
  },
  // Custom back button overlay
});
