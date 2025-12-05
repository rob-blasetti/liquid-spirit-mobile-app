import React, { useCallback } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { CardTitle, CardContent } from '../../../components/Card';

import CardContainer from '../common/CardContainer';
import CurriculumSection from './sections/CurriculumSection';
import FormsSection from './sections/FormsSection';
import LocationSection from './sections/LocationSection';
import GuidelinesSection from './sections/GuidelinesSection';
import OverviewSection from './sections/OverviewSection';
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
  if (!activity) return null;

  const {
    imageUrl,
    title,
    activityType,
    groupDetails,
    description,
    guidelines,
    forms,
  } = activity || {};

  const dayOfWeek = groupDetails?.day ?? 'N/A';
  const timeMain = formatTime(groupDetails?.time);
  const safeActivityTypeName = activityType?.name || activityType || 'Unknown';

  const { orderedUpcomingSessions, nextSession, curriculumLesson } = useActivitySessions(
    activity,
    initialSessionId
  );
  const curriculumDetails = useCurriculumDetails(curriculumLesson);
  const location = useActivityLocation({ activity, nextSession });
  const {
    isUserFacilitator,
    isUserParticipant,
    hasFacilitatorSpace,
    hasParticipantSpace,
    hasRequestedFacilitator,
    hasRequestedParticipant,
  } = useActivityUserStatus({
    activity,
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
