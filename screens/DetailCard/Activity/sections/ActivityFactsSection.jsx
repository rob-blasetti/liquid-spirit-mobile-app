import React from 'react';
import { View, Text } from 'react-native';

const FactItem = ({ styles, label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.activityFactItem}>
      <Text style={styles.activityFactLabel}>{label}</Text>
      <Text style={styles.activityFactValue}>{value}</Text>
    </View>
  );
};

const ActivityFactsSection = ({
  styles,
  communityName,
  dayOfWeek,
  timeMain,
  frequency,
  gradeLabel,
  curriculumName,
  locationLabel,
  onlineLabel,
}) => {
  const hasAnyFact = [
    communityName,
    dayOfWeek,
    timeMain,
    frequency,
    gradeLabel,
    curriculumName,
    locationLabel,
    onlineLabel,
  ].some(Boolean);

  if (!hasAnyFact) return null;

  return (
    <>
      <Text style={styles.mapTitle}>Activity Details</Text>
      <View style={styles.activityFactsCard}>
        <FactItem styles={styles} label="Community" value={communityName} />
        <FactItem styles={styles} label="Day" value={dayOfWeek} />
        <FactItem styles={styles} label="Time" value={timeMain} />
        <FactItem styles={styles} label="Frequency" value={frequency} />
        <FactItem styles={styles} label="Grade" value={gradeLabel} />
        <FactItem styles={styles} label="Curriculum" value={curriculumName} />
        <FactItem styles={styles} label="Location" value={locationLabel} />
        <FactItem styles={styles} label="Online" value={onlineLabel} />
      </View>
      <View style={styles.divider} />
    </>
  );
};

export default ActivityFactsSection;
