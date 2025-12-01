import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { CardTitle, CardContent } from 'react-native-material-cards';

import CardContainer from '../common/CardContainer';
import CurriculumSection from './sections/CurriculumSection';
import FormsSection from './sections/FormsSection';
import LocationSection from './sections/LocationSection';
import GuidelinesSection from './sections/GuidelinesSection';
import OverviewSection from './sections/OverviewSection';
import FooterBrand from '../common/FooterBrand';
import resolveImageSource from '../../../utils/imageSource';
import themeVariables from '../../../styles/theme';
import {
  coalesceString,
  formatTime,
  normalizeString,
} from './utils/activityHelpers';
import { buildUpcomingSessions, orderSessionsWithHighlight } from './utils/sessionUtils';
import {
  formatAddress,
  getStreetAndSuburb,
} from './utils/venueUtils';

const { width: screenWidth } = Dimensions.get('window');

const ActivityCardBody = ({
  activity,
  openGoogleMaps,
  userId,
  detailsLoaded,
  initialSessionId,
  onRequestFacilitator,
  onRequestParticipant,
  optimisticFacilitatorRequest,
  optimisticParticipantRequest,
}) => {
  if (!activity) return null;
  const {
    imageUrl,
    title,
    activityType,
    groupDetails,
    onlineLink: activityOnlineLink,
    address,
    facilitators = [],
    participants = [],
    facilitatorLimit,
    participantLimit,
  } = activity || {};

  const dayOfWeek = groupDetails?.day ?? 'N/A';
  const timeMain = formatTime(groupDetails?.time);
  const safeActivityTypeName = activityType?.name || activityType || 'Unknown';

  const upcomingSessions = useMemo(
    () => buildUpcomingSessions(activity),
    [activity],
  );

  const { orderedUpcomingSessions } = useMemo(
    () => orderSessionsWithHighlight(upcomingSessions, initialSessionId),
    [upcomingSessions, initialSessionId],
  );

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

  const mapAddress = useMemo(() => {
    if (nextSession?.address) return formatAddress(nextSession.address);
    if (nextSession?.primaryVenue?.address) return formatAddress(nextSession.primaryVenue.address);
    return formatAddress(address);
  }, [nextSession, address]);

  const mapDisplayName = coalesceString(
    nextSession?.displayName,
    nextSession?.primaryVenue?.name,
    activity.title,
    'Upcoming Session'
  );
  const mapDisplayAddress = coalesceString(
    mapAddress,
    getStreetAndSuburb(nextSession?.address),
    getStreetAndSuburb(address),
  );

  const sessionOnlineLink = useMemo(() => {
    const raw = nextSession?.onlineLink || activityOnlineLink;
    return normalizeString(raw);
  }, [nextSession, activityOnlineLink]);

  const resolvedOnlineLink = useMemo(() => {
    if (!sessionOnlineLink) return '';
    if (/^https?:\/\//i.test(sessionOnlineLink)) return sessionOnlineLink;
    return `https://${sessionOnlineLink}`;
  }, [sessionOnlineLink]);

  const showOnlineSection = sessionOnlineLink.length > 0;
  const hasPhysicalSessionLocation = Boolean(mapAddress);
  const isHybridSession = showOnlineSection && hasPhysicalSessionLocation;
  const showMapSection = hasPhysicalSessionLocation;

  const region = useMemo(() => {
    const coords = nextSession?.primaryVenue?.address || nextSession?.address || address;
    if (coords?.latitude && coords?.longitude) {
      return {
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    if (nextSession?.primaryVenue?.address?.coordinates) {
      const [lng, lat] = nextSession.primaryVenue.address.coordinates;
      return { latitude: Number(lat), longitude: Number(lng), latitudeDelta: 0.01, longitudeDelta: 0.01 };
    }
    return null;
  }, [nextSession, address]);

  const isUserFacilitator = facilitators.some(
    (f) => f.details?._id === userId
  );
  const isUserParticipant = participants.some(
    (p) => p.details?._id === userId
  );

  const hasFacilitatorSpace =
    facilitatorLimit == null ? true : facilitators.length < facilitatorLimit;
  const hasParticipantSpace =
    participantLimit == null ? true : participants.length < participantLimit;

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

  const handleFacilitatorRequest = useCallback(() => {
    onRequestFacilitator?.(userId);
  }, [onRequestFacilitator, userId]);

  const handleParticipantRequest = useCallback(() => {
    onRequestParticipant?.(userId);
  }, [onRequestParticipant, userId]);

  return (
    <>
      <CardContainer
        imageUrl={imageUrl ? resolveImageSource(imageUrl, { priority: 'high', fallback: '/img/events/Event_Placeholder.png' }) : null}
        cardStyle={styles.card}
        bannerStyle={styles.banner}
      >
        <View style={styles.overlayCard} key="card-body">
          <CardTitle
            title={title}
            subtitle={safeActivityTypeName}
            style={styles.titleBlock}
            titleStyle={styles.cardTitleText}
            subtitleStyle={styles.cardSubtitleText}
          />
          <View style={styles.headerInfoContainer}>
            <Text style={styles.headerInfoText}>{dayOfWeek} ‧ {timeMain}</Text>
          </View>
          <View style={styles.divider} />
          <OverviewSection
            description={activity.description}
            orderedUpcomingSessions={orderedUpcomingSessions}
            styles={styles}
            detailsLoaded={detailsLoaded}
            hasFacilitatorSpace={hasFacilitatorSpace}
            hasParticipantSpace={hasParticipantSpace}
            isUserFacilitator={isUserFacilitator}
            isUserParticipant={isUserParticipant}
            hasRequestedFacilitator={hasRequestedFacilitator}
            hasRequestedParticipant={hasRequestedParticipant}
            handleFacilitatorRequest={handleFacilitatorRequest}
            handleParticipantRequest={handleParticipantRequest}
            screenWidth={screenWidth}
          />

          <CurriculumSection curriculumDetails={curriculumDetails} styles={styles} />

          <LocationSection
            showMapSection={showMapSection}
            showOnlineSection={showOnlineSection}
            isHybridSession={isHybridSession}
            mapDisplayName={mapDisplayName}
            mapDisplayAddress={mapDisplayAddress}
            mapAddress={mapAddress}
            region={region}
            openGoogleMaps={openGoogleMaps}
          resolvedOnlineLink={resolvedOnlineLink}
          styles={styles}
        />

          <CardContent style={styles.cardContent}>
            <GuidelinesSection guidelines={activity.guidelines} styles={styles} />
            <FormsSection forms={activity.forms} styles={styles} />
          </CardContent>
        </View>
      </CardContainer>

      <FooterBrand containerStyle={styles.footerContainer} />
    </>
  );
};

const styles = StyleSheet.create({
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
  cardContent: { paddingTop: 8, marginHorizontal: -15 },
  headerInfoContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  headerInfoText: {
    fontSize: 16,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  carouselContent: {
    paddingLeft: 4,
  },
  carouselTitle: {
    color: themeVariables.blackColor,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 14,
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
  avatarName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fff',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
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
  avatarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  ctaButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
    marginTop: 6,
  },
  ctaText: { fontSize: 14, fontWeight: '600' },
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
  formLink: {
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  formLinkText: {
    fontSize: 14,
    color: themeVariables.primaryColor,
    textDecorationLine: 'underline',
  },
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
});

export default ActivityCardBody;
