import React from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';

let LiquidGlassView = View;
let liquidGlassSupported = false;

try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassView = liquidGlass?.LiquidGlassView || View;
  const support = liquidGlass?.isLiquidGlassSupported;
  liquidGlassSupported = typeof support === 'function' ? support() : !!support;
} catch (error) {
  LiquidGlassView = View;
  liquidGlassSupported = false;
}

const LiquidGlassIconButton = ({
  iconName = 'chevron-back',
  iconColor = themeVariables.blackColor,
  iconSize = 20,
  icon,
  children,
  onPress,
  tintColor = 'rgba(255,255,255,0.28)',
  style,
  glassStyle,
  accessibilityLabel,
  disabled,
  hasShadow = false,
  forceFallback = false,
  ...pressableProps
}) => {
  const iconElement = icon || (
    <Ionicons
      name={iconName}
      color={iconColor}
      size={iconSize}
    />
  );
  const content = children || iconElement;

  const iosVersion = Platform.OS === 'ios'
    ? (typeof Platform.Version === 'string' ? parseFloat(Platform.Version) : Platform.Version)
    : 0;
  const isBuggyIos = Platform.OS === 'ios' && Number.isFinite(iosVersion) && iosVersion >= 26;
  const shouldUseFallback = forceFallback || !liquidGlassSupported || isBuggyIos;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || iconName}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        hasShadow && styles.shadow,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View
        style={[
          styles.frame,
          shouldUseFallback && styles.fallbackFrame,
          glassStyle,
        ]}
      >
        {shouldUseFallback && (
          <>
            <View style={styles.fallbackHighlight} pointerEvents="none" />
            <View style={styles.fallbackSheen} pointerEvents="none" />
          </>
        )}
        {!shouldUseFallback && (
          <LiquidGlassView
            interactive
            effect="regular"
            tintColor={tintColor}
            style={styles.glassOverlay}
          />
        )}
        <View style={styles.iconSlot}>{content}</View>
      </View>
    </Pressable>
  );
};

export default LiquidGlassIconButton;

const styles = StyleSheet.create({
  pressable: {
    borderRadius: themeVariables.borderRadiusPill,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  frame: {
    borderRadius: themeVariables.borderRadiusPill,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  fallbackFrame: {
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderColor: 'rgba(255,255,255,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fallbackHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: themeVariables.borderRadiusPill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  fallbackSheen: {
    position: 'absolute',
    top: 1,
    left: '8%',
    right: '8%',
    height: '55%',
    borderRadius: themeVariables.borderRadiusPill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: themeVariables.borderRadiusPill,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  iconSlot: { alignItems: 'center', justifyContent: 'center' },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.96,
  },
  disabled: {
    opacity: 0.6,
  },
});
