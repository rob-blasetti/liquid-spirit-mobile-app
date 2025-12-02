import React, { useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Dimensions, Easing } from 'react-native';
import { BlurView } from '@react-native-community/blur';
// import { Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import themeVariables from '../styles/theme';
import HomeStackNavigator from './HomeStackNavigator';
import DiscoverStackNavigator from './DiscoverStackNavigator';
import ChatStackNavigator from './ChatStackNavigator';
import SocialStackNavigator from './SocialStackNavigator';
// Removed NotificationScreen import; Notifications handled via Home screen banner
import ProfileStackNavigator from '../navigation/ProfileStackNavigator';

// 1. Import the WelcomeModal
import WelcomeModal from '../modal/WelcomeModal';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: 'home-outline',
  Discover: 'compass-outline',
  Feed: 'albums-outline',
  Chat: 'chatbubbles-outline',
  Profile: 'person-outline',
};
const TAB_BAR_HEIGHT = 80;
const FAB_VERTICAL_OFFSET = 66;
const FAB_HORIZONTAL_OFFSET = 20;

const getLeafRoute = (input) => {
  if (!input) return null;
  if (Array.isArray(input.routes)) {
    const index = input.index ?? 0;
    return getLeafRoute(input.routes[index]);
  }
  if (input.state) {
    return getLeafRoute(input.state);
  }
  return input;
};

const extractActivityContext = (params = {}) => {
  if (!params) return { activityId: '', activityTitle: '' };
  const candidates = [
    params.activityId,
    params.activity?.id,
    params.activity?._id,
    params.activityPreload?.id,
    params.activityPreload?._id,
  ];
  const match = candidates.find(Boolean);
  const activityId = match ? String(match) : '';
  const activity = params.activity || params.activityPreload || {};
  const activityTitle =
    params.activityTitle ||
    activity.title ||
    params.title ||
    '';
  const facilitators =
    Array.isArray(params.prefilledFacilitators) ? params.prefilledFacilitators : activity.facilitators || [];
  const participants =
    Array.isArray(params.prefilledParticipants) ? params.prefilledParticipants : activity.participants || [];
  return { activityId, activityTitle, facilitators, participants };
};

