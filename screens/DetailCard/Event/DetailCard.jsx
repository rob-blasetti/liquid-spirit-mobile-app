import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardTitle, CardContent } from '../../../components/Card';
import FastImage from 'react-native-fast-image';
import CardContainer from '../common/CardContainer';
import SectionTitle from '../common/SectionTitle';
import sectionBaseStyles from '../common/sectionBaseStyles';
import BadgeModal from '../common/BadgeModal';
import HostLocationSection from './sections/HostLocationSection';
import HostsSection from './sections/HostsSection';
import AttendanceSection from './sections/AttendanceSection';
import MaterialsSection from './sections/MaterialsSection';

import SwipeToCloseScrollView from '../../../components/SwipeToCloseScrollView';
import { IMAGE_BANNER_HEIGHT } from '../../../components/ImageBanner';
import Avatar from '@liquidspirit/react-native-boring-avatars';
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
import UserBadge from '../../../components/UserBadge';
import UserCell from '../../../components/UserCell';
import MaterialsItemTile from '../../../components/MaterialsItemTile';
import { fetchUserBodyByEventType } from '../../../services/UserBodyService';
import { UserContext } from '../../../contexts/UserContext';
import { CommunityContext } from '../../../contexts/CommunityContext';
import { shareContent } from '../../../utils/shareContent';
import FooterBrand from '../common/FooterBrand';
import { Button } from 'liquid-spirit-styleguide/native';
import useGoogleMaps from '../../../hooks/useGoogleMaps';
import useDetailCardHeader from '../common/useDetailCardHeader';
import {
  detailCardOverlay,
  detailCardTitle,
  detailCardSubtitle,
  detailCardContent,
  detailCardHorizontalPadding,
} from '../common/detailCardLayout';
import { getDisplayAddress } from '../Activity/utils/locationUtils';
import useChatStarter from '../common/useChatStarter';
const HEADER_OFFSET = 0;
const TAB_BAR_HEIGHT = 80;

const { height: windowHeight } = Dimensions.get('window');

