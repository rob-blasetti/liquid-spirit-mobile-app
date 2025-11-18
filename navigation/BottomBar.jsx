import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
// import { Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import themeVariables from '../styles/theme';
import SocialMediaScreen from '../screens/SocialMedia';
import Home from '../screens/Home';
import DiscoverScreen from '../screens/Discover';
// Removed NotificationScreen import; Notifications handled via Home screen banner
import ChatScreen from '../screens/Chat';
import ProfileStackNavigator from '../navigation/ProfileStackNavigator';

// 1. Import the WelcomeModal
import WelcomeModal from '../modal/WelcomeModal';

const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: 'home-outline',
  Discover: 'calendar-outline',
  Feed: 'compass-outline',
  Chat: 'chatbubble-ellipses-outline',
  Profile: 'person-outline',
};
const TAB_BAR_HEIGHT = 80;
const FAB_OFFSET = 4;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const BottomBar = ({ initialPosts, homeOverview }) => {
  const { isLoggedIn, chatNotificationCount, user } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const userId = user?._id || user?.id;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const parentNavigation = navigation.getParent?.() || navigation;
  const [modalVisible, setModalVisible] = useState(false);
  const [scrollToTop, setScrollToTop] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const fabExpandedRef = useRef(fabExpanded);
  fabExpandedRef.current = fabExpanded;

  useEffect(() => {
    if (!isLoggedIn) {
      setFabExpanded(false);
    }
  }, [isLoggedIn]);

  const closeFab = () => setFabExpanded(false);
  const toggleFab = () => {
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    setFabExpanded(prev => !prev);
  };

  const handleCreateActivity = () => {
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    if (!userId) return;
    closeFab();
    parentNavigation.navigate('CreateActivity', { communityId, userId });
  };

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    closeFab();
    parentNavigation.navigate('CreatePostModal');
  };

  const handleNewMessage = () => {
    if (!isLoggedIn) {
      setModalVisible(true);
      return;
    }
    closeFab();
    parentNavigation.navigate('NewMessage');
  };

  const fabOptions = useMemo(
    () => [
      { key: 'activity', label: 'Create Activity', icon: 'calendar-outline', onPress: handleCreateActivity },
      { key: 'post', label: 'Create Post', icon: 'create-outline', onPress: handleCreatePost },
      { key: 'message', label: 'New Message', icon: 'chatbubble-ellipses-outline', onPress: handleNewMessage },
    ],
    [handleCreateActivity, handleCreatePost, handleNewMessage],
  );
  const optionAnimationsRef = useRef([]);
  if (optionAnimationsRef.current.length !== fabOptions.length) {
    optionAnimationsRef.current = fabOptions.map(() => new Animated.Value(0));
  }
  const optionAnimations = optionAnimationsRef.current;
  const fabBottom = TAB_BAR_HEIGHT + FAB_OFFSET + insets.bottom;

  useEffect(() => {
    if (fabExpanded) {
      optionAnimations.forEach(animation => animation.stopAnimation());
      if (!optionsVisible) {
        setOptionsVisible(true);
      }
      const openAnimations = optionAnimations
        .map(animation =>
          Animated.spring(animation, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
            tension: 70,
          }),
        )
        .reverse();

      Animated.stagger(60, openAnimations).start();
    } else if (optionsVisible) {
      optionAnimations.forEach(animation => animation.stopAnimation());
      const closeAnimations = optionAnimations.map(animation =>
        Animated.timing(animation, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      );

      Animated.stagger(40, closeAnimations).start(({ finished }) => {
        if (finished && !fabExpandedRef.current) {
          setOptionsVisible(false);
        }
      });
    } else {
      optionAnimations.forEach(animation => animation.setValue(0));
    }
  }, [fabExpanded, optionAnimations, optionsVisible]);

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
            if (fabExpanded) {
              closeFab();
            }

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
          {(props) => <Home {...props} homeOverview={homeOverview} />}
        </Tab.Screen>
        <Tab.Screen name="Discover" component={DiscoverScreen} />
        <Tab.Screen name="Feed">
          {(props) => (
            <SocialMediaScreen
              {...props}
              initialPosts={initialPosts}
              scrollToTop={scrollToTop}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Chat" component={ChatScreen} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>

      <View pointerEvents="box-none" style={styles.fabPortal}>
        {(fabExpanded || optionsVisible) && (
          <TouchableOpacity
            style={styles.fabBackdrop}
            activeOpacity={1}
            onPress={closeFab}
          />
        )}
        <View style={[styles.fabColumn, { bottom: fabBottom }]}>
          {optionsVisible &&
            fabOptions.map((action, index) => {
              const animation = optionAnimations[index];
              const translateY = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [12 * (fabOptions.length - index), 0],
              });
              const animatedStyle = {
                opacity: animation,
                transform: [
                  { translateY },
                  {
                    scale: animation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              };

              return (
                <AnimatedTouchableOpacity
                  key={action.key}
                  style={[styles.fabOption, animatedStyle]}
                  onPress={action.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  activeOpacity={0.9}
                >
                  <Ionicons name={action.icon} size={18} color={themeVariables.primaryColor} />
                  <Text style={styles.fabOptionText}>{action.label}</Text>
                </AnimatedTouchableOpacity>
              );
            })}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={fabExpanded ? 'Close quick actions' : 'Open quick actions'}
            style={styles.fab}
            onPress={toggleFab}
            activeOpacity={0.85}
          >
            <Ionicons
              name={fabExpanded ? 'close' : 'add'}
              size={24}
              color={themeVariables.whiteColor}
            />
          </TouchableOpacity>
        </View>
      </View>

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
  fabBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  fabColumn: {
    position: 'absolute',
    right: 24,
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
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  fabOptionText: {
    marginLeft: 8,
    color: themeVariables.blackColor,
    fontWeight: '600',
  },
});