const BottomBar = ({ initialPosts, homeOverview }) => {
  const { isLoggedIn, chatNotificationCount, user } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const userId = user?._id || user?.id;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const parentNavigation = navigation.getParent?.() || navigation;
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollToTop, setScrollToTop] = useState(false);
  const [focusedRoute, setFocusedRoute] = useState(null);
  const iconScale = useRef(new Animated.Value(1)).current;
  const [visibleAction, setVisibleAction] = useState(null);

  const handleCreateActivity = useCallback(() => {
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    if (!userId) return;
    parentNavigation.navigate('CreateActivity', { communityId, userId });
  }, [isLoggedIn, parentNavigation, communityId, userId]);

  const handleCreatePost = useCallback(() => {
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    parentNavigation.navigate('CreatePostModal');
  }, [isLoggedIn, parentNavigation]);

  const handleNewMessage = useCallback(() => {
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    parentNavigation.navigate('Main', {
      screen: 'Chat',
      params: { screen: 'NewMessage' },
    });
  }, [isLoggedIn, parentNavigation]);

  const handleCreateSession = useCallback(
    (activityContext) => {
      if (!isLoggedIn) {
        setModalVisible(true);
        return;
      }
      const { activityId, activityTitle, facilitators, participants } = activityContext || {};
      if (!activityId) {
        Alert.alert(
          'Activity unavailable',
          'Unable to create a session because the activity information is missing.',
        );
        return;
      }
      parentNavigation.navigate('CreateSession', {
        activityId,
        activityTitle,
        communityId,
        prefilledFacilitators: facilitators,
        prefilledParticipants: participants,
      });
    },
    [communityId, isLoggedIn, parentNavigation],
  );

  const fabBottom = insets.bottom + FAB_VERTICAL_OFFSET;

  const syncFocusedRoute = useCallback(() => {
    const tabState = navigation.getState?.();
    if (!tabState?.routes || !tabState.routes.length) {
      setFocusedRoute(null);
      return;
    }
    const activeRoute = tabState.routes[tabState.index ?? 0];
    const leafRoute = getLeafRoute(activeRoute);
    setFocusedRoute({
      name: leafRoute?.name,
      params: leafRoute?.params,
      tab: activeRoute?.name,
    });
  }, [navigation]);

  useEffect(() => {
    syncFocusedRoute();
    const unsubscribe = navigation.addListener?.('state', syncFocusedRoute);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, syncFocusedRoute]);

  const defaultAction = useMemo(
    () => ({
      key: 'create-post',
      icon: 'create-outline',
      label: 'Create Post',
      onPress: handleCreatePost,
    }),
    [handleCreatePost],
  );

  const currentAction = useMemo(() => {
    const routeName = focusedRoute?.name;
    if (!routeName) {
      return defaultAction;
    }
    if (routeName === 'ActivityDetailCard') {
      const activityContext = extractActivityContext(focusedRoute?.params || {});
      return {
        key: 'create-session',
        icon: 'time-outline',
        label: 'New Session',
        onPress: () => handleCreateSession(activityContext),
        disabled: !activityContext.activityId,
      };
    }
    if (routeName === 'Activities') {
      return {
        key: 'create-activity',
        icon: 'add-circle-outline',
        label: 'Create Activity',
        onPress: handleCreateActivity,
      };
    }
    if (routeName === 'ChatScreen' || routeName === 'ChatDetail' || routeName === 'Chat') {
      return {
        key: 'new-conversation',
        icon: 'chatbubble-ellipses-outline',
        label: 'New Conversation',
        onPress: handleNewMessage,
      };
    }
    if (routeName === 'DiscoverScreen' || (focusedRoute?.tab === 'Discover' && !routeName)) {
      return {
        key: 'discover-create-activity',
        icon: 'add-circle-outline',
        label: 'Create Activity',
        onPress: handleCreateActivity,
      };
    }
    if (routeName === 'Discover') {
      return {
        key: 'discover-create-activity',
        icon: 'add-circle-outline',
        label: 'Create Activity',
        onPress: handleCreateActivity,
      };
    }
    if (routeName === 'HomeScreen' || routeName === 'SocialFeed') {
      return defaultAction;
    }
    return defaultAction;
  }, [defaultAction, focusedRoute, handleCreateActivity, handleCreateSession, handleNewMessage]);

  useEffect(() => {
    if (!currentAction) return;
    if (!visibleAction) {
      setVisibleAction(currentAction);
      return;
    }
    if (visibleAction.key === currentAction.key) {
      setVisibleAction(currentAction);
      return;
    }
    Animated.timing(iconScale, {
      toValue: 0.2,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setVisibleAction(currentAction);
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }).start();
    });
  }, [currentAction, iconScale, visibleAction]);

  const hideFab =
    focusedRoute?.name === 'NewMessage' ||
    focusedRoute?.name === 'ChatDetail';

  const handleFabPress = () => {
    if (!currentAction || currentAction.disabled) {
      if (!isLoggedIn) {
        setModalVisible(true);
      }
      return;
    }
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    currentAction.onPress?.();
  };

  const LiquidGlassTabBar = ({ state, descriptors, navigation: tabNavigation }) => {
    const insetBottom = insets.bottom || 0;
    const screenWidth = Dimensions.get('window').width;
    const defaultTabWidth = (screenWidth || 1) / (state.routes.length || 1);
    const defaultBlobWidth = Math.max(defaultTabWidth * 0.92, 56);
    const defaultBlobX = (screenWidth - defaultBlobWidth) / 2;
    const [containerWidth, setContainerWidth] = useState(screenWidth);
    const [tabLayouts, setTabLayouts] = useState({});
    const layoutsReady = useMemo(
      () => Object.keys(tabLayouts).length === state.routes.length && containerWidth > 0,
      [containerWidth, state.routes.length, tabLayouts],
    );
    const blobTranslate = useRef(new Animated.Value(defaultBlobX)).current;
    const blobScale = useRef(new Animated.Value(1)).current;
    const blobWidthAnim = useRef(new Animated.Value(defaultBlobWidth)).current;
    const blobProgress = useRef(new Animated.Value(0)).current;
    const hasAnimatedOnce = useRef(false);
    const lastTargetRef = useRef({ x: defaultBlobX, width: defaultBlobWidth });

    const computeBlobTarget = useCallback(() => {
      const fallbackWidth = (containerWidth || screenWidth) / (state.routes.length || 1);
      const targetWidth = Math.max(fallbackWidth * 0.92, 56);
      const targetX = (containerWidth - targetWidth) / 2;
      if (!layoutsReady) {
        return { width: targetWidth, translateX: targetX };
      }
      const layout = tabLayouts[state.index];
      if (!layout) return { width: targetWidth, translateX: targetX };
      const derivedWidth = Math.max(layout.width * 1.0, 58);
      return {
        width: derivedWidth,
        translateX: layout.x + layout.width / 2 - derivedWidth / 2 + 1,
      };
    }, [containerWidth, layoutsReady, screenWidth, state.index, state.routes.length, tabLayouts]);

    useEffect(() => {
      const target = computeBlobTarget();
      // If layout isn't ready yet, set values directly to avoid double animations/jumps
      if (!layoutsReady) {
        blobWidthAnim.setValue(target.width);
        blobTranslate.setValue(target.translateX);
        blobScale.setValue(1);
        return;
      }

      // First ready pass: snap to target without animating to avoid flicker
      if (!hasAnimatedOnce.current) {
        blobWidthAnim.setValue(target.width);
        blobTranslate.setValue(target.translateX);
        blobScale.setValue(1);
        blobProgress.setValue(0);
        lastTargetRef.current = { x: target.translateX, width: target.width };
        hasAnimatedOnce.current = true;
        return;
      }

      // Skip redundant animations if target hasn't changed meaningfully
      const last = lastTargetRef.current;
      if (
        Math.abs(last.x - target.translateX) < 0.5 &&
        Math.abs(last.width - target.width) < 0.5
      ) {
        return;
      }
      lastTargetRef.current = { x: target.translateX, width: target.width };

      console.log('[TabBar] animate blob', {
        toX: target.translateX,
        toWidth: target.width,
        route: state.routes[state.index]?.name,
      });
      blobProgress.setValue(0);
      Animated.parallel([
        Animated.timing(blobWidthAnim, {
          toValue: target.width,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(blobTranslate, {
          toValue: target.translateX,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(blobScale, {
            toValue: 0.94,
            duration: 110,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.spring(blobScale, {
            toValue: 1,
            useNativeDriver: false,
            tension: 200,
            friction: 16,
          }),
        ]),
        Animated.sequence([
          Animated.timing(blobProgress, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(blobProgress, {
            toValue: 0,
            duration: 280,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }, [blobProgress, blobScale, blobTranslate, blobWidthAnim, computeBlobTarget, layoutsReady, state.index, state.routes]);

    return (
      <View style={[styles.glassWrapper, { paddingBottom: insetBottom ? insetBottom / 2 : 12 }]}>
        <View style={styles.glassShadow} />
        <BlurView
          style={styles.glassBlur}
          blurType="light"
          blurAmount={30}
          reducedTransparencyFallbackColor="rgba(30,30,30,0.92)"
        />
        <View style={styles.glassBorder} />
        <View
          style={styles.tabRow}
          onLayout={({ nativeEvent }) => setContainerWidth(nativeEvent.layout.width)}
        >
          <Animated.View
            pointerEvents="none"
          style={[
            styles.activeBlobTrail,
            {
              width: blobWidthAnim,
              transform: [
                { translateX: blobTranslate },
                  {
                    scale: blobProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.12],
                    }),
                  },
              ],
              opacity: blobProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 0.58],
              }),
            },
          ]}
        />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeBlob,
              {
                width: blobWidthAnim,
                transform: [{ translateX: blobTranslate }, { scale: blobScale }],
              },
            ]}
          >
            <View style={styles.activeBlobShine} />
            <View style={styles.activeBlobEdge} />
          </Animated.View>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key] || {};
            const baseIcon = options?.tabBarIconName || tabIcons[route.name] || 'ellipse-outline';
            const iconName = focused ? baseIcon.replace(/-outline$/, '') : baseIcon;
            const onPress = () => {
              console.log('[TabBar] press', {
                from: state.routes[state.index]?.name,
                to: route.name,
              });
              const event = tabNavigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                tabNavigation.navigate(route.name);
              }
            };
            const onLongPress = () => {
              tabNavigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options?.tabBarAccessibilityLabel}
                testID={options?.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.9}
                style={styles.tabButton}
              onLayout={({ nativeEvent }) => {
                const { x, width } = nativeEvent.layout;
                setTabLayouts((prev) => ({ ...prev, [index]: { x, width } }));
                console.log('[TabBar] layout', { route: route.name, x, width });
              }}
              >
                <View style={[styles.tabPill, focused && styles.tabPillFocused]}>
                  <View style={[styles.tabPillGlow, focused && styles.tabPillGlowActive]} />
                  <View style={styles.tabContent}>
                    <Ionicons
                      name={iconName}
                      size={22}
                      color={focused ? themeVariables.primaryColor : themeVariables.blackColor}
                    />
                    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
                      {route.name}
                    </Text>
                  </View>
                  {route.name === 'Chat' && chatNotificationCount > 0 && (
                    <View style={styles.chatBadgeGlass}>
                      <Text style={styles.chatBadgeText}>
                        {Math.min(chatNotificationCount, 99)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarIconName: tabIcons[route.name],
          sceneContainerStyle: { backgroundColor: 'transparent' },
        })}
        tabBar={(props) => (
          <LiquidGlassTabBar {...props} />
        )}
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            const currentRoute = state.routes[state.index]?.name;

            // Require login for other tabs (except Feed)
            if (!isLoggedIn && route.name !== 'Feed') {
              e.preventDefault();
              setModalVisible(true);
              return;
            }

            // Scroll to top on Feed if already active
            if (route.name === 'Feed' && currentRoute === 'Feed') {
              e.preventDefault();
              setScrollToTop((prev) => !prev);
            }
          },
        })}
      >
        <Tab.Screen name="Home">
          {(props) => <HomeStackNavigator {...props} homeOverview={homeOverview} />}
        </Tab.Screen>
        <Tab.Screen name="Discover" component={DiscoverStackNavigator} />
        <Tab.Screen name="Feed">
          {(props) => (
            <SocialStackNavigator
              {...props}
              initialPosts={initialPosts}
              scrollToTop={scrollToTop}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Chat" component={ChatStackNavigator} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>

      {!hideFab && (
        <View pointerEvents="box-none" style={styles.fabPortal}>
          <View style={[styles.fabColumn, { bottom: fabBottom }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                visibleAction?.label || currentAction?.label || 'Create Post'
              }
              style={[
                styles.fab,
                currentAction?.disabled && styles.fabDisabled,
              ]}
              onPress={handleFabPress}
              activeOpacity={0.85}
              disabled={currentAction?.disabled}
            >
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <Ionicons
                  name={visibleAction?.icon || currentAction?.icon || 'add'}
                  size={24}
                  color={themeVariables.whiteColor}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <WelcomeModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
};

export default BottomBar;

const styles = StyleSheet.create({
  chatBadgeText: {
    color: themeVariables.whiteColor,
    fontSize: 10,
    fontWeight: 'bold',
  },
  fabPortal: {
    ...StyleSheet.absoluteFillObject,
  },
  fabColumn: {
    position: 'absolute',
    right: FAB_HORIZONTAL_OFFSET,
    alignItems: 'flex-end',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: themeVariables.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabDisabled: {
    opacity: 0.6,
  },
  glassWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 12,
  },
  glassShadow: {
    position: 'absolute',
    left: 26,
    right: 26,
    bottom: 28,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0,0,0,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  glassBlur: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 26,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  glassBorder: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 26,
    height: 66,
    borderRadius: 33,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 86,
    gap: 4,
    overflow: 'visible',
    position: 'relative',
  },
  activeBlobTrail: {
    position: 'absolute',
    top: 18,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    zIndex: 0,
  },
  activeBlob: {
    position: 'absolute',
    top: 16,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    shadowColor: '#0b0924',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    zIndex: 1,
  },
  activeBlobShine: {
    position: 'absolute',
    top: -8,
    left: 8,
    right: 8,
    height: 32,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.32)',
    opacity: 0.95,
  },
  activeBlobEdge: {
    position: 'absolute',
    bottom: -10,
    left: 2,
    right: 2,
    height: 30,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabPill: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
    width: '100%',
    zIndex: 2,
  },
  tabPillFocused: {
    transform: [{ translateY: 1 }],
  },
  tabPillGlow: {
    position: 'absolute',
    top: 3,
    left: 14,
    right: 6,
    bottom: 3,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tabPillGlowActive: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    top: -2,
    bottom: -2,
    left: 6,
    right: 6,
    borderRadius: 34,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    color: themeVariables.blackColor,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: themeVariables.primaryColor,
  },
  chatBadgeGlass: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: themeVariables.alertErrorBg,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
