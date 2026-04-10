import React from 'react';
import {View, Text, FlatList} from 'react-native';

import SessionCard from '../../../../components/SessionCard';
import {detailCardHorizontalPadding} from '../../common/detailCardLayout';

const SESSION_CARD_GUTTER = 2;

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
  facilitatorLimit,
  participantLimit,
  handleFacilitatorRequest,
  handleParticipantRequest,
  screenWidth,
  showDescription = true,
  showSessions = true,
  onSessionsLayout,
}) => {
  const sessionCardWidth =
    screenWidth - detailCardHorizontalPadding * 2 - SESSION_CARD_GUTTER;
  const nextUpcomingSessionId =
    orderedUpcomingSessions.reduce((closest, session) => {
      const time = session?.dateObj?.getTime?.();
      if (!Number.isFinite(time)) return closest;
      if (!closest || time < closest.time) {
        return {
          time,
          id: session?._id || session?.id || session?.sessionId || session?.session_id,
        };
      }
      return closest;
    }, null)?.id || null;

  return (
    <>
      {showDescription ? (
        <>
          <Text style={styles.mapTitle}>Description</Text>
          <Text
            style={[
              styles.headerInfoText,
              {marginVertical: 12, alignSelf: 'flex-start'},
            ]}>
            {description}
          </Text>
          <View style={styles.divider} />
        </>
      ) : null}
      {showSessions && orderedUpcomingSessions.length > 0 ? (
        <View
          onLayout={event => {
            onSessionsLayout?.(event?.nativeEvent?.layout?.y ?? 0);
          }}>
          <Text style={styles.mapTitle}>Upcoming Sessions</Text>
          <FlatList
            data={orderedUpcomingSessions}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            keyExtractor={(item, idx) =>
              item?._id || item?.id || `session-${idx}`
            }
            renderItem={({item}) => (
              <SessionCard
                session={item}
                detailsLoaded={detailsLoaded}
                hasFacilitatorSpace={hasFacilitatorSpace}
                hasParticipantSpace={hasParticipantSpace}
                isUserFacilitator={isUserFacilitator}
                isUserParticipant={isUserParticipant}
                hasRequestedFacilitator={hasRequestedFacilitator}
                hasRequestedParticipant={hasRequestedParticipant}
                facilitatorLimit={facilitatorLimit}
                participantLimit={participantLimit}
                onFacilitatorRequest={handleFacilitatorRequest}
                onParticipantRequest={handleParticipantRequest}
                width={sessionCardWidth}
                isNextUpcomingSession={
                  (item?._id || item?.id || item?.sessionId || item?.session_id) ===
                  nextUpcomingSessionId
                }
              />
            )}
          />
          <View style={styles.divider} />
        </View>
      ) : null}
    </>
  );
};

export default OverviewSection;
