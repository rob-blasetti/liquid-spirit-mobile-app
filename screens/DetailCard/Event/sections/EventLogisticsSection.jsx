import React from 'react';
import { View, Text } from 'react-native';

const LogisticsRow = ({ styles, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.eventLogisticsRow}>
      <Text style={styles.eventLogisticsLabel}>{label}</Text>
      <Text style={styles.eventLogisticsValue}>{value}</Text>
    </View>
  );
};

const EventLogisticsSection = ({
  styles,
  venueName,
  addressText,
  attendanceMode,
  timeRange,
}) => {
  const hasAnyValue = [venueName, addressText, attendanceMode, timeRange].some(Boolean);
  if (!hasAnyValue) return null;

  return (
    <>
      <Text style={styles.mapTitle}>Event Logistics</Text>
      <View style={styles.eventLogisticsCard}>
        <LogisticsRow styles={styles} label="Venue" value={venueName} />
        <LogisticsRow styles={styles} label="Address" value={addressText} />
        <LogisticsRow styles={styles} label="Format" value={attendanceMode} />
        <LogisticsRow styles={styles} label="Time" value={timeRange} />
      </View>
      <View style={styles.divider} />
    </>
  );
};

export default EventLogisticsSection;
