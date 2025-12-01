import React from 'react';
import { View, Text } from 'react-native';

const GuidelinesSection = ({ guidelines, styles }) => {
  if (!guidelines) return null;
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Activity Guidelines</Text>
      <Text style={styles.guidelinesText}>{guidelines}</Text>
    </View>
  );
};

export default GuidelinesSection;
