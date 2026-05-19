import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';
import themeVariables from '../styles/theme';

const Toggle = ({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const { isDarkMode } = useTheme();
  const enabled = Boolean(value);
  const trackColor = enabled
    ? themeVariables.primaryColor
    : isDarkMode
      ? 'rgba(255, 255, 255, 0.24)'
      : themeVariables.borderMutedColor;
  const thumbColor = enabled && !isDarkMode
    ? themeVariables.whiteColor
    : isDarkMode
      ? enabled
        ? themeVariables.surfaceDarkBaseColor
        : themeVariables.textSoftInverseColor
      : themeVariables.whiteColor;
  const borderColor = enabled
    ? themeVariables.primaryColor
    : isDarkMode
      ? 'rgba(255, 255, 255, 0.32)'
      : themeVariables.borderMutedColor;

  const handlePress = () => {
    if (disabled) return;
    onValueChange?.(!enabled);
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={[styles.pressable, style]}
      hitSlop={8}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: trackColor,
            borderColor,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              transform: [{ translateX: enabled ? 22 : 0 }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 56,
  },
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    padding: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

export default Toggle;
