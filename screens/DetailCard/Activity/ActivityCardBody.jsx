import React, {useCallback} from 'react';
import {View, Text, Dimensions} from 'react-native';
import {CardTitle, CardContent} from '../../../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CardContainer from '../common/CardContainer';
import CurriculumSection from './sections/CurriculumSection';
import FormsSection from './sections/FormsSection';
import LocationSection from './sections/LocationSection';
import GuidelinesSection from './sections/GuidelinesSection';
import OverviewSection from './sections/OverviewSection';
import ActivityFactsSection from './sections/ActivityFactsSection';
import FooterBrand from '../common/FooterBrand';
import resolveImageSource from '../../../utils/imageSource';
import {formatTime} from './utils/activityHelpers';
import useActivitySessions from './hooks/useActivitySessions';
import useCurriculumDetails from './hooks/useCurriculumDetails';
import useActivityLocation from './hooks/useActivityLocation';
import useActivityUserStatus from './hooks/useActivityUserStatus';
import styles from './ActivityCard.styles';

const {width: screenWidth} = Dimensions.get('window');
const normalizeId = value =>
  value === undefined || value === null ? '' : String(value).trim();

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
  onPressNextSession,
  onSessionsLayout,
}) => {
  const safeActivity = activity || {};

  const {
    imageUrl,
    title,
    activityType,
    groupDetails,
    description,
    guidelines,
    forms,
    community,
    createdBy,
  } = safeActivity;

  const dayOfWeek = groupDetails?.day ?? 'N/A';
  const timeMain = formatTime(groupDetails?.time);
  const safeActivityTypeName = activityType?.name || activityType || 'Unknown';

  const {orderedUpcomingSessions, nextSession, curriculumLesson} =
    useActivitySessions(safeActivity, initialSessionId);
  const curriculumDetails = useCurriculumDetails(curriculumLesson);
  const location = useActivityLocation({activity: safeActivity, nextSession});
  const frequency = groupDetails?.frequency || '';
  const communityName =
    (typeof community === 'string' ? community : community?.name) || '';
  const isAdmin = normalizeId(createdBy) === normalizeId(userId);
  const {
    isUserFacilitator,
    isUserParticipant,
    hasFacilitatorSpace,
    hasParticipantSpace,
    hasRequestedFacilitator,
    hasRequestedParticipant,
    facilitatorLimit,
    participantLimit,
  } = useActivityUserStatus({
    activity: safeActivity,
    userId,
    optimisticFacilitatorRequest,
    optimisticParticipantRequest,
  });
  const topBadges = [
    communityName
      ? {
          key: 'community',
          label: communityName,
          icon: 'leaf-outline',
          tone: 'community',
        }
      : null,
    isAdmin
      ? {
          key: 'admin',
          label: 'Admin',
          icon: 'shield-checkmark-outline',
          tone: 'admin',
        }
      : null,
    isUserFacilitator
      ? {
          key: 'facilitator',
          label: 'Facilitator',
          icon: 'people-outline',
          tone: 'success',
        }
      : null,
    isUserParticipant
      ? {
          key: 'participant',
          label: 'Participant',
          icon: 'person-outline',
          tone: 'success',
        }
      : null,
    hasRequestedFacilitator
      ? {
          key: 'pending-facilitator',
          label: 'Pending Facilitator',
          icon: 'hourglass-outline',
          tone: 'warning',
        }
      : null,
    hasRequestedParticipant
      ? {
          key: 'pending-participant',
          label: 'Pending Participant',
          icon: 'time-outline',
          tone: 'warning',
        }
      : null,
  ].filter(Boolean);

  const handleFacilitatorRequest = useCallback(() => {
    onRequestFacilitator?.(userId);
  }, [onRequestFacilitator, userId]);

  const handleParticipantRequest = useCallback(() => {
    onRequestParticipant?.(userId);
  }, [onRequestParticipant, userId]);

  const imageSource = imageUrl
    ? resolveImageSource(imageUrl, {
        priority: 'high',
        fallback: '/img/events/Event_Placeholder.png',
      })
    : null;

  if (!activity) return null;

  return (
    <>
      <CardContainer
        imageUrl={imageSource}
        cardStyle={styles.card}
        bannerStyle={styles.banner}>
        <View style={styles.overlayCard} key="card-body">
          <CardTitle
            title={title}
            subtitle={safeActivityTypeName}
            style={styles.titleBlock}
            titleStyle={styles.cardTitleText}
            subtitleStyle={styles.cardSubtitleText}
          />
          {topBadges.length > 0 ? (
            <View style={styles.topBadgeRow}>
              {topBadges.map(badge => (
                <View
                  key={badge.key}
                  style={[styles.topBadge, styles[`topBadge_${badge.tone}`]]}>
                  <Ionicons
                    name={badge.icon}
                    size={12}
                    style={[
                      styles.topBadgeIcon,
                      styles[`topBadgeIcon_${badge.tone}`],
                    ]}
                  />
                  <Text
                    style={[
                      styles.topBadgeText,
                      styles[`topBadgeText_${badge.tone}`],
                    ]}>
                    {badge.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.divider} />
          <ActivityFactsSection
            styles={styles}
            dayOfWeek={dayOfWeek}
            timeMain={timeMain}
            frequency={frequency}
            nextSession={nextSession}
            onPressNextSession={onPressNextSession}
          />
          <OverviewSection
            description={description}
            orderedUpcomingSessions={orderedUpcomingSessions}
            styles={styles}
            detailsLoaded={detailsLoaded}
            hasFacilitatorSpace={hasFacilitatorSpace}
            hasParticipantSpace={hasParticipantSpace}
            isUserFacilitator={isUserFacilitator}
            isUserParticipant={isUserParticipant}
            hasRequestedFacilitator={hasRequestedFacilitator}
            hasRequestedParticipant={hasRequestedParticipant}
            facilitatorLimit={facilitatorLimit}
            participantLimit={participantLimit}
            handleFacilitatorRequest={handleFacilitatorRequest}
            handleParticipantRequest={handleParticipantRequest}
            screenWidth={screenWidth}
            showSessions={false}
          />
          <OverviewSection
            description={description}
            orderedUpcomingSessions={orderedUpcomingSessions}
            styles={styles}
            detailsLoaded={detailsLoaded}
            hasFacilitatorSpace={hasFacilitatorSpace}
            hasParticipantSpace={hasParticipantSpace}
            isUserFacilitator={isUserFacilitator}
            isUserParticipant={isUserParticipant}
            hasRequestedFacilitator={hasRequestedFacilitator}
            hasRequestedParticipant={hasRequestedParticipant}
            facilitatorLimit={facilitatorLimit}
            participantLimit={participantLimit}
            handleFacilitatorRequest={handleFacilitatorRequest}
            handleParticipantRequest={handleParticipantRequest}
            screenWidth={screenWidth}
            showDescription={false}
            onSessionsLayout={onSessionsLayout}
          />

          <CurriculumSection
            curriculumDetails={curriculumDetails}
            styles={styles}
          />

          <LocationSection
            showMapSection={location.showMapSection}
            showOnlineSection={location.showOnlineSection}
            isHybridSession={location.isHybridSession}
            mapDisplayName={location.mapDisplayName}
            mapDisplayAddress={location.mapDisplayAddress}
            mapAddress={location.mapAddress}
            region={location.region}
            hasRegion={location.hasRegion}
            openGoogleMaps={openGoogleMaps}
            resolvedOnlineLink={location.resolvedOnlineLink}
            styles={styles}
          />

          <CardContent style={styles.cardContent}>
            <GuidelinesSection guidelines={guidelines} styles={styles} />
            <FormsSection forms={forms} styles={styles} />
          </CardContent>
        </View>
      </CardContainer>

      <FooterBrand containerStyle={styles.footerContainer} />
    </>
  );
};

export default ActivityCardBody;