// Get abbreviated weekday name, e.g. "Wed"
const getDayName = d => d.toLocaleDateString(undefined, { weekday: 'short' });
const getDayMonth = d => d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
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
  const { communityId } = useContext(CommunityContext);
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
  }, [eventId, token, eventPreload, storageLoaded, didFinishEntryTransition]);
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
  // Access current user and community from context for joining
  const { user } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
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
  }, [addHostModalVisible]);

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
  // Check if current user is admin in any oversight body membership
  const userBodyMembership = event.userBodyMembership || {};
  const isAdmin = Object.values(userBodyMembership).some(v => v === true);
  const dateObj = new Date(date);
  const dateMain = getDayName(dateObj);
  const dateSub = getDayMonth(dateObj);
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
    if (!mapQuery || mapQuery === 'No location') return;
    let cancelled = false;
    const q = encodeURIComponent(mapQuery);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`, {
      headers: {
        'User-Agent': 'LiquidSpiritApp/1.0 (info@liquidspirit.org)',
        'Accept-Language': 'en',
      },
    }).then(res => res.json())
      .then(results => {
        if (cancelled) return;
        if (results && results.length > 0) {
          const { lat, lon } = results[0];
          setRegion({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      })
      .catch(err => console.warn('Geocode error', err));
    return () => {
      cancelled = true;
    };
  }, [mapQuery]);
  // Determine join status based on raw attendees (before enrichment)
  const hasJoined = optimisticJoin || rawAttendees.some(a => a.refId?.toString() === userId?.toString());

  const openMaps = useCallback(() => openGoogleMaps(mapQuery), [openGoogleMaps, mapQuery]);
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
  const handleAddHost = async () => {
    try {
      const newHost = { refId: userId, type: 'User' };
      // add host(s) then re-fetch full event details for consistent data shape
      await addEventHost(event._id, [newHost], token || '');
      const updatedEvent = await fetchEventDetails(event._id, token || '');
      setEvent(updatedEvent);
      Alert.alert('Host added', 'Host successfully added.');
    } catch (err) {
      console.error('Add host failed:', err);
      Alert.alert('Error', err.message || 'Failed to add host. Please try again.');
    }
  };
  // Track hosts being removed
  const [removingHosts, setRemovingHosts] = useState([]);
  // Handle removing a host by admin
  const handleRemoveHost = async host => {
    const hostId = host.refId || host._id;
    setRemovingHosts(prev => [...prev, hostId]);
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
    } finally {
      setRemovingHosts(prev => prev.filter(id => id !== hostId));
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
  const [enrichedAttendees, setEnrichedAttendees] = useState(null);

  // State for oversight body members; initialize name based on eventType to avoid empty jump
  const defaultOversightName = (eventType || '').toLowerCase().includes('feast')
    ? 'Feast Committee'
    : (eventType || '').toLowerCase().includes('holy')
      ? 'Holy Days Committee'
      : 'Local Spiritual Assembly';
  // Initialize with preloaded members if available to avoid loading jump
  const [oversightBody, setOversightBody] = useState({ name: defaultOversightName, members: oversightMembersPreload || [] });
  const [oversightLoading, setOversightLoading] = useState(!oversightMembersPreload);

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
      const type = (eventType || '').toLowerCase();
      let name;
      if (type.includes('feast')) {
        name = 'Feast Committee';
      } else if (type.includes('holy')) {
        name = 'Holy Days Committee';
      } else {
        name = 'Local Spiritual Assembly';
      }
      try {
        setOversightLoading(true);
        const members = await fetchUserBodyByEventType(eventType, token);
        if (isMounted) {
          setOversightBody({ name, members });
          setOversightLoading(false);
        }
      } catch (err) {
        console.error('Failed to load oversight body members', err);
        if (isMounted) setOversightLoading(false);
      }
    };
    loadBody();
    return () => { isMounted = false; };
  }, [eventType, oversightMembersPreload]);

  const attendees = enrichedAttendees ?? rawAttendees;
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
          styles={styles}
          onOpenMaps={openMaps}
        />

        {/* Host Section */}
        <HostsSection
          hosts={hosts}
          isAdmin={isAdmin}
          onAddHost={() => setAddHostModalVisible(true)}
          onRemoveHost={handleRemoveHost}
          hostRequestSent={hostRequestSent}
          onRequestHost={handleRequestHost}
          styles={styles}
        />
        <MaterialsSection
          materials={materials}
          isAdmin={isAdmin}
          onAddMaterial={false ? () => setMaterialModalVisible(true) : undefined}
          styles={styles}
        />
        {/* Oversight Body */}
        <Text style={styles.mapTitle}>Oversight Body</Text>
        {/* Show committee name */}
        <Text style={[styles.headerInfoText, { marginBottom: 8, alignSelf: 'flex-start' }]}>
          {oversightBody.name}
        </Text>
        {oversightLoading ? (
          <ActivityIndicator size="small" color={themeVariables.primaryColor} />
        ) : oversightBody.members.length > 0 ? (
          <>
            <View style={styles.userListContainer}>
              {oversightBody.members.slice(0, 4).map((member, idx) => (
                <View key={member._id || idx} style={styles.userListItem}>
                  <UserCell user={member} type={member.type} />
                </View>
              ))}
            </View>
            {oversightBody.members.length > 4 && (
              <Button
                secondary
                size="small"
                label="See More"
                onPress={() => setOversightModalVisible(true)}
                style={styles.seeMoreButton}
                textStyle={styles.seeMoreButtonText}
              />
            )}
          </>
        ) : (
          <Text style={styles.headerInfoText}>No oversight available</Text>
        )}
        <View style={styles.divider} />
        <AttendanceSection
          attendees={attendees}
          styles={styles}
          hasJoined={hasJoined}
          onJoin={handleJoin}
        />
      </View>
      <BadgeModal
        visible={attendeesModalVisible}
        onClose={() => setAttendeesModalVisible(false)}
        list={attendees.map(a => ({ details: a.details || a.user || a, certifications: a.certifications }))}
        title="Attendees"
      />
      <BadgeModal
        visible={oversightModalVisible}
        onClose={() => setOversightModalVisible(false)}
        list={oversightBody.members}
        title={oversightBody.name}
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

const Fact = ({ icon, label, value, onPress, link }) => (
  <TouchableOpacity
    style={styles.factBox}
    disabled={!onPress}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={18} color="#312783" />
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={[styles.factValue, link && styles.linkText]} numberOfLines={1}>
      {value}
    </Text>
  </TouchableOpacity>
);
const DetailCell = ({ icon, label, main, sub, onPress, isLink, style: cellStyle, labelStyle, mainStyle, subStyle }) => (
  <TouchableOpacity
    style={[styles.detailCell, cellStyle]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={18} color="#312783" style={styles.detailIcon} />
    <Text style={[styles.detailLabel, labelStyle]}>{label}</Text>
    <Text style={[styles.detailValue, isLink && styles.linkText, mainStyle]}>{main}</Text>
    {sub ? <Text style={[styles.detailSub, subStyle]}>{sub}</Text> : null}
  </TouchableOpacity>
);
const OverlappingAvatars = ({ list }) => {
  const maxDisplay = 2;
  const extraCount = list.length - maxDisplay;
  const displayList = list.slice(0, maxDisplay);
  const navigation = useNavigation();
  return (
    <View style={styles.avatarsContainer}>
      {displayList.map((item, idx) => {
        const key = item.details?._id || idx;
        const user = item.details || {};
        const avatarUri = user.profilePicture;
        const imageStyle = [styles.avatar, idx > 0 && { marginLeft: -15 }];
        return (
          <TouchableOpacity
            key={key}
            style={imageStyle}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PublicUserProfile', { userId: user._id })}
          >
            {avatarUri ? (
              <FastImage source={resolveImageSource(avatarUri, { priority: 'normal' })} style={imageStyle} />
            ) : (
              <Avatar
                size={styles.avatar.width}
                name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                variant="beam"
                colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
                style={imageStyle}
              />
            )}
          </TouchableOpacity>
        );
      })}
      {extraCount > 0 && (
        <View key="extra" style={[styles.avatar, styles.extraCount, { marginLeft: -15 }]}>
          <Text style={styles.extraCountText}>+{extraCount}</Text>
        </View>
      )}
    </View>
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
  sectionHeaderRow: {
    ...sectionBaseStyles.sectionHeaderRow,
  },
  avatarsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  userListContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  userListItem: {
    width: '50%',
    paddingVertical: 4,
    paddingHorizontal: 4,
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
  seeMoreButton: {
    alignSelf: 'center',
    marginVertical: 8,
    marginBottom: 12,
  },
  seeMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
