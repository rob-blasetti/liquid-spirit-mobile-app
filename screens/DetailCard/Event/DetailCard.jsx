import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardTitle } from '../../../components/Card';
import CardContainer from '../common/CardContainer';
import sectionBaseStyles from '../common/sectionBaseStyles';
import EventAttendeesModal from './components/EventAttendeesModal';
import EventOversightBodyModal from './components/EventOversightBodyModal';
import HostLocationSection from './sections/HostLocationSection';
import HostsSection from './sections/HostsSection';
import AttendanceSection from './sections/AttendanceSection';
import MaterialsSection from './sections/MaterialsSection';
import DetailSection from '../common/DetailSection';

import SwipeToCloseScrollView from '../../../components/SwipeToCloseScrollView';
import { IMAGE_BANNER_HEIGHT } from '../../../components/ImageBanner';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../../styles/theme';
import { fetchEventDetails, joinEvent, addEventMaterials, addEventHostRequest, addEventHost } from '../../../services/EventService';
import { getMemberList } from '../../../services/UserService';
import { DocumentPicker, types as documentTypes } from '@react-native-documents/picker';
// Allowed document types for materials
const allowedMaterialTypes = [
  documentTypes.pdf,
  documentTypes.doc,
  documentTypes.docx,
  documentTypes.xls,
  documentTypes.xlsx,
  documentTypes.ppt,
  documentTypes.pptx,
  documentTypes.csv,
  documentTypes.plainText,
];
import resolveImageSource from '../../../utils/imageSource';
import UserBadgeCell from '../../../components/UserBadgeCell';
import { fetchUserBodyByEventType } from '../../../services/UserBodyService';
import { UserContext } from '../../../contexts/UserContext';
import { CommunityContext } from '../../../contexts/CommunityContext';
import { shareContent } from '../../../utils/shareContent';
import FooterBrand from '../common/FooterBrand';
import useGoogleMaps from '../../../hooks/useGoogleMaps';
import useDetailCardHeader from '../common/useDetailCardHeader';
import {
  detailCardOverlay,
  detailCardTitle,
  detailCardSubtitle,
  detailCardContent,
} from '../common/detailCardLayout';
import { getDisplayAddress } from '../Activity/utils/locationUtils';
import useChatStarter from '../common/useChatStarter';
import { buildMapRegion } from '../common/mapRegion';
import debugLog from '../../../utils/debugLog';
const HEADER_OFFSET = 0;
const TAB_BAR_HEIGHT = 80;

const { height: windowHeight } = Dimensions.get('window');

