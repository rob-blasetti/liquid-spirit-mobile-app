import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';

const LiquidGlassButton = ({
  title,
  onPress,
  intensity = 20,
  children,
  style,
  containerStyle,
  textStyle,
  disabled,
  testID,
  withHighlight = true,
  borderRadius = 24,
  ...pressableProps
}) => {
  const inset = Math.max(Math.min(borderRadius * 0.55, 14), 8);
  const sheenWidth = borderRadius > 26 ? '78%' : '92%';
  const sheenHeight = borderRadius > 26 ? '55%' : '50%';

  return (
    <Pressable
      {...pressableProps}
      onPress={onPress}
      disabled={disabled || !onPress}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={({ pressed }) => [
        styles.wrapper,
        { borderRadius: Math.max(borderRadius - 4, 0) },
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      testID={testID}
    >
      <View style={[styles.container, { borderRadius }, containerStyle]}>
        <BlurView
          style={styles.blur}
          blurType="light"
          blurAmount={intensity}
          reducedTransparencyFallbackColor="white"
        />
        <View
          pointerEvents="none"
          style={[
            styles.topSheen,
            {
              borderRadius: Math.max(borderRadius - 2, 0),
              width: sheenWidth,
              height: sheenHeight,
            },
          ]}
        />
        {withHighlight && (
          <View
            pointerEvents="none"
            style={[
              styles.highlight,
              {
                borderRadius: Math.max(borderRadius - 2, 0),
                top: inset,
                bottom: inset,
                left: inset,
                right: inset,
              },
            ]}
          />
        )}
        {children ? (
          children
        ) : (
          <Text style={[styles.text, textStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default LiquidGlassButton;

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0b1f33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  container: {
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderWidth: 1.25,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 36,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  highlight: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
  },
  topSheen: {
    position: 'absolute',
    top: 1,
    height: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
