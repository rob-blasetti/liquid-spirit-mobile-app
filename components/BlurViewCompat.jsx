import React, { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const ANDROID_OVERLAY_COLORS = {
  light: 'rgba(255, 255, 255, 0.2)',
  xlight: 'rgba(255, 255, 255, 0.75)',
  dark: 'rgba(16, 12, 12, 0.64)',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const NativeBlurView = Platform.OS === 'ios' ? require('@react-native-community/blur').BlurView : null;

const getAndroidTintColor = ({
  blurType = 'dark',
  blurAmount = 10,
  overlayColor,
  reducedTransparencyFallbackColor,
  enabled = true,
}) => {
  if (!enabled) {
    return 'transparent';
  }

  if (overlayColor) {
    return overlayColor;
  }

  if (reducedTransparencyFallbackColor) {
    return reducedTransparencyFallbackColor;
  }

  const baseColor = ANDROID_OVERLAY_COLORS[blurType] || ANDROID_OVERLAY_COLORS.dark;
  const normalizedAmount = clamp(blurAmount / 32, 0.2, 1);
  const alpha = blurType === 'xlight' ? 0.72 : blurType === 'light' ? 0.28 : 0.64;
  return baseColor.replace(/[\d.]+\)\s*$/, `${(alpha * normalizedAmount).toFixed(2)})`);
};

const BlurViewCompat = forwardRef(
  (
    {
      style,
      children,
      blurType = 'dark',
      blurAmount = 10,
      overlayColor,
      reducedTransparencyFallbackColor,
      enabled = true,
      ...rest
    },
    ref
  ) => {
    if (Platform.OS === 'ios') {
      return (
        <NativeBlurView
          {...rest}
          ref={ref}
          style={style}
          blurType={blurType}
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor={reducedTransparencyFallbackColor}
        >
          {children}
        </NativeBlurView>
      );
    }

    return (
      <View
        {...rest}
        ref={ref}
        style={[
          style,
          styles.androidBase,
          {
            backgroundColor: getAndroidTintColor({
              blurType,
              blurAmount,
              overlayColor,
              reducedTransparencyFallbackColor,
              enabled,
            }),
          },
        ]}
      >
        {children}
      </View>
    );
  }
);

export default BlurViewCompat;

const styles = StyleSheet.create({
  androidBase: {
    overflow: 'hidden',
  },
});
