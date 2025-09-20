import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';

const BANNER_HEIGHT = 50;

/**
 * SlideBanner displays a top banner with slide-in/out animation.
 * Props:
 *   message: string to display
 *   onClose: callback when banner is dismissed
 *   duration: auto-hide duration (ms)
 */
const SlideBanner = ({ message, onClose, duration = 4000, slideTo = 0 }) => {
  const bannerAnim = useRef(new Animated.Value(-BANNER_HEIGHT)).current;
  const timerRef = useRef(null);

  const hide = useCallback(() => {
    Animated.timing(bannerAnim, {
      toValue: -BANNER_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose && onClose();
    });
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [bannerAnim, onClose]);

  useEffect(() => {
  // slide in to slideTo position
    Animated.timing(bannerAnim, {
      toValue: slideTo,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // auto-hide
    timerRef.current = setTimeout(() => hide(), duration);
    return () => clearTimeout(timerRef.current);
  }, [bannerAnim, hide, duration]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: bannerAnim }] },
      ]}
      pointerEvents="box-none"
    >
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={hide} style={styles.close}>
        <Ionicons name="close" size={20} color={themeVariables.alertTextColor} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: themeVariables.alertErrorBg,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  message: {
    color: themeVariables.alertTextColor,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  close: {
    padding: 4,
  },
});

export default SlideBanner;
