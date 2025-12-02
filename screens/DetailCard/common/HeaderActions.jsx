import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../../../styles/theme';
import LiquidGlassButton from './LiquidGlassButton';

const HeaderActionButton = ({
  icon,
  onPress,
  color = themeVariables.blackColor,
  size = 20,
  disabled,
  loading,
  style,
  testID,
}) => (
  <LiquidGlassButton
    onPress={onPress}
    disabled={disabled || loading || !onPress}
    style={[styles.actionButton, style]}
    containerStyle={styles.glassContainer}
    intensity={26}
    testID={testID}
  >
    {loading ? (
      <ActivityIndicator size="small" color={color} />
    ) : (
      <Ionicons name={icon} size={size} color={color} />
    )}
  </LiquidGlassButton>
);

const HeaderActionGroup = ({ children, style }) => (
  <View style={[styles.actionsRow, style]}>{children}</View>
);

export { HeaderActionButton, HeaderActionGroup };

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginHorizontal: 4,
  },
  glassContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 36,
  },
});
