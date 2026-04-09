import React, { useCallback } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { CardTitle, CardContent } from '../../../components/Card';

import CardContainer from '../common/CardContainer';
import CurriculumSection from './sections/CurriculumSection';
import FormsSection from './sections/FormsSection';
import LocationSection from './sections/LocationSection';
import GuidelinesSection from './sections/GuidelinesSection';
import OverviewSection from './sections/OverviewSection';
import ParticipationStatusSection, { buildParticipationDisplay } from './sections/ParticipationStatusSection';
import SessionSummarySection from './sections/SessionSummarySection';
import ActivityFactsSection from './sections/ActivityFactsSection';
import FooterBrand from '../common/FooterBrand';
import resolveImageSource from '../../../utils/imageSource';
import { formatTime } from './utils/activityHelpers';
import useActivitySessions from './hooks/useActivitySessions';
import useCurriculumDetails from './hooks/useCurriculumDetails';
import useActivityLocation from './hooks/useActivityLocation';
import useActivityUserStatus from './hooks/useActivityUserStatus';
import styles from './ActivityCard.styles';

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
    curriculum,
  } = safeActivity;

  const dayOfWeek = groupDetails?.day ?? 'N/A';
  const timeMain = formatTime(groupDetails?.time);
  const safeActivityTypeName = activityType?.name || activityType || 'Unknown';

  const { allSessions, orderedUpcomingSessions, nextSession, curriculumLesson } = useActivitySessions(
    safeActivity,
    initialSessionId
  );
  const curriculumDetails = useCurriculumDetails(curriculumLesson);
  const location = useActivityLocation({ activity: safeActivity, nextSession });
  const communityName = community?.name || '';
  const frequency = groupDetails?.frequency || '';
  const gradeLabel = safeActivity?.grade || '';
  const curriculumName = curriculum?.name || curriculum?.title || '';
  const locationLabel = location.mapDisplayAddress || location.mapAddress || '';
  const onlineLabel = location.resolvedOnlineLink ? 'Available online' : '';
  const {
    isUserFacilitator,
    isUserParticipant,
    hasFacilitatorSpace,
    hasParticipantSpace,
    hasRequestedFacilitator,
    hasRequestedParticipant,
    facilitatorCount,
    participantCount,
    facilitatorLimit,
    participantLimit,
  } = useActivityUserStatus({
    activity: safeActivity,
    userId,
    optimisticFacilitatorRequest,
    optimisticParticipantRequest,
  });

  const handleFacilitatorRequest = useCallback(() => {
    onRequestFacilitator?.(userId);
  }, [onRequestFacilitator, userId]);

  const handleParticipantRequest = useCallback(() => {
    onRequestParticipant?.(userId);
  }, [onRequestParticipant, userId]);

  const imageSource = imageUrl
    ? resolveImageSource(imageUrl, { priority: 'high', fallback: '/img/events/Event_Placeholder.png' })
    : null;

  const participationDisplay = buildParticipationDisplay({
    isUserFacilitator,
    isUserParticipant,
    hasRequestedFacilitator,
    hasRequestedParticipant,
    hasFacilitatorSpace,
    hasParticipantSpace,
    facilitatorCount,
    participantCount,
    facilitatorLimit,
    participantLimit,
  });

  if (!activity) return null;

  return (
    <>
      <CardContainer
        imageUrl={imageSource}
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
          <ParticipationStatusSection
            styles={styles}
            statusLabel={participationDisplay.statusLabel}
            statusTone={participationDisplay.statusTone}
            statusMessage={participationDisplay.statusMessage}
            facilitatorSummary={participationDisplay.facilitatorSummary}
            participantSummary={participationDisplay.participantSummary}
            canRequestFacilitator={participationDisplay.canRequestFacilitator}
            canRequestParticipant={participationDisplay.canRequestParticipant}
            hasRequestedFacilitator={hasRequestedFacilitator}
            hasRequestedParticipant={hasRequestedParticipant}
            onRequestFacilitator={handleFacilitatorRequest}
            onRequestParticipant={handleParticipantRequest}
          />
          <SessionSummarySection
            styles={styles}
            totalSessions={allSessions.length}
            upcomingCount={orderedUpcomingSessions.length}
            nextSession={nextSession}
          />
          <ActivityFactsSection
            styles={styles}
            communityName={communityName}
            dayOfWeek={dayOfWeek}
            timeMain={timeMain}
            frequency={frequency}
            gradeLabel={gradeLabel}
            curriculumName={curriculumName}
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
            handleFacilitatorRequest={handleFacilitatorRequest}
            handleParticipantRequest={handleParticipantRequest}
            screenWidth={screenWidth}
          />

          <CurriculumSection curriculumDetails={curriculumDetails} styles={styles} />

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
