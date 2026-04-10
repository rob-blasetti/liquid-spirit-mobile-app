import React from 'react';
import { View, Text } from 'react-native';
import {formatLongSessionDate} from '../utils/activityHelpers';

const formatSessionDate = (session) => {
  const value = session?.dateObj || (session?.date ? new Date(session.date) : null);
  if (!value || Number.isNaN(value.getTime?.())) return 'Date to be confirmed';
  return formatLongSessionDate(value);
};

const formatSessionTime = (session) => {
  const value = session?.dateObj || (session?.date ? new Date(session.date) : null);
  if (!value || Number.isNaN(value.getTime?.())) return null;
  return value.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const SessionSummarySection = ({
  styles,
  totalSessions,
  upcomingCount,
  nextSession,
}) => {
  const nextDate = nextSession ? formatSessionDate(nextSession) : 'No upcoming session';
  const nextTime = nextSession ? formatSessionTime(nextSession) : null;
  const nextStatus = nextSession?.status || null;

  return (
    <>
      <Text style={styles.mapTitle}>Session Snapshot</Text>
      <View style={styles.sessionSummaryCard}>
        <View style={styles.sessionSummaryTopRow}>
          <View style={styles.sessionSummaryMetric}>
            <Text style={styles.sessionSummaryMetricValue}>{totalSessions}</Text>
            <Text style={styles.sessionSummaryMetricLabel}>Total sessions</Text>
          </View>
          <View style={styles.sessionSummaryMetricDivider} />
          <View style={styles.sessionSummaryMetric}>
            <Text style={styles.sessionSummaryMetricValue}>{upcomingCount}</Text>
            <Text style={styles.sessionSummaryMetricLabel}>Upcoming</Text>
          </View>
        </View>

        <View style={styles.sessionSummaryNextBlock}>
          <Text style={styles.sessionSummaryNextLabel}>Next Upcoming Session</Text>
          <Text style={styles.sessionSummaryNextDate}>{nextDate}</Text>
          {nextTime ? <Text style={styles.sessionSummaryNextMeta}>{nextTime}</Text> : null}
          {nextStatus ? <Text style={styles.sessionSummaryNextMeta}>Status: {nextStatus}</Text> : null}
        </View>
      </View>
      <View style={styles.divider} />
    </>
  );
};

export default SessionSummarySection;