// Get abbreviated weekday name, e.g. "Wed"
const getDayName = d => d.toLocaleDateString(undefined, { weekday: 'short' });
// Format day and month with full month name, e.g. "30 July"
const getDayMonthName = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
// Parse time strings (ISO datetime or HH:mm) into a localized time string
const parseTime = timeStr => {
  const dt = new Date(timeStr);
  if (!isNaN(dt.getTime())) {
    return dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  return new Date(1970, 0, 1, hour, minute).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const coalesceString = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return '';
};

const formatEventAddress = address => {
  if (typeof address === 'string') return address.trim();
  if (!address || typeof address !== 'object') return '';

  const fallbackParts = [
    address.streetAddress,
    address.street,
    address.line1,
    address.suburb,
    address.city,
    address.state,
    address.postalCode,
    address.zip,
    address.country,
  ]
    .map(part => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(', ');

  return coalesceString(
    getDisplayAddress({ sessionAddress: address }),
    fallbackParts,
    address.address,
    address.formatted,
    address.formattedAddress,
  );
};

const normalizeEntityId = value =>
  value === undefined || value === null ? '' : String(value).trim();

const resolveAttendeeId = attendee => {
  const details = attendee?.details || attendee?.user || attendee;
  return (
    normalizeEntityId(attendee?.refId) ||
    normalizeEntityId(attendee?._id) ||
    normalizeEntityId(attendee?.id) ||
    normalizeEntityId(details?._id) ||
    normalizeEntityId(details?.id)
  );
};

const normalizePermissionKey = value =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const getOversightConfig = eventType => {
  switch (String(eventType || '').trim()) {
    case 'Feast':
      return {
        name: 'Feast Committee',
        membershipTokens: ['feastcommittee', 'feast'],
      };
    case 'Holy Day':
      return {
        name: 'Holy Days Committee',
        membershipTokens: ['holydayscommittee', 'holydays', 'holyday', 'holy'],
      };
    case 'Admin':
    case 'Community':
    default:
      return {
        name: 'Local Spiritual Assembly',
        membershipTokens: ['localspiritualassembly', 'assembly', 'lsa'],
      };
  }
};

const EventDetailCard = ({ route }) => {
  // Enable swipe-down to dismiss
  const navigation = useNavigation();
  const { top: safeAreaTop, bottom: safeAreaBottom } = useSafeAreaInsets();
  const { eventPreload, oversightMembersPreload, eventId } = route.params;
  const [event, setEvent] = useState(eventPreload || null);
  const [loading, setLoading] = useState(!eventPreload);
  const [error, setError] = useState(null);
  const [redirected, setRedirected] = useState(false);
  const [chatCommitteeMembers, setChatCommitteeMembers] = useState(oversightMembersPreload || []);
  const [didFinishEntryTransition, setDidFinishEntryTransition] = useState(!eventPreload);
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Events');
  }, [navigation]);
  const handleShare = useCallback(() => {
    const id = event?._id || eventId;
    if (!id) return;
    const url = `https://www.liquidspirit.org/events/${id}`;
    const title = event?.title || 'Liquid Spirit Event';
    const message = `Check out this event on Liquid Spirit \uD83D\uDC47\n${url}`;
    shareContent({
      url,
      message,
      title,
      alertMessage: 'Something went wrong while trying to share the event.',
    });
  }, [event, eventId]);
  const { user, token, isTokenExpired, refreshSession, storageLoaded } = useContext(UserContext);
  const [optimisticJoin, setOptimisticJoin] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const didRefreshRef = useRef(false);
  const refreshScopeRef = useRef(null);
  const { startChat, startingChat } = useChatStarter({
    context: 'event',
    entity: event || eventPreload || {},
    entityId: eventId,
    token,
    user,
    navigation,
    committeeMembers: chatCommitteeMembers,
  });

  useDetailCardHeader({
    navigation,
    onBack: handleBack,
    onShare: handleShare,
    onChat: startChat,
    chatLoading: startingChat,
    showChat: false,
  });

  useEffect(() => {
    if (!eventPreload) {
      setDidFinishEntryTransition(true);
      return;
    }

    setDidFinishEntryTransition(false);
    const unsubscribe = navigation.addListener('transitionEnd', (evt) => {
      if (evt?.data?.closing) return;
      setDidFinishEntryTransition(true);
    });
    return unsubscribe;
  }, [navigation, eventPreload]);

  const normalizeEventId = (raw) => {
    const str = String(raw || '').trim();
    const match = str.match(/[a-fA-F0-9]{24}/);
    return match ? match[0] : null;
  };

  // Fetch full event details with auth guarding and one-time refresh on 401
  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (eventPreload) {
        setEvent(prev => {
          if (!prev) return eventPreload;
          if (prev === eventPreload) return prev;
          if (prev._id && eventPreload._id && prev._id !== eventPreload._id) {
            return eventPreload;
          }
          if (!didFinishEntryTransition) return prev;
          return { ...prev, ...eventPreload };
        });
        setLoading(false);
        if (!didFinishEntryTransition) return;
      }

      const id = normalizeEventId(eventId || eventPreload?._id);
      if (!id) {
        setError('Invalid event link');
        setErrorStatus('invalid_id');
        setLoading(false);
        return;
      }

      if (refreshScopeRef.current !== id) {
        refreshScopeRef.current = id;
        didRefreshRef.current = false;
      }

      if (!storageLoaded) return; // wait for token from storage

      // ensure we have a valid token, try a one-time refresh if needed
      if (!token || isTokenExpired(token)) {
        if (!didRefreshRef.current) {
          didRefreshRef.current = true;
          try { await refreshSession(); } catch (_) {}
          return; // wait for token update, effect will rerun
        } else {
          setError('Please log in to view this event.');
          setErrorStatus(401);
          if (!eventPreload) {
            setLoading(false);
          }
          return;
        }
      }

      const useFullScreenSpinner = !eventPreload;
      if (useFullScreenSpinner) {
        setLoading(true);
      }

      try {
        const data = await fetchEventDetails(id, token);
        if (!isMounted) return;
        if (!data) {
          setError('Event not found');
          setErrorStatus(404);
        } else {
          setEvent(data);
          setError(null);
          setErrorStatus(null);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.status === 401 && !didRefreshRef.current) {
          didRefreshRef.current = true;
          try { await refreshSession(); } catch (_) {}
          // will rerun with new token
          return;
        }
        setError(err?.message || 'Failed to load event details');
        setErrorStatus(err?.status || 'unknown');
      } finally {
        if (!isMounted) return;
        if (useFullScreenSpinner) {
          setLoading(false);
        }
      }
    };

    run();
    return () => { isMounted = false; };
  }, [didFinishEntryTransition, eventId, eventPreload, isTokenExpired, refreshSession, storageLoaded, token]);
  // Redirect unauthenticated or missing events to appropriate screens
  useEffect(() => {
    if (redirected || loading) return;
    if (errorStatus === 404) {
      navigation.replace('Events', { bannerMessage: 'Sorry, that event no longer exists.' });
      setRedirected(true);
    } else if (errorStatus === 401) {
      navigation.replace('Login', { bannerMessage: 'Please log in to view this event.' });
      setRedirected(true);
    } else if (errorStatus === 'invalid_id') {
      navigation.replace('Events', { bannerMessage: 'Invalid event link.' });
      setRedirected(true);
    }
  }, [redirected, loading, errorStatus, navigation]);
  const scrollContentStyle = useMemo(
    () => ({
      paddingTop: 0,
      paddingBottom: Math.max(24, safeAreaBottom + TAB_BAR_HEIGHT),
    }),
    [safeAreaBottom],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left','right','bottom']} />
    );
  }
  // If error or no event data, redirect is handled via effect; render nothing
  if (error || !event) {
    return null;
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['left','right','bottom']}>
      {/* Use dark-content for status bar icons */}
      <StatusBar animated translucent backgroundColor="transparent" barStyle="dark-content" />
      <SwipeToCloseScrollView
        style={styles.scrollView}
        contentContainerStyle={scrollContentStyle}
        overScrollMode="always"
        scrollEventThrottle={16}
        // swipe down past half the header offset to go back
        threshold={HEADER_OFFSET / 2}
      >
        <EventCardBody
          event={event}
          setEvent={setEvent}
          userId={user?.id}
          token={token}
          topInset={safeAreaTop}
          optimisticJoin={optimisticJoin}
          setOptimisticJoin={setOptimisticJoin}
          oversightMembersPreload={oversightMembersPreload}
          onUpdateCommitteeMembers={setChatCommitteeMembers}
        />
      </SwipeToCloseScrollView>
    </SafeAreaView>
  );
};

