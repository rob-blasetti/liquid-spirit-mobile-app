import React from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import SwipeToCloseScrollView from '../../../components/SwipeToCloseScrollView';
import themeVariables from '../../../styles/theme';

const ActivityLayout = ({children, scrollContentStyle, scrollRef}) => (
  <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
    <StatusBar
      animated={true}
      translucent={true}
      backgroundColor="transparent"
      barStyle="light-content"
    />
    <SwipeToCloseScrollView
      ref={scrollRef}
      style={styles.scrollView}
      contentContainerStyle={scrollContentStyle}
      overScrollMode="always"
      scrollEventThrottle={16}
      threshold={0}>
      {children}
    </SwipeToCloseScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor || '#fff',
  },
});

export default ActivityLayout;
