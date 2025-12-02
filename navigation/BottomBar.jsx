import React, { useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
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
  Discover: 'calendar-outline',
  Feed: 'compass-outline',
  Chat: 'chatbubbles-outline',
  Profile: 'person-outline',
};
const TAB_BAR_HEIGHT = 80;
const FAB_VERTICAL_OFFSET = 54;
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

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,

          tabBarIcon: ({ focused, color, size }) => {
            // bump every icon +6px for bigger taps & visuals
            const iconSize = size + 4;
            const baseName = tabIcons[route.name] || 'ellipse-outline';
            const iconColor = focused ? themeVariables.primaryColor : themeVariables.blackColor;
            // choose filled when focused, outline otherwise
            const iconName = focused
              ? baseName.replace(/-outline$/, '')
              : baseName;

            // recalc wrapper to keep icon dead-center in 80px bar
            const barHeight = 80;
            const indicatorHeight = 4;
            const wrapperWidth = iconSize + 6;
            const baseMargin = (barHeight - iconSize) / 1.5;
            const iconMarginTop = focused
              ? baseMargin - indicatorHeight - 1
              : baseMargin;

            return (
              <View
                style={{
                  width: wrapperWidth,
                  height: barHeight,
                  alignItems: 'center',
                }}
              >
                {focused && (
                  <View
                    style={{
                      height: indicatorHeight,
                      width: wrapperWidth,
                      backgroundColor: themeVariables.primaryColor,
                      borderBottomLeftRadius: 5,
                      borderBottomRightRadius: 5,
                      top: 20,
                    }}
                  />
                )}
                <Ionicons
                  name={iconName}
                  size={iconSize}
                  color={iconColor}
                  style={{ marginTop: iconMarginTop }}
                />
                {route.name === 'Chat' && chatNotificationCount > 0 && (
                    <View style={styles.chatBadge}>
                      <Text style={styles.chatBadgeText}>
                        {Math.min(chatNotificationCount, 99)}
                      </Text>
                    </View>
                  )}
              </View>
            );
          },

          tabBarActiveTintColor: themeVariables.primaryColor,
          tabBarInactiveTintColor: themeVariables.primaryColor,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: themeVariables.greyColor,
            borderTopWidth: 1,
            borderTopColor: themeVariables.whiteColor,
          },
        })}
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
  chatBadge: {
    position: 'absolute',
    top: 28,
    right: 4,
    backgroundColor: themeVariables.alertErrorBg,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
});