const EventCardBody = ({
  event,
  setEvent,
  userId,
  token,
  topInset = 0,
  optimisticJoin,
  setOptimisticJoin,
  oversightMembersPreload,
  onUpdateCommitteeMembers,
}) => {
  const navigation = useNavigation();
  const rootNavigation =
    navigation.getParent?.()?.getParent?.() || navigation.getParent?.() || navigation;
  // Access current user and community from context for joining
  const { user } = useContext(UserContext);
  const { communityId, homeOverview } = useContext(CommunityContext);
  // Local state to track if a host request has been sent
  const hostRequestSent = useMemo(() => {
    if (!userId || !Array.isArray(event.hostRequests)) return false;
    return event.hostRequests.some(r => r.refId?.toString() === userId.toString());
  }, [event.hostRequests, userId]);

  // Admin: Add Host modal state and member search
  const [addHostModalVisible, setAddHostModalVisible] = useState(false);
  const [memberList, setMemberList] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  // Fetch community members when modal opens
  useEffect(() => {
    if (addHostModalVisible) {
      setMemberLoading(true);
      getMemberList(communityId)
        .then(data => {
          const members = Array.isArray(data) ? data : (data.data || []);
          setMemberList(members);
          setFilteredMembers(members);
        })
        .catch(err => {
          console.error('Error fetching members:', err);
          Alert.alert('Error', err.message || 'Failed to load members.');
        })
        .finally(() => setMemberLoading(false));
    }
  }, [addHostModalVisible, communityId]);

  // Filter member list based on search query
  const onMemberSearch = text => {
    setMemberSearchQuery(text);
    if (!text) {
      setFilteredMembers(memberList);
    } else {
      const lower = text.toLowerCase();
      setFilteredMembers(
        memberList.filter(m => {
          // Use fullName if provided, else fall back to first+last
          const nameStr = (m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim()).toLowerCase();
          return nameStr.includes(lower);
        })
      );
    }
  };

  // Select a member to become host
  const selectHostMember = async member => {
    try {
      const newHost = { refId: member._id, type: 'User' };
      await addEventHost(event._id, [newHost], token || '');
      const updatedEvent = await fetchEventDetails(event._id, token || '');
      setEvent(updatedEvent);
      // Notify with full name if available
      const displayName = member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name || member.email || 'Selected user';
      Alert.alert('Host added', `${displayName} has been added as host.`);
    } catch (err) {
      console.error('Error adding host:', err);
      Alert.alert('Error', err.message || 'Failed to add host.');
    } finally {
      setAddHostModalVisible(false);
      setMemberSearchQuery('');
      setMemberList([]);
      setFilteredMembers([]);
    }
  };
  // Destructure raw attendees from event; we'll enrich with full user data below
  const { imageUrl, title, eventType, date, startTime, endTime, venue,
    attendees: rawAttendees = [], hosts = [], materials = [] } = event;
  // Use the event payload's body membership flags together with the resolved oversight body.
  const userBodyMembership = useMemo(
    () => event.userBodyMembership || {},
    [event.userBodyMembership],
  );
  const oversightConfig = useMemo(
    () => getOversightConfig(eventType),
    [eventType],
  );
  const currentUserId = normalizeEntityId(user?.id || user?._id || userId);
  const dateObj = new Date(date);
  const dateMain = getDayName(dateObj);
  // Full month name, e.g. "30 July"
  const dateSubName = getDayMonthName(dateObj);
  const timeMain = startTime ? parseTime(startTime) : 'N/A';
  // Append hyphen before end time to indicate range
  const timeSub = endTime ? `- ${parseTime(endTime)}` : '';
  const venueName = coalesceString(
    Array.isArray(event.venues)
      ? event.venues
          .map(item =>
            typeof item === 'object'
              ? item?.name || item?.title || item?.label || item?.venueName
              : ''
          )
          .find(Boolean)
      : '',
    event.venueName,
    venue,
    event.address?.name,
  );
  const addressText = coalesceString(
    Array.isArray(event.venues)
      ? event.venues
          .map(item =>
            typeof item === 'object'
              ? formatEventAddress(item?.address || item?.location || item)
              : ''
          )
          .find(Boolean)
      : '',
    formatEventAddress(event.address),
    event.address?.address,
    event.location,
  );
  const fullAddr =
    venueName && addressText && venueName.toLowerCase() !== addressText.toLowerCase()
      ? `${venueName} - ${addressText}`
      : venueName || addressText || 'No location';
  const mapQuery = addressText || venueName || fullAddr;
  // Map region state for location map
  const [region, setRegion] = useState(null);
  const { openGoogleMaps } = useGoogleMaps();

  useEffect(() => {
    debugLog('[EventDetailMap] location inputs', {
      eventId: event?._id || event?.id || null,
      venueName,
      addressText,
      fullAddr,
      mapQuery,
      region,
    });
  }, [addressText, event?._id, event?.id, fullAddr, mapQuery, region, venueName]);

  useEffect(() => {
    if (!mapQuery || mapQuery === 'No location') {
      debugLog('[EventDetailMap] skipping geocode', {
        mapQuery,
      });
      setRegion(null);
      return;
    }

    setRegion(null);
    let cancelled = false;
    const q = encodeURIComponent(mapQuery);
    debugLog('[EventDetailMap] geocode start', {
      mapQuery,
      query: q,
    });
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`, {
      headers: {
        'User-Agent': 'LiquidSpiritApp/1.0 (info@liquidspirit.org)',
        'Accept-Language': 'en',
      },
    }).then(res => res.json())
      .then(results => {
        if (cancelled) return;
        debugLog('[EventDetailMap] geocode results', {
          mapQuery,
          resultCount: Array.isArray(results) ? results.length : 0,
          firstResult: Array.isArray(results) ? results[0] : null,
        });
        if (results && results.length > 0) {
          const { lat, lon } = results[0];
          const nextRegion = buildMapRegion({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          });
          if (nextRegion) {
            debugLog('[EventDetailMap] geocode resolved region', {
              mapQuery,
              nextRegion,
            });
            setRegion(nextRegion);
          }
        }
      })
      .catch(err => {
        debugLog('[EventDetailMap] geocode failed', {
          mapQuery,
          message: err?.message,
          name: err?.name,
        });
        console.warn('Geocode error', err);
      });
    return () => {
      cancelled = true;
      debugLog('[EventDetailMap] geocode cancelled', {
        mapQuery,
      });
    };
  }, [mapQuery]);
  const normalizedUserId = normalizeEntityId(userId);
  const baseAttendees = enrichedAttendees ?? rawAttendees;
  const userAlreadyInAttendees = baseAttendees.some(
    attendee => resolveAttendeeId(attendee) === normalizedUserId,
  );
  const optimisticAttendee = useMemo(() => {
    if (!normalizedUserId || !user) return null;

    return {
      _id: normalizedUserId,
      refId: normalizedUserId,
      type: user?.type || 'User',
      details: {
        ...user,
        _id: user?._id || normalizedUserId,
        id: user?.id || normalizedUserId,
      },
      certifications: user?.certifications,
    };
  }, [normalizedUserId, user]);
  const attendees = useMemo(() => {
    if (optimisticJoin && optimisticAttendee && !userAlreadyInAttendees) {
      return [optimisticAttendee, ...baseAttendees];
    }

    return baseAttendees;
  }, [baseAttendees, optimisticAttendee, optimisticJoin, userAlreadyInAttendees]);
  const hasJoined = optimisticJoin || userAlreadyInAttendees;

  const openMaps = useCallback(() => {
    debugLog('[EventDetailMap] open maps press', {
      mapQuery,
      fullAddr,
    });
    openGoogleMaps(mapQuery);
  }, [fullAddr, openGoogleMaps, mapQuery]);

  const openExpandedMap = useCallback(() => {
    if (!region) return;
    rootNavigation.navigate('MapPreviewScreen', {
      title: 'Host Address',
      fullAddress: fullAddr,
      region,
    });
  }, [fullAddr, region, rootNavigation]);

  const handleJoin = async () => {
    setOptimisticJoin(true);
    try {
      // Join the event and notify community
      await joinEvent(event._id, token || '', event.title, user, communityId);
      const updated = await fetchEventDetails(event._id, token || '');
      setEvent(updated);
    } catch (err) {
      setOptimisticJoin(false);
      console.error('Join event failed:', err);
      alert('Failed to join event');
    }
  };

  // Handle host request submission
  // Handle host request submission
  const handleRequestHost = async () => {
    try {
      // submit host request then re-fetch full event details to maintain consistent data shape
      await addEventHostRequest(token, event._id);
      const updatedEvent = await fetchEventDetails(event._id, token || '');
      setEvent(updatedEvent);
      Alert.alert('Request submitted', 'Your request to become a host has been submitted.');
    } catch (err) {
      console.error('Host request failed:', err);
      Alert.alert('Error', err.message || 'Failed to request host. Please try again.');
    }
  };
  // Handle direct host addition by admin
  // Handle removing a host by admin
  const handleRemoveHost = async host => {
    const hostId = host.refId || host._id;
    try {
      // Filter out the removed host and update server
      const remaining = hosts.filter(hh => (hh.refId || hh._id) !== hostId);
      const newHosts = remaining.map(hh => ({ refId: hh.refId || hh._id, type: hh.type }));
      await addEventHost(event._id, newHosts, token || '');
      const updated = await fetchEventDetails(event._id, token || '');
      setEvent(updated);
      Alert.alert('Host removed', 'Host successfully removed.');
    } catch (err) {
      console.error('Remove host failed:', err);
      Alert.alert('Error', err.message || 'Failed to remove host.');
    }
  };
  // Material picker
  const pickMaterial = async () => {
    // clear previous error
    setMaterialError(null);
    try {
      const results = await DocumentPicker.pick({
        type: allowedMaterialTypes,
        allowMultiSelection: false,
        copyTo: 'cachesDirectory',
      });
      const res = Array.isArray(results) ? results[0] : results;
      if (!res) {
        setMaterialError('No document selected.');
        return;
      }
      // auto-fill title from file name (without extension)
      let baseName = res.name || res.filename || '';
      const uri = res.uri || res.fileCopyUri || '';
      if (!baseName && uri) {
        const parts = uri.split('/');
        baseName = decodeURIComponent(parts[parts.length - 1] || '');
      }
      if (baseName.includes('.')) {
        baseName = baseName.substring(0, baseName.lastIndexOf('.'));
      }
      setNewMaterialTitle(baseName);
      setNewMaterialDoc({ ...res, uri });
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // user cancelled, do nothing
      } else {
        console.error('DocumentPicker error:', err);
        setMaterialError('Failed to pick document');
      }
    }
  };
  // Submit new material
  const submitMaterial = async () => {
    // validate inputs
    if (!newMaterialTitle || !newMaterialDoc) {
      setMaterialError('Please provide a title and select a file.');
      return;
    }
    setMaterialError(null);
    setUploadingMaterial(true);
    try {
      const updated = await addEventMaterials(event._id, newMaterialTitle, newMaterialDoc, token || '');
      setEvent(updated);
      // reset state and close modal
      setMaterialModalVisible(false);
      setNewMaterialTitle('');
      setNewMaterialDoc(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setMaterialError(err.message || 'Upload failed. Try again later.');
    } finally {
      setUploadingMaterial(false);
    }
  };

  const [attendeesModalVisible, setAttendeesModalVisible] = useState(false);
  const [oversightModalVisible, setOversightModalVisible] = useState(false);
  // State for enriched attendees: load full user data for each attendee
  const [enrichedAttendees] = useState(null);

  // State for oversight body members; initialize name based on eventType to avoid empty jump
  const defaultOversightName = oversightConfig.name;
  // Initialize with preloaded members if available to avoid loading jump
  const [oversightBody, setOversightBody] = useState({ name: defaultOversightName, members: oversightMembersPreload || [] });
  const [oversightLoading, setOversightLoading] = useState(!oversightMembersPreload);
  const communityName = useMemo(
    () =>
      user?.community?.name?.trim?.() ||
      homeOverview?.community?.name?.trim?.() ||
      (typeof event?.community === 'string' ? event.community.trim() : event?.community?.name?.trim?.()) ||
      '',
    [event?.community, homeOverview?.community?.name, user?.community?.name],
  );
  const oversightBodyDisplayName = useMemo(() => {
    const normalizedName = String(oversightBody.name || '')
      .trim()
      .toLowerCase();

    if (
      normalizedName === 'local spiritual assembly' &&
      communityName
    ) {
      return `The Local Spiritual Assembly of ${communityName}`;
    }

    return oversightBody.name;
  }, [communityName, oversightBody.name]);
  const isLocalSpiritualAssemblyOversight = useMemo(
    () =>
      String(oversightBody.name || '')
        .trim()
        .toLowerCase() === 'local spiritual assembly',
    [oversightBody.name],
  );
  const oversightModalMembers = useMemo(() => {
    if (
      isLocalSpiritualAssemblyOversight &&
      Array.isArray(homeOverview?.localSpiritualAssembly) &&
      homeOverview.localSpiritualAssembly.length > 0
    ) {
      return homeOverview.localSpiritualAssembly;
    }

    return oversightBody.members;
  }, [
    homeOverview?.localSpiritualAssembly,
    isLocalSpiritualAssemblyOversight,
    oversightBody.members,
  ]);
  const oversightModalTitle = isLocalSpiritualAssemblyOversight
    ? 'Your Local Spiritual Assembly'
    : oversightBodyDisplayName;
  const activePermissionKeys = useMemo(
    () =>
      Object.entries(userBodyMembership)
        .filter(([, value]) => value === true)
        .map(([key]) => normalizePermissionKey(key)),
    [userBodyMembership],
  );
  const hasExplicitAdminAccess = useMemo(
    () => activePermissionKeys.some(key => key.includes('admin')),
    [activePermissionKeys],
  );
  const hasMatchingBodyMembership = useMemo(
    () =>
      activePermissionKeys.some(key =>
        oversightConfig.membershipTokens.some(token => key.includes(token))
      ),
    [activePermissionKeys, oversightConfig.membershipTokens],
  );
  const isCurrentUserInOversightBody = useMemo(
    () =>
      Boolean(currentUserId) &&
      oversightModalMembers.some(member => resolveAttendeeId(member) === currentUserId),
    [currentUserId, oversightModalMembers],
  );
  const canManageOversightEvent =
    hasExplicitAdminAccess || hasMatchingBodyMembership || isCurrentUserInOversightBody;
  const oversightModalHeaderContent = communityName ? (
    <View style={styles.communityChip}>
      <Ionicons
        name="leaf-outline"
        size={12}
        style={styles.communityChipIcon}
      />
      <Text style={styles.communityChipText} numberOfLines={1}>
        {communityName}
      </Text>
    </View>
  ) : null;

  useEffect(() => {
    if (typeof onUpdateCommitteeMembers === 'function') {
      onUpdateCommitteeMembers(oversightBody.members || []);
    }
  }, [oversightBody.members, onUpdateCommitteeMembers]);

  // Fetch appropriate body members based on eventType
  useEffect(() => {
    let isMounted = true;
    // Skip fetch if preloaded
    if (oversightMembersPreload) {
      return () => { isMounted = false; };
    }
    const loadBody = async () => {
      try {
        setOversightLoading(true);
        const members = await fetchUserBodyByEventType(eventType, token);
        if (isMounted) {
          setOversightBody({ name: oversightConfig.name, members });
          setOversightLoading(false);
        }
      } catch (err) {
        console.error('Failed to load oversight body members', err);
        if (isMounted) setOversightLoading(false);
      }
    };
    loadBody();
    return () => { isMounted = false; };
  }, [eventType, oversightConfig.name, oversightMembersPreload, token]);

  // Material upload modal state
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialDoc, setNewMaterialDoc] = useState(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  // Error message for material upload issues
  const [materialError, setMaterialError] = useState(null);
  const bannerPlaceholderSource = resolveImageSource('/img/events/Event_Placeholder.png', {
    priority: 'high',
  });
  const bannerImageSource = resolveImageSource(imageUrl, {
    priority: 'high',
    fallback: '/img/events/Event_Placeholder.png',
  });

  return (
    <>
    <CardContainer
      imageUrl={bannerImageSource}
      bannerDefaultImageSource={bannerPlaceholderSource}
      cardStyle={styles.card}
      bannerStyle={styles.banner}
      topInset={topInset}
    >
      <View style={styles.overlayCard}>
        {hasJoined && (
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>Attending</Text>
          </View>
        )}
        <CardTitle
          title={title}
          subtitle={eventType || ''}
          style={styles.titleBlock}
          titleStyle={styles.cardTitleText}
          subtitleStyle={styles.cardSubtitleText}
        />
        {/* Date & Time */}
        <View style={styles.headerInfoContainer}>
          <Text style={styles.headerInfoText}>
            {dateMain} ‧ {dateSubName} ‧ {timeMain} {timeSub}
          </Text>
        </View>
        <View style={styles.divider} />

        <HostLocationSection
          region={region}
          fullAddress={fullAddr}
          venueName={venueName}
          addressText={addressText}
          styles={styles}
          onOpenMaps={openMaps}
          onExpandMap={openExpandedMap}
        />

        {/* Host Section */}
        <HostsSection
          hosts={hosts}
          isAdmin={canManageOversightEvent}
          onAddHost={canManageOversightEvent ? () => setAddHostModalVisible(true) : undefined}
          onRemoveHost={handleRemoveHost}
          hostRequestSent={hostRequestSent}
          onRequestHost={handleRequestHost}
          styles={styles}
        />
        <MaterialsSection
          materials={materials}
          isAdmin={canManageOversightEvent}
          onAddMaterial={canManageOversightEvent ? () => setMaterialModalVisible(true) : undefined}
          styles={styles}
        />
        <DetailSection
          title="Oversight Body"
          titleStyle={styles.mapTitle}
          bodyStyle={styles.oversightCard}>
          <Text style={styles.oversightBodyName}>
            {oversightBodyDisplayName}
          </Text>
          {oversightLoading ? (
            <ActivityIndicator size="small" color={themeVariables.primaryColor} />
          ) : oversightBody.members.length > 0 ? (
            <>
              <View style={styles.userListContainer}>
                {oversightBody.members.slice(0, 4).map((member, idx) => {
                  const badgeUser = member.details || member.user || member;
                  return (
                    <View
                      key={member._id || member.id || badgeUser?._id || badgeUser?.id || idx}
                      style={styles.userListItem}
                    >
                      <UserBadgeCell
                        user={badgeUser}
                        type={badgeUser?.type || member.type}
                        userCertifications={member.certifications || badgeUser?.certifications}
                        contained
                      />
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                style={styles.seeMoreTrigger}
                onPress={() => setOversightModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="ellipsis-horizontal-circle-outline"
                  size={18}
                  style={styles.seeMoreTriggerIcon}
                />
                <Text style={styles.seeMoreTriggerText}>See more</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.headerInfoText}>No oversight available</Text>
          )}
        </DetailSection>
        <AttendanceSection
          attendees={attendees}
          styles={styles}
          hasJoined={hasJoined}
          onJoin={handleJoin}
          onShowAll={() => setAttendeesModalVisible(true)}
        />
      </View>
      <EventAttendeesModal
        visible={attendeesModalVisible}
        onClose={() => setAttendeesModalVisible(false)}
        attendees={attendees}
      />
      <EventOversightBodyModal
        visible={oversightModalVisible}
        onClose={() => setOversightModalVisible(false)}
        title={oversightModalTitle}
        members={oversightModalMembers}
        headerContent={oversightModalHeaderContent}
      />
      {/* Add Material Modal */}
      <Modal
        visible={materialModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMaterialModalVisible(false)}
      >
        <View style={styles.modalCenterContainer}>
          <View style={styles.modalCenterContent}>
            <Text style={styles.modalTitle}>Add Material</Text>
            <TextInput
              style={styles.materialModalInput}
              placeholder="Title"
              value={newMaterialTitle}
              onChangeText={setNewMaterialTitle}
            />
            <TouchableOpacity
              style={[styles.uploadButton, uploadingMaterial && { opacity: 0.5 }]}
              onPress={pickMaterial}
              disabled={uploadingMaterial}
            >
              <Ionicons name="document-outline" size={40} color={themeVariables.primaryColor} />
              <Text style={styles.uploadButtonText}>Upload file</Text>
            </TouchableOpacity>
            {newMaterialDoc && !uploadingMaterial && (
              <Text style={styles.fileNameText}>
                {newMaterialDoc.name || newMaterialDoc.filename}
              </Text>
            )}
            {uploadingMaterial ? (
              <ActivityIndicator size="large" color={themeVariables.primaryColor} />
            ) : (
              <>
                {materialError && (
                  <Text style={styles.errorText}>{materialError}</Text>
                )}
                <View style={styles.materialModalButtonsRow}>
                  <TouchableOpacity
                    style={styles.materialModalButton}
                    onPress={() => {
                      setMaterialModalVisible(false);
                      setMaterialError(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.materialModalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.materialModalButton, !newMaterialDoc && { opacity: 0.5 }]}
                    onPress={submitMaterial}
                    activeOpacity={0.8}
                    disabled={!newMaterialDoc}
                  >
                    <Text style={styles.materialModalButtonText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Add Host Modal */}
      <Modal
        visible={addHostModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddHostModalVisible(false)}
      >
        <View style={styles.modalCenterContainer}>
          <View style={styles.modalCenterContent}>
            <Text style={styles.modalTitle}>Select Host</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Search users..."
              value={memberSearchQuery}
              onChangeText={onMemberSearch}
            />
            {memberLoading ? (
              <ActivityIndicator size="large" color={themeVariables.primaryColor} />
            ) : (
              <ScrollView style={styles.memberList}>
                {filteredMembers.map(member => (
                  <TouchableOpacity
                    key={member._id}
                    style={styles.memberItem}
                    onPress={() => selectHostMember(member)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.memberName} numberOfLines={1}>
                      {/* Display fullName if available, else fallback */}
                      {member.fullName || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.name || member.email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setAddHostModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CardContainer>
    <FooterBrand containerStyle={styles.footerContainer} />
    </>
  );
};

const styles = StyleSheet.create({
  // Modal for adding host
  modalCenterContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCenterContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: themeVariables.blackColor,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 12,
  },
  memberList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  memberItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    marginLeft: 12,
  },
  modalButtonText: {
    fontSize: 16,
    color: themeVariables.primaryColor,
  },
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  refreshIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
  },
  headerInfoContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  headerInfoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 14,
  },
  divider: {
    ...sectionBaseStyles.sectionDivider,
  },
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
  map: {
    width: '100%',
    height: '100%',
  },
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
  oversightCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  oversightBodyName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 12,
  },
  communityChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF7F0',
    borderWidth: 1,
    borderColor: '#D6EBD9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    maxWidth: '100%',
  },
  communityChipIcon: {
    color: '#2F7A46',
    marginRight: 6,
  },
  communityChipText: {
    color: '#2F7A46',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginVertical: 12,
    borderRadius: 22,
    backgroundColor: '#F7F7FA',
    borderWidth: 1,
    borderColor: '#E6E7EE',
  },
  emptyStateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF0FF',
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
  mapFallback: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f8',
    paddingHorizontal: 16,
  },
  mapFallbackText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.textColor || '#555',
    textAlign: 'center',
  },
  mapFallbackSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
  },
  cardTitleText: { ...detailCardTitle },
  cardSubtitleText: { ...detailCardSubtitle },
  mapTitle: {
    ...sectionBaseStyles.sectionTitle,
  },
  centered: {
    flex: 1,
    minHeight: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
  },
  card: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  banner: {
    width: '100%',
    height: IMAGE_BANNER_HEIGHT,
    borderRadius: 0,
    backgroundColor: '#DDE5F4',
  },
  overlayCard: {
    ...detailCardOverlay,
  },
  titleBlock: { paddingTop: 0 },
  factBox: { flex: 1, alignItems: 'center' },
  factLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  factValue: { fontSize: 14, fontWeight: '600', color: themeVariables.blackColor },
  linkText: {
    color: themeVariables.primaryColor,
    textDecorationLine: 'underline',
  },
  cardContent: { ...detailCardContent },
  detailCell: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  detailIcon: { marginBottom: 6 },
  detailLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
    width: Platform.select({ android: 50 }),
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312783',
    marginBottom: 4,
    textAlign: 'center',
    width: Platform.select({ android: 140 }),
  },
  detailSub: { fontSize: 12, color: '#666', textAlign: 'center' },
  avatarsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  userListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  userListItem: {
    width: '48%',
    marginBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#fff' },
  extraCount: { backgroundColor: '#666', justifyContent: 'center', alignItems: 'center' },
  extraCountText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalSheetContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheetContent: {
    backgroundColor: themeVariables.whiteColor,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  modalBadgeWrap: { width: 100, alignItems: 'center', margin: 8 },
  modalCloseButton:{
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  requestButton:{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: themeVariables.primaryColor,
    alignSelf: 'flex-start',
  },
  requestButtonText:{
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.whiteColor,
    marginLeft: 6,
  },
  attendeesCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  attendeesHeaderBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  attendeesHeaderBadgeJoined: {
    backgroundColor: '#E6F6EC',
  },
  attendeesHeaderBadgeOpen: {
    backgroundColor: '#ECECFF',
  },
  attendeesHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  attendeesHeaderBadgeTextJoined: {
    color: '#18794E',
  },
  attendeesHeaderBadgeTextOpen: {
    color: themeVariables.primaryColor,
  },
  attendeesSummaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: themeVariables.textColor || '#444',
    marginBottom: 14,
  },
  attendeeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  attendeeItem: {
    width: '48%',
    marginBottom: 12,
  },
  eventAttendanceCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#F6F7FB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  eventAttendanceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  eventAttendanceBadge_success: {
    backgroundColor: '#E6F6EC',
  },
  eventAttendanceBadge_neutral: {
    backgroundColor: '#ECECFF',
  },
  eventAttendanceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventAttendanceBadgeText_success: {
    color: '#18794E',
  },
  eventAttendanceBadgeText_neutral: {
    color: '#312783',
  },
  eventAttendanceMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: themeVariables.textColor || '#444',
    marginBottom: 14,
  },
  eventAttendanceDualRow: {
    gap: 12,
    marginBottom: 14,
  },
  eventAttendanceCountBox: {
    borderRadius: 14,
    backgroundColor: themeVariables.whiteColor,
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  eventAttendanceLifecycleBox: {
    borderRadius: 14,
    backgroundColor: themeVariables.whiteColor,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eventAttendanceMiniBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  eventAttendanceMiniBadge_success: {
    backgroundColor: '#E6F6EC',
  },
  eventAttendanceMiniBadge_warning: {
    backgroundColor: '#FFF4D6',
  },
  eventAttendanceMiniBadge_muted: {
    backgroundColor: '#EEEEEE',
  },
  eventAttendanceMiniBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventAttendanceMiniBadgeText_success: {
    color: '#18794E',
  },
  eventAttendanceMiniBadgeText_warning: {
    color: '#9A6700',
  },
  eventAttendanceMiniBadgeText_muted: {
    color: '#666666',
  },
  eventAttendanceCountValue: {
    fontSize: 22,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 4,
  },
  eventAttendanceCountLabel: {
    fontSize: 12,
    color: '#666',
  },
  eventAttendanceLifecycleMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: themeVariables.textColor || '#444',
  },
  eventAttendanceLifecycleCapacity: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  eventAttendanceAction: {
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eventAttendanceActionPrimary: {
    backgroundColor: themeVariables.primaryColor,
  },
  eventAttendanceActionMuted: {
    backgroundColor: '#ECECEC',
  },
  eventAttendanceActionText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  eventAttendanceActionTextPrimary: {
    color: themeVariables.whiteColor,
  },
  eventAttendanceActionTextMuted: {
    color: '#777',
  },
  eventLogisticsCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#F6F7FB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  eventLogisticsRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  eventLogisticsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  eventLogisticsValue: {
    fontSize: 15,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  eventOverviewCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#F6F7FB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  eventOverviewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 4,
  },
  eventOverviewSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.primaryColor,
    marginBottom: 8,
  },
  eventOverviewMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventOverviewMetaText: {
    fontSize: 13,
    color: '#666',
  },
  eventOverviewMetaDot: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 6,
  },
  eventOverviewSummary: {
    fontSize: 14,
    lineHeight: 20,
    color: themeVariables.textColor || '#444',
  },
  eventOverviewPlaceholder: {
    fontSize: 14,
    lineHeight: 20,
    color: '#777',
  },
  seeMoreTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  seeMoreTriggerIcon: {
    color: themeVariables.primaryColor,
    marginRight: 6,
  },
  seeMoreTriggerText: {
    color: themeVariables.primaryColor,
    fontSize: 14,
    fontWeight: '700',
  },
  addMaterialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  addMaterialButtonText: {
    color: themeVariables.whiteColor,
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 14,
  },
  materialModalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  modalFilePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  modalFilePickerText: {
    fontSize: 16,
    color: themeVariables.blackColor,
  },
  materialModalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  materialModalButton: {
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  materialModalButtonText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
  footerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 36,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  materialTile: {
    flexBasis: '30%',
    aspectRatio: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  noDataText:{
    fontSize: 16,
    color:'#666',
    textAlign: 'left',
  },
  noDataSpacing: {
    marginBottom: 12,
  },
  statusChip:{
    position:'absolute',
    top:16,
    right:12,
    backgroundColor:themeVariables.primaryColor,
    borderRadius:12,
    paddingHorizontal:8,
    paddingVertical:4,
    zIndex:10,
  },
  statusChipText:{
    color:themeVariables.whiteColor,
    fontSize:12,
    fontWeight:'600',
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    borderStyle: 'dotted',
    borderRadius: 12,
    backgroundColor: themeVariables.whiteColor,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadButtonText: {
    color: themeVariables.primaryColor,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  // Display selected file name in modal
  fileNameText: {
    fontSize: 14,
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  // Display error messages in modal
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    color: 'red',
    textAlign: 'center',
  },
});

export default EventDetailCard;
