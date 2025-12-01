import React from 'react';
import { View, Text, ScrollView } from 'react-native';

import SessionCard from '../../../../components/SessionCard';

const OverviewSection = ({
  description,
  orderedUpcomingSessions,
  styles,
  detailsLoaded,
  hasFacilitatorSpace,
  hasParticipantSpace,
  isUserFacilitator,
  isUserParticipant,
  hasRequestedFacilitator,
  hasRequestedParticipant,
  handleFacilitatorRequest,
  handleParticipantRequest,
  screenWidth,
}) => (
  <>
    <Text style={styles.mapTitle}>Description</Text>
    <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
      {description}
    </Text>
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
  </>
);

export default OverviewSection;
