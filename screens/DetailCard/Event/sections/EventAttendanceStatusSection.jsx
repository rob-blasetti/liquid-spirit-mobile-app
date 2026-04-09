import React from 'react';
import { View, Text, Pressable } from 'react-native';

const EventAttendanceStatusSection = ({
  styles,
  hasJoined,
  attendeeCount,
  canJoin,
  onJoin,
  lifecycleLabel,
  lifecycleTone,
  lifecycleMessage,
  capacitySummary,
}) => {
  const statusLabel = hasJoined ? 'Attending' : 'Not attending yet';
  const statusTone = hasJoined ? 'success' : 'neutral';
  const statusMessage = hasJoined
    ? 'You are attending this event.'
    : 'You can join this event and be added to the attendee list.';
  const actionLabel = hasJoined
    ? 'You are attending'
    : canJoin
      ? 'Attend this event'
      : 'Attendance unavailable';

  return (
    <>
      <Text style={styles.mapTitle}>Your Attendance</Text>
      <View style={styles.eventAttendanceCard}>
        <View style={[styles.eventAttendanceBadge, styles[`eventAttendanceBadge_${statusTone}`]]}>
          <Text style={[styles.eventAttendanceBadgeText, styles[`eventAttendanceBadgeText_${statusTone}`]]}>
            {statusLabel}
          </Text>
        </View>

        <Text style={styles.eventAttendanceMessage}>{statusMessage}</Text>

        <View style={styles.eventAttendanceDualRow}>
          <View style={styles.eventAttendanceCountBox}>
            <Text style={styles.eventAttendanceCountValue}>{attendeeCount}</Text>
            <Text style={styles.eventAttendanceCountLabel}>People attending</Text>
          </View>
          <View style={styles.eventAttendanceLifecycleBox}>
            <View style={[styles.eventAttendanceMiniBadge, styles[`eventAttendanceMiniBadge_${lifecycleTone}`]]}>
              <Text style={[styles.eventAttendanceMiniBadgeText, styles[`eventAttendanceMiniBadgeText_${lifecycleTone}`]]}>
                {lifecycleLabel}
              </Text>
            </View>
            <Text style={styles.eventAttendanceLifecycleMessage}>{lifecycleMessage}</Text>
            {capacitySummary ? <Text style={styles.eventAttendanceLifecycleCapacity}>{capacitySummary}</Text> : null}
          </View>
        </View>

        <Pressable
          disabled={!canJoin}
          onPress={onJoin}
          style={[
            styles.eventAttendanceAction,
            canJoin ? styles.eventAttendanceActionPrimary : styles.eventAttendanceActionMuted,
          ]}
        >
          <Text
            style={[
              styles.eventAttendanceActionText,
              canJoin ? styles.eventAttendanceActionTextPrimary : styles.eventAttendanceActionTextMuted,
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      </View>
      <View style={styles.divider} />
    </>
  );
};

export default EventAttendanceStatusSection;
