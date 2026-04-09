import React from 'react';
import { View, Text, Pressable } from 'react-native';

const formatCapacity = (count, limit, label) => {
  if (typeof limit === 'number') return `${count}/${limit} ${label}`;
  return `${count} ${label}`;
};

const ParticipationStatusSection = ({
  styles,
  statusLabel,
  statusTone,
  statusMessage,
  facilitatorSummary,
  participantSummary,
  canRequestFacilitator,
  canRequestParticipant,
  hasRequestedFacilitator,
  hasRequestedParticipant,
  onRequestFacilitator,
  onRequestParticipant,
}) => {
  const toneStyle = [styles.participationBadge, styles[`participationBadge_${statusTone}`]];
  const toneTextStyle = [styles.participationBadgeText, styles[`participationBadgeText_${statusTone}`]];

  const helperText = [
    canRequestParticipant ? 'You can join as a participant.' : null,
    canRequestFacilitator ? 'You can also request to facilitate.' : null,
  ].filter(Boolean).join(' ');

  const participantActionLabel = hasRequestedParticipant
    ? 'Participant request pending'
    : !canRequestParticipant
      ? 'Participant not available'
      : 'Join as participant';
  const facilitatorActionLabel = hasRequestedFacilitator
    ? 'Facilitator request pending'
    : !canRequestFacilitator
      ? 'Facilitator not available'
      : 'Request to facilitate';

  return (
    <>
      <Text style={styles.mapTitle}>Your Status</Text>
      <View style={styles.participationCard}>
        <View style={styles.participationHeaderRow}>
          <View style={toneStyle}>
            <Text style={toneTextStyle}>{statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.participationMessage}>{statusMessage}</Text>
        {helperText ? <Text style={styles.participationHelper}>{helperText}</Text> : null}

        <View style={styles.participationCapacityRow}>
          <View style={styles.participationCapacityBox}>
            <Text style={styles.participationCapacityLabel}>Participants</Text>
            <Text style={styles.participationCapacityValue}>{participantSummary}</Text>
          </View>
          <View style={styles.participationCapacityDivider} />
          <View style={styles.participationCapacityBox}>
            <Text style={styles.participationCapacityLabel}>Facilitators</Text>
            <Text style={styles.participationCapacityValue}>{facilitatorSummary}</Text>
          </View>
        </View>

        <View style={styles.participationActions}>
          <Pressable
            disabled={!canRequestParticipant}
            onPress={onRequestParticipant}
            style={[
              styles.participationAction,
              canRequestParticipant ? styles.participationActionPrimary : styles.participationActionMuted,
            ]}
          >
            <Text
              style={[
                styles.participationActionText,
                canRequestParticipant ? styles.participationActionTextPrimary : styles.participationActionTextMuted,
              ]}
            >
              {participantActionLabel}
            </Text>
          </Pressable>

          <Pressable
            disabled={!canRequestFacilitator}
            onPress={onRequestFacilitator}
            style={[
              styles.participationAction,
              canRequestFacilitator ? styles.participationActionSecondary : styles.participationActionMuted,
            ]}
          >
            <Text
              style={[
                styles.participationActionText,
                canRequestFacilitator ? styles.participationActionTextSecondary : styles.participationActionTextMuted,
              ]}
            >
              {facilitatorActionLabel}
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.divider} />
    </>
  );
};

export const buildParticipationDisplay = ({
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
}) => {
  let statusLabel = 'Not joined';
  let statusTone = 'neutral';
  let statusMessage = 'You are not part of this activity yet.';

  if (isUserFacilitator && isUserParticipant) {
    statusLabel = 'Facilitator and participant';
    statusTone = 'success';
    statusMessage = 'You are facilitating and participating in this activity.';
  } else if (isUserFacilitator) {
    statusLabel = 'Facilitator';
    statusTone = 'success';
    statusMessage = 'You are facilitating this activity.';
  } else if (isUserParticipant) {
    statusLabel = 'Participant';
    statusTone = 'success';
    statusMessage = 'You are participating in this activity.';
  } else if (hasRequestedFacilitator && hasRequestedParticipant) {
    statusLabel = 'Requests pending';
    statusTone = 'warning';
    statusMessage = 'Your facilitator and participant requests are waiting for approval.';
  } else if (hasRequestedFacilitator) {
    statusLabel = 'Facilitator request pending';
    statusTone = 'warning';
    statusMessage = 'Your facilitator request is waiting for approval.';
  } else if (hasRequestedParticipant) {
    statusLabel = 'Participant request pending';
    statusTone = 'warning';
    statusMessage = 'Your participant request is waiting for approval.';
  } else if (!hasParticipantSpace && !hasFacilitatorSpace) {
    statusLabel = 'Currently full';
    statusTone = 'muted';
    statusMessage = 'There are no participant or facilitator spots available right now.';
  } else if (!hasParticipantSpace) {
    statusLabel = 'Participant spots full';
    statusTone = 'muted';
    statusMessage = 'Participant spots are currently full, but you may still be able to facilitate.';
  } else if (!hasFacilitatorSpace) {
    statusLabel = 'Facilitator spots full';
    statusTone = 'muted';
    statusMessage = 'Facilitator spots are currently full, but participant spots are still available.';
  } else {
    statusLabel = 'Available to join';
    statusTone = 'neutral';
    statusMessage = 'You are not part of this activity yet.';
  }

  return {
    statusLabel,
    statusTone,
    statusMessage,
    facilitatorSummary: formatCapacity(facilitatorCount, facilitatorLimit, 'filled'),
    participantSummary: formatCapacity(participantCount, participantLimit, 'filled'),
    canRequestFacilitator: !isUserFacilitator && !hasRequestedFacilitator && hasFacilitatorSpace,
    canRequestParticipant: !isUserParticipant && !hasRequestedParticipant && hasParticipantSpace,
  };
};

export default ParticipationStatusSection;
