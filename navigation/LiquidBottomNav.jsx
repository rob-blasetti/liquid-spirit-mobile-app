import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';

const ACTIVE_TAB_BACKGROUND = themeVariables.greyColor;
const NAV_TINT_COLOR = 'rgba(18,18,18,0.2)';

const getLiquidGlassModule = () => {
  try {
    const { LiquidGlassView, isLiquidGlassSupported } = require('@callstack/liquid-glass');
    return { LiquidGlassView, isLiquidGlassSupported: !!isLiquidGlassSupported };
  } catch (error) {
    if (__DEV__) {
      console.warn('Liquid glass native module unavailable; using fallback view.', error);
    }
    return {
      LiquidGlassView: ({ children, style }) => <View style={style}>{children}</View>,
      isLiquidGlassSupported: false,
    };
  }
};

const { LiquidGlassView, isLiquidGlassSupported } = getLiquidGlassModule();

const LiquidBottomNav = ({ state, descriptors, navigation, insetBottom = 0, chatBadgeCount = 0 }) => {
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const [tabLayouts, setTabLayouts] = useState({});

  const layoutReady = useMemo(
    () => Object.keys(tabLayouts).length === state.routes.length && state.routes.length > 0,
    [state.routes.length, tabLayouts],
  );

  useEffect(() => {
    const targetIndex = state.index;
    const layout = tabLayouts[targetIndex];
    if (!layout) return;
    Animated.timing(indicatorX, {
      toValue: layout.x,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    Animated.timing(indicatorWidth, {
      toValue: layout.width,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [state.index, tabLayouts, layoutReady, indicatorWidth, indicatorX]);

  const labelForRoute = (route, options) => {
    if (options?.tabBarLabel !== undefined) {
      return options.tabBarLabel;
    }
    if (options?.title !== undefined) {
      return options.title;
    }
    return route.name;
  };

  const handleTabLayout = useCallback((index, nativeLayout) => {
    const { x, width } = nativeLayout;
    setTabLayouts((prev) => {
      if (prev[index]?.x === x && prev[index]?.width === width) return prev;
      return { ...prev, [index]: { x, width } };
    });
    if (Object.keys(tabLayouts).length === 0) {
      indicatorX.setValue(x);
      indicatorWidth.setValue(width);
    }
  }, [indicatorWidth, indicatorX, tabLayouts]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: insetBottom ? insetBottom : 2,
        },
      ]}
      pointerEvents="box-none"
    >
      <LiquidGlassView
        interactive
        effect="regular"
        tintColor={NAV_TINT_COLOR}
        style={[styles.bar, !isLiquidGlassSupported && styles.barFallback]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              transform: [{ translateX: indicatorX }],
              width: indicatorWidth,
              opacity: layoutReady ? 1 : 0,
            },
          ]}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const isActive = focused;
          const { options } = descriptors[route.key] || {};
          const baseIcon = options?.tabBarIconName || options?.tabBarIcon || 'ellipse-outline';
          const iconName =
            typeof baseIcon === 'string'
              ? isActive
                ? baseIcon.replace(/-outline$/, '')
                : baseIcon
              : undefined;
          const label = labelForRoute(route, options);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) {
              return;
            }
            if (!focused) {
              navigation.navigate(route.name);
            }
          };
          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={focused ? { selected: true } : {}}
                  accessibilityLabel={options?.tabBarAccessibilityLabel || `${label}, tab`}
                  accessibilityHint={focused ? undefined : `Navigates to ${label}`}
                  testID={options?.tabBarTestID}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={1}
                  style={styles.tabButton}
                  onLayout={({ nativeEvent }) => handleTabLayout(index, nativeEvent.layout)}
            >
              <View style={[styles.tabPill, isActive && !isLiquidGlassSupported && styles.tabPillFallback]}>
                <View style={styles.tabIcon}>
                  {typeof baseIcon === 'string' ? (
                    <Ionicons
                      name={iconName}
                      size={18}
                      color={isActive ? themeVariables.primaryColor : themeVariables.blackColor}
                    />
                  ) : (
                    baseIcon?.({ focused: isActive, color: isActive ? themeVariables.primaryColor : themeVariables.blackColor, size: 18 })
                  )}
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]} numberOfLines={1}>
                  {label}
                </Text>
                {route.name === 'Chat' && chatBadgeCount > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>{Math.min(chatBadgeCount, 99)}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </LiquidGlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'stretch',
    paddingHorizontal: 12,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 6,
    borderRadius: 999,
    columnGap: 2,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  barFallback: {
    backgroundColor: 'rgba(18,18,18,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 0,
    borderRadius: 16,
    minWidth: 68,
  },
  tabPill: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 18,
  },
  tabPillFallback: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    backgroundColor: ACTIVE_TAB_BACKGROUND,
    borderRadius: 999,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    color: themeVariables.blackColor,
    opacity: 0.7,
    fontSize: 10.4,
    textAlign: 'center',
    paddingHorizontal: 0,
  },
  tabLabelActive: {
    color: themeVariables.primaryColor,
    opacity: 1,
    fontWeight: '700',
  },
  chatBadge: {
    position: 'absolute',
    top: 4,
    right: 12,
    backgroundColor: themeVariables.alertErrorBg,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBadgeText: {
    color: themeVariables.whiteColor,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default LiquidBottomNav;
