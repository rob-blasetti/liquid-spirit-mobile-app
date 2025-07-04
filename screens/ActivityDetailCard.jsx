// Amount to offset content so top corners are hidden initially
const HEADER_OFFSET = 0;
import React, { useContext, useEffect, useState, useLayoutEffect } from 'react';
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
} from 'react-native';
import {
  Card,
  CardTitle,
  CardContent,
} from 'react-native-material-cards';
import FastImage from 'react-native-fast-image';
import Avatar from '@flipxyz/react-native-boring-avatars';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faPlusCircle,
  faVideo,
  faShare,
} from '@fortawesome/free-solid-svg-icons';

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

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Screen dimensions
const { height: windowHeight, width: screenWidth } = Dimensions.get('window');

/* ─── Helper Functions ────────────────────────────────────────────── */
// (Removed getDayName/getDayMonth: using groupDetails.day and formatTime now)

/* ────────────────────────────────────────────────────────────────────────────
   Screen
   ──────────────────────────────────────────────────────────────────────────── */
const ActivityDetailCard = ({ route }) => {
  const navigation = useNavigation();
  const { user, token } = useContext(UserContext);
  const { activityId, activityPreload } = route.params;

  const [activity, setActivity] = useState(activityPreload || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Flag to indicate full activity details have been loaded
  const detailsLoaded = !loading;
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
          onPress={() => {
            const title = activity?.title || '';
            const message = `Check out this activity: ${title}`;
            Share.share({ message });
          }}
        >
          <FontAwesomeIcon icon={faShare} size={20} color={themeVariables.blackColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, activity]);
  useEffect(() => {
    if (!activityId) return;
    const fetchDetails = async () => {
      try {
        const data = await fetchActivityDetails(activityId, token || '');
        console.log('activity deatils page => activity: ', data);
        setActivity(data);
      } catch (err) {
        setError(err.message || 'Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [activityId]);

  const formatTime = (t) => {
    if (!t) return 'N/A';
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const openGoogleMaps = (addr) => {
    const query = encodeURIComponent(addr);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  /* ── early returns ────────────────────────────────────────────── */
  if (!activityId)
    return (
      <View style={styles.centered}>
        <Text style={styles.noActivityText}>No activity to display.</Text>
      </View>
    );

  if (loading && activityPreload) {
    return (
      <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right', 'bottom' ]}>
        <StatusBar
          animated={true}
          translucent={true}
          backgroundColor="transparent"
          barStyle="light-content"
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: HEADER_OFFSET, paddingBottom: 30 }}
          overScrollMode="always"
          scrollEventThrottle={16}
          onScrollEndDrag={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y < -HEADER_OFFSET / 2) {
              navigation.goBack();
            }
          }}
        >
          <ActivityCardBody
            activity={activityPreload}
            setActivity={setActivity}
            formatTime={formatTime}
            openGoogleMaps={openGoogleMaps}
            userId={user?.id}
            detailsLoaded={detailsLoaded}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error)
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </View>
    );

  if (!activity)
    return (
      <View style={styles.centered}>
        <Text style={styles.noActivityText}>
          Activity details not available.
        </Text>
      </View>
    );

  /* ── main render ────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea} edges={[ 'left', 'right', 'bottom' ]}>
      <StatusBar
        animated={true}
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_OFFSET, paddingBottom: 30 }}
        overScrollMode="always"
        scrollEventThrottle={16}
        onScrollEndDrag={({ nativeEvent }) => {
          if (nativeEvent.contentOffset.y < -HEADER_OFFSET / 2) {
            navigation.goBack();
          }
        }}
      >
        <ActivityCardBody
          activity={activity}
          setActivity={setActivity}
          formatTime={formatTime}
          openGoogleMaps={openGoogleMaps}
          userId={user?.id}
          detailsLoaded={detailsLoaded}
        />
      </ScrollView>
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
}) => {
  const {
    imageUrl,
    title,
    activityType,
    date,
    groupDetails,
    onlineLink,
    address,
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
  // Host full address
  const fullAddr = isOnline ? onlineLink : [address?.streetAddress, address?.suburb, address?.city]
    .filter(Boolean).join(', ');
  // Region state for map
  const [region, setRegion] = useState(null);
  useEffect(() => {
    if (!fullAddr || isOnline) return;
    // Geocode via OpenStreetMap Nominatim
    const q = encodeURIComponent(fullAddr);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`)
      .then(res => res.json())
      .then(results => {
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
  }, [fullAddr]);
  const isOnline = Boolean(onlineLink);

  // Use a shorter label for location in the detail cell (if desired)
  const locationLabel = isOnline
    ? 'Join Online'
    : `${address?.streetAddress ?? 'No Address'}, ${address?.suburb ?? 'No Suburb'}`;

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
  // Session-specific modal for upcoming sessions
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [sessionModalList, setSessionModalList] = useState([]);
  const [sessionModalTitle, setSessionModalTitle] = useState('');
  // Optimistic request flags
  const [optimisticFacilitatorRequest, setOptimisticFacilitatorRequest] = useState(false);
  const [optimisticParticipantRequest, setOptimisticParticipantRequest] = useState(false);


  
  // User context and request handlers (token from context)
  const { user, token } = useContext(UserContext);
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
      alert(msg);
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
      alert(msg);
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
  const statusLabel = isUserFacilitator
    ? 'Facilitator'
    : isUserParticipant
    ? 'Participant'
    : hasRequestedFacilitator
    ? 'Facilitation Requested'
    : hasRequestedParticipant
    ? 'Participation Requested'
    : null;

  return (
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
        {/* Divider above host/location section */}
        <View style={styles.divider} />
        {isOnline ? (
          <>
            <Text style={styles.mapTitle}>Online Only</Text>
            <View style={styles.onlineRow}>
              <FontAwesomeIcon icon={faVideo} size={20} color={themeVariables.primaryColor} style={{ marginRight: 8 }} />
              <Text
                style={[styles.headerInfoText, { color: themeVariables.primaryColor }]}
                onPress={() => Linking.openURL(onlineLink)}
              >
                {onlineLink}
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : (
          <>
            <Text style={styles.mapTitle}>Host Address</Text>
            <View style={styles.mapWrapper}>
            {region ? (
              <MapView style={styles.map} initialRegion={region}>
                <Marker coordinate={region} />
              </MapView>
            ) : (
              <View style={styles.mapLoader}>
                <ActivityIndicator size="small" color={themeVariables.primaryColor} />
              </View>
            )}
            </View>
            <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
              {locationLabel}
            </Text>
            <View style={styles.divider} />
          </>
        )}


        {/* Details grid */}
        <CardContent style={styles.cardContent}>
        {/* Upcoming Sessions Carousel */}
          {Array.isArray(activity.sessions) && (
            (() => {
              const now = new Date();
              const upcoming = activity.sessions
                .filter(s => ['Scheduled', 'Confirmed'].includes(s.status))
                .map(s => ({ ...s, dateObj: new Date(s.date) }))
                .filter(s => !isNaN(s.dateObj) && s.dateObj >= now)
                .sort((a, b) => a.dateObj - b.dateObj);
              if (upcoming.length === 0) return null;
              return (
                <View style={styles.carouselContainer}>
                  <Text style={styles.carouselTitle}>Upcoming Sessions</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                  >
                    {upcoming.map((sess, idx) => (
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
                </View>
              );
            })()
          )}

          {/* Divider before Guidelines and Forms */}
          <View style={styles.divider} />

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
      {/* Session Avatar Modal */}
      <BadgeModal
        visible={sessionModalVisible}
        onClose={() => setSessionModalVisible(false)}
        list={sessionModalList}
        title={sessionModalTitle}
      />
    </Card>
  );
};

/* ───────────── Small Helpers ───────────────────────────────────── */
const Fact = ({ icon, label, value, onPress, link }) => (
  <TouchableOpacity
    style={styles.factBox}
    disabled={!onPress}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <FontAwesomeIcon icon={icon} size={18} color="#312783" />
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={[styles.factValue, link && styles.linkText]} numberOfLines={1}>
      {value}
    </Text>
  </TouchableOpacity>
);

const DetailCell = ({ icon, label, main, sub, onPress, isLink }) => (
  <TouchableOpacity
    style={styles.detailCell}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.8}
  >
    <FontAwesomeIcon icon={icon} size={18} color="#312783" style={styles.detailIcon} />
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, isLink && styles.linkText]}>{main}</Text>
    {sub ? <Text style={styles.detailSub}>{sub}</Text> : null}
  </TouchableOpacity>
);

/* ───────────── Overlapping Avatars Component ─────────────────────
   Preview avatars overlapping a little bit, max 2 with overflow count.
──────────────────────────────────────────────────────────────────────── */
const OverlappingAvatars = ({ list }) => {
  const maxDisplay = 2;
  const extraCount = list.length - maxDisplay;
  const displayList = list.slice(0, maxDisplay);
  const navigation = useNavigation();
  return (
    <View style={styles.avatarsContainer}>
      {displayList.map((item, idx) => {
        const key = item?.details?._id || item?._id || idx;
        const user = item.details || item;
        const avatarUri = user.profilePicture || null;
        const imageStyle = [styles.avatar, idx > 0 && { marginLeft: -15 }];
        return (
          <TouchableOpacity
            key={key}
            style={imageStyle}
            onPress={() => navigation.navigate('PublicUserProfile', { userId: user._id })}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <FastImage source={{ uri: avatarUri }} style={imageStyle} />
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
        <View
          key="extra"
          style={[styles.avatar, styles.extraCount, { marginLeft: -15 }]}
        >
          <Text style={styles.extraCountText}>+{extraCount}</Text>
        </View>
      )}
    </View>
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
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
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
    width: Platform.select({ android: 150 })
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
    width: Platform.select({ android: 65 })
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312783',
    marginBottom: 4,
    textAlign: 'center',
    width: Platform.select({ android: 65 })
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
    textAlign: 'center',
    marginBottom: 8,
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: Platform.select({ android: 150 })
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
    width: Platform.select({ android: 40 })
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
    width: Platform.select({ android: 100 })
  },
  // Custom back button overlay
});

