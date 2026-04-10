import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

const UserBadgeCellSkeleton = ({contained = false, containerStyle}) => {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.userItem,
        contained ? styles.userItemContained : null,
        containerStyle,
        {opacity},
      ]}>
      <View style={styles.avatar} />
      <View style={styles.content}>
        <View style={[styles.line, styles.nameLine]} />
        <View style={[styles.line, styles.typeLine]} />
        <View style={styles.badgeRow}>
          <View style={styles.badge} />
          <View style={styles.badge} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 12,
    marginBottom: 10,
  },
  userItemContained: {
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F6F7FB',
    borderWidth: 1,
    borderColor: '#E8EBF0',
    marginRight: 0,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E4E7EE',
  },
  content: {
    flex: 1,
    marginLeft: 6,
    minWidth: 0,
  },
  line: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E4E7EE',
  },
  nameLine: {
    width: '72%',
  },
  typeLine: {
    width: '48%',
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E4E7EE',
    marginRight: 4,
  },
});

export default UserBadgeCellSkeleton;
