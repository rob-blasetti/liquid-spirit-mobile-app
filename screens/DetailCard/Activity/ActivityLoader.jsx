import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';

import themeVariables from '../../../styles/theme';
import ActivityLayout from './ActivityLayout';

const {height: windowHeight} = Dimensions.get('window');

const ActivityLoader = ({
  loading,
  error,
  hydratedActivity,
  hydratedPrefillActivity,
  scrollContentStyle,
  scrollRef,
  children,
}) => {
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading && hydratedPrefillActivity) {
    return (
      <ActivityLayout
        scrollContentStyle={scrollContentStyle}
        scrollRef={scrollRef}>
        {children(hydratedPrefillActivity)}
      </ActivityLayout>
    );
  }

  if (loading || !hydratedActivity) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
        <Text style={styles.loadingText}>
          {loading ? 'Loading activity...' : 'Activity details not available.'}
        </Text>
      </View>
    );
  }

  return (
    <ActivityLayout
      scrollContentStyle={scrollContentStyle}
      scrollRef={scrollRef}>
      {children(hydratedActivity)}
    </ActivityLayout>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    minHeight: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: themeVariables.textColor || '#555',
  },
  errorText: {color: 'red', fontSize: 16},
});

export default ActivityLoader;
