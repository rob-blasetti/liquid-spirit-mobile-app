import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import themeVariables from '../styles/theme';

export default function AppSnackbar({
  visible,
  message,
  onDismiss,
  duration = 2000,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (!visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 24,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    if (duration > 0 && typeof onDismiss === 'function') {
      hideTimeoutRef.current = setTimeout(() => {
        onDismiss();
      }, duration);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [duration, onDismiss, opacity, translateY, visible]);

  if (!visible && !message) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.portal}>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.container,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
        {typeof onDismiss === 'function' ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onDismiss}
            style={styles.dismissButton}
          >
            <Text style={styles.dismissText}>Dismiss</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  portal: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 20,
  },
  container: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  message: {
    flex: 1,
    marginRight: 12,
    color: themeVariables.whiteColor,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  dismissButton: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  dismissText: {
    color: themeVariables.primaryColor,
    fontSize: 13,
    fontWeight: '700',
  },
});
