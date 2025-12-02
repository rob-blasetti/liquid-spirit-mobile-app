import React from 'react';
import { View, Text, FlatList } from 'react-native';

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
        <FlatList
          data={orderedUpcomingSessions}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          keyExtractor={(item, idx) => item?._id || item?.id || `session-${idx}`}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
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
          )}
        />
        <View style={styles.divider} />
      </>
    )}
  </>
);

export default OverviewSection;
