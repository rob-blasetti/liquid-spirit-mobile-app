import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import themeVariables from '../styles/theme';

const SkeletonPost = () => {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Header: avatar + two lines */}
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={[styles.line, { width: '50%' }]} />
          <View style={[styles.line, { width: '30%', marginTop: 6 }]} />
        </View>
      </View>
      {/* Media rectangle */}
      <View style={styles.media} />
      {/* Footer line */}
      <View style={[styles.line, { width: '40%', marginTop: 12 }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    marginBottom: 8,
    marginTop: 8,
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e1e1e1',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  line: {
    height: 12,
    backgroundColor: '#e1e1e1',
    borderRadius: 6,
  },
  media: {
    marginTop: 8,
    height: 220,
    backgroundColor: '#ddd',
    borderRadius: 10,
  },
});

export default SkeletonPost;

