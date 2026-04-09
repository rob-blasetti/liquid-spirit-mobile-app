import React from 'react';
import { View, Text } from 'react-native';

const EventOverviewSection = ({
  styles,
  title,
  eventType,
  summary,
}) => {
  const hasSummary = Boolean(summary);

  return (
    <>
      <Text style={styles.mapTitle}>Overview</Text>
      <View style={styles.eventOverviewCard}>
        <Text style={styles.eventOverviewTitle}>{title}</Text>
        {eventType ? <Text style={styles.eventOverviewSubtitle}>{eventType}</Text> : null}

        {hasSummary ? (
          <Text style={styles.eventOverviewSummary}>{summary}</Text>
        ) : (
          <Text style={styles.eventOverviewPlaceholder}>
            More details about this event will appear here as they are added.
          </Text>
        )}
      </View>
      <View style={styles.divider} />
    </>
  );
};

export default EventOverviewSection;
