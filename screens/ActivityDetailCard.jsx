import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Linking,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform,
  Modal,
} from 'react-native';
import {
  Card,
  CardTitle,
  CardContent,
} from 'react-native-material-cards';
import FastImage from 'react-native-fast-image';
import Avatar from '@flipxyz/react-native-boring-avatars';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCalendar,
  faClock,
  faCarSide,
  faVideo,
  faUsers,
  faBook,
  faChair,
  faPlusCircle,
} from '@fortawesome/free-solid-svg-icons';

import themeVariables from '../styles/theme';
import {
  fetchActivityDetails,
  requestParticipation,
  requestFacilitator,
} from '../services/ActivityService';
import { UserContext } from '../contexts/UserContext';
import UserBadge from '../components/UserBadge';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: windowHeight } = Dimensions.get('window');

/* ─── Helper Functions ────────────────────────────────────────────── */
const getDayName = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'long' });
const getDayMonth = (d) =>
  d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });

/* ────────────────────────────────────────────────────────────────────────────
   Screen
   ──────────────────────────────────────────────────────────────────────────── */
const ActivityDetailCard = ({ route }) => {
  const { user, token } = useContext(UserContext);
  const { activityId, activityPreload } = route.params;

  const [activity, setActivity] = useState(activityPreload || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Flag to indicate full activity details have been loaded
  const detailsLoaded = !loading;

  useEffect(() => {
    if (!activityId) return;
    const fetchDetails = async () => {
      try {
        const data = await fetchActivityDetails(activityId, token || '');
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
      <View style={styles.loadingWrapper}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ActivityCardBody
            activity={activityPreload}
            setActivity={setActivity}
            formatTime={formatTime}
            openGoogleMaps={openGoogleMaps}
            userId={user?.id}
            detailsLoaded={detailsLoaded}
          />
        </ScrollView>
        <View style={styles.loadingOverlayContainer}>
          <ActivityIndicator size="large" color={themeVariables.primaryColor} />
        </View>
      </View>
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
    <ScrollView contentContainerStyle={styles.scroll}>
      <ActivityCardBody
        activity={activity}
        setActivity={setActivity}
        formatTime={formatTime}
        openGoogleMaps={openGoogleMaps}
        userId={user?.id}
        detailsLoaded={detailsLoaded}
      />
    </ScrollView>
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
  const dateObj = new Date(date);
  const dateMain = getDayName(dateObj);
  const dateSub = getDayMonth(dateObj);
  const timeMain = formatTime(groupDetails?.time);
  const timeSub = groupDetails?.day ?? 'N/A';
  const isOnline = Boolean(onlineLink);
  const fullAddr =
    isOnline
      ? 'Join Online'
      : [address?.streetAddress, address?.suburb, address?.city]
          .filter(Boolean)
          .join(', ') || 'No address';

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
        {statusLabel && (
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>{statusLabel}</Text>
          </View>
        )}
        <CardTitle
          title={title}
          subtitle={activityType?.name ?? 'Unknown'}
          style={styles.titleBlock}
        />


        {/* Details grid */}
        <CardContent style={styles.cardContent}>
          <View style={styles.detailRow}>
            <DetailCell
              icon={faCalendar}
              label="Date"
              main={dateMain}
              sub={dateSub}
            />
            <DetailCell
              icon={faClock}
              label="Time"
              main={timeMain}
              sub={timeSub}
            />
            <DetailCell
              icon={isOnline ? faVideo : faCarSide}
              label={isOnline ? 'Online' : 'Location'}
              main={locationLabel}
              sub=""
              onPress={() =>
                isOnline ? Linking.openURL(onlineLink) : openGoogleMaps(fullAddr)
              }
              isLink={isOnline}
            />
          </View>
          {/* Quick facts */}
          <View style={styles.factRow}>
            <Fact icon={faUsers} label="Community" value={user?.community?.name || 'Unknown'} />
            <Fact icon={faBook} label="Reference Material" value={activity.referenceMaterial || 'No Material Attached'} />
          </View>
          {/* Facilitators and Participants Sections */}
          <View style={styles.sectionsContainer}>
              <TouchableOpacity
              onPress={() => setFacilitatorsModalVisible(true)}
              activeOpacity={0.8}
              style={styles.sideSection}
            >
              <Text style={styles.sectionTitle}>Facilitators</Text>
              <OverlappingAvatars list={facilitators} />
              {detailsLoaded && hasFacilitatorSpace && !isUserFacilitator && !isUserParticipant && !hasRequestedFacilitator && !hasRequestedParticipant && (
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={handleFacilitatorRequest}
                  activeOpacity={0.8}
                >
                  <FontAwesomeIcon icon={faPlusCircle} size={18} color={themeVariables.whiteColor} />
                  <Text style={styles.requestButtonText}>Request Join</Text>
                </TouchableOpacity>
              )}
              </TouchableOpacity>
              <View style={styles.dividerVertical} />
              <TouchableOpacity
              onPress={() => setParticipantsModalVisible(true)}
              activeOpacity={0.8}
              style={styles.sideSection}
            >
              <Text style={styles.sectionTitle}>Participants</Text>
              <OverlappingAvatars list={participants} />
              {detailsLoaded && hasParticipantSpace && !isUserParticipant && !isUserFacilitator && !hasRequestedParticipant && !hasRequestedFacilitator && (
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={handleParticipantRequest}
                  activeOpacity={0.8}
                >
                  <FontAwesomeIcon icon={faPlusCircle} size={18} color={themeVariables.whiteColor} />
                  <Text style={styles.requestButtonText}>Request Join</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            </View>
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
  return (
    <View style={styles.avatarsContainer}>
      {displayList.map((item, idx) => {
        const key = item?.details?._id || item?._id || idx;
        const user = item.details || item;
        const avatarUri = user.profilePicture || null;
        const imageStyle = [styles.avatar, idx > 0 && { marginLeft: -15 }];
        return avatarUri ? (
          <FastImage key={key} source={{ uri: avatarUri }} style={imageStyle} />
        ) : (
          <Avatar
            key={key}
            size={styles.avatar.width}
            name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
            variant="beam"
            colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
            style={imageStyle}
          />
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
const BadgeModal = ({ visible, onClose, list, title }) => (
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
              <View key={key} style={styles.modalBadgeWrap}>
                <UserBadge user={user} userCertifications={certs} />
              </View>
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

/* ───────────── Styles ───────────────────────────────────────────── */
const styles = StyleSheet.create({
  scroll: {
    backgroundColor: themeVariables.whiteColor,
    flexGrow: 1,
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
  },
  banner: { width: '100%', height: 220, borderRadius: 0 },
  overlayCard: {
    width: '100%',
    marginTop: -40,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  titleBlock: { paddingTop: 12 },

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
  factLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  factValue: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
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
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#312783',
    marginBottom: 4,
    textAlign: 'center',
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
  /* Combined Facilitators/Participants styles */
  sectionsContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 14,
    overflow: 'hidden',
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
  extraCount: {
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  extraCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  /* Status chip in top-right corner */
  statusChip: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  },
});

