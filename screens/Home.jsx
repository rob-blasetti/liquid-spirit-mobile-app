import React, { useContext, useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  FlatList,
  Dimensions,
  Linking,
  ActivityIndicator,
  Platform,
  StatusBar,
  Easing,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import themeVariables from '../styles/theme';
import Carousel from '../components/Carousel';
import { UserContext } from '../contexts/UserContext';
import { CommunityContext } from '../contexts/CommunityContext';
import { useIsFocused } from '@react-navigation/native';
import { getBadiDate } from '../utils/badiDate';
import SquareTile from '../components/SquareTile';
import RectangularTile from '../components/RectangularTile';
import localImages from '../utils/localImages';
import LocalAssemblyModal from '../modal/LocalAssemblyModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SlideBanner from '../components/SlideBanner';
import { getEffectiveNextDate } from '../utils/activityDate';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
import { navigateToActivityDetail } from '../utils/navigateToActivityDetail';
import { navigateToPostDetail } from '../utils/navigateToPostDetail';
import LiquidGlassButton from './DetailCard/common/LiquidGlassButton';
import ImageBanner, { IMAGE_BANNER_HEIGHT } from '../components/ImageBanner';
import LiquidGlassIconButton from '../components/LiquidGlassIconButton';
import resolveImageSource, { prefetchImageSources } from '../utils/imageSource';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// Constants for bottom squares layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GUTTER = 10;
const BOTTOM_SQUARE_SIZE = (SCREEN_WIDTH - 2 * GRID_PADDING - GUTTER) / 2;
const RIDVAN_182_BE = 'https://universalhouseofjustice.bahai.org/ridvan-messages/20250420_001';
const BANNER_CONTENT_OFFSET = 60;
const MIN_BANNER_HEIGHT = 160;
const CONTENT_TOP_SPACING = 12;
const BANNER_PULL_EXPANSION = 120;
const RECENT_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const RECENT_CARD_GAP = 12;
const RECENT_CARD_HEIGHT = 180;

const formatGroupTime = (timeStr) => {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr ?? 0);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const temp = new Date();
  temp.setHours(hours, minutes, 0, 0);
  return temp.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const FEATURE_TABS = ['Activities', 'Events', 'Assembly'];

const Home = ({ navigation, homeOverview, route }) => {
  const insets = useSafeAreaInsets();
  // Compute status bar offset: on Android use StatusBar.currentHeight, on iOS use safe-area inset
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;
  const {
    user,
    userActivities,
    userEvents,
    userPosts,
    token,
    isTokenExpired,
    refreshSession,
    unreadCount,
  } = useContext(UserContext);
  const { communityId } = useContext(CommunityContext);
  const isFocused = useIsFocused();
  const bannerData = useMemo(() => {
    const bi = user?.community?.bannerImage;
    if (Array.isArray(bi)) {
      return bi.map(uri => ({ uri }));
    }
    if (bi) {
      return [{ uri: bi }];
    }
    return [];
  }, [user?.community?.bannerImage]);
  // Determine the next upcoming event without a host from overview
  const eventWithoutHost = useMemo(() => {
    // Safely handle null/undefined homeOverview
    if (!Array.isArray(homeOverview?.events)) return null;
    const now = new Date();
    const upcoming = homeOverview.events
      .filter(e => {
        const date = e.startTime || e.date;
        const d = new Date(date);
        return !isNaN(d) && d >= now;
      })
      .sort((a, b) => new Date(a.startTime || a.date) - new Date(b.startTime || b.date));
    return upcoming.find(e => !e.hosts || (Array.isArray(e.hosts) && e.hosts.length === 0)) || null;
  }, [homeOverview?.events]);
  const [activeTab, setActiveTab] = useState('Activities');
  const [assemblyModalVisible, setAssemblyModalVisible] = useState(false);
  // animated value for sliding panels
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabIndicatorX = useRef(new Animated.Value(0)).current;
  const tabIndicatorWidth = useRef(new Animated.Value(0)).current;
  const activeTabPosition = useRef(new Animated.Value(FEATURE_TABS.indexOf(activeTab))).current;
  const [tabLayouts, setTabLayouts] = useState({});
  const tabLayoutReady = useMemo(
    () => Object.keys(tabLayouts).length === FEATURE_TABS.length,
    [tabLayouts],
  );
  const glassOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 80, 220],
        outputRange: [0, 0.22, 0.48],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const clampedScroll = useMemo(
    () => Animated.diffClamp(scrollY, -BANNER_PULL_EXPANSION, IMAGE_BANNER_HEIGHT - MIN_BANNER_HEIGHT),
    [scrollY],
  );
  const [isBannerLocked, setIsBannerLocked] = useState(false);
  const hasLockedBannerRef = useRef(false);
  const bannerHeight = useMemo(
    () =>
      isBannerLocked
        ? MIN_BANNER_HEIGHT
        : clampedScroll.interpolate({
            inputRange: [-BANNER_PULL_EXPANSION, 0, IMAGE_BANNER_HEIGHT - MIN_BANNER_HEIGHT],
            outputRange: [IMAGE_BANNER_HEIGHT + BANNER_PULL_EXPANSION, IMAGE_BANNER_HEIGHT, MIN_BANNER_HEIGHT],
            extrapolate: 'clamp',
          }),
    [clampedScroll, isBannerLocked],
  );
  // Banner message for redirects
  const [bannerMessage, setBannerMessage] = useState('');
  useEffect(() => {
    const msg = route?.params?.bannerMessage;
    if (msg) {
      setBannerMessage(msg);
      navigation.setParams({ bannerMessage: undefined });
    }
  }, [route?.params?.bannerMessage, navigation]);

  const handleNavigateToEvent = useCallback(
    (eventData) => {
      navigateToEventDetail({ navigation, event: eventData, token, isTokenExpired });
    },
    [navigation, token, isTokenExpired],
  );
  // handle tab switch: slide old panel left, then slide in new panel
  const handleTabPress = (tab) => {
    if (tab === activeTab) return;
    animateTabIndicator(tab);
    Animated.timing(slideAnim, {
      toValue: -SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      slideAnim.setValue(SCREEN_WIDTH);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const animateTabIndicator = useCallback(
    (targetTab) => {
      const targetIndex = FEATURE_TABS.indexOf(targetTab);
      const layout = tabLayouts[targetIndex];
      if (!layout) return;
      const isLast = targetIndex === FEATURE_TABS.length - 1;
      const targetX = layout.x + (isLast ? 4 : 0);
      const targetWidth = Math.max(10, layout.width - (isLast ? 8 : 0));
      Animated.timing(activeTabPosition, {
        toValue: targetIndex,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.timing(tabIndicatorX, {
        toValue: targetX,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.timing(tabIndicatorWidth, {
        toValue: targetWidth,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    },
    [activeTabPosition, tabIndicatorWidth, tabIndicatorX, tabLayouts],
  );

  useEffect(() => {
    animateTabIndicator(activeTab);
  }, [activeTab, animateTabIndicator]);

  const recentPosts = useMemo(() => {
    const overviewPosts = Array.isArray(homeOverview?.posts) ? homeOverview.posts : [];
    const fallbackPosts = Array.isArray(userPosts) ? userPosts : [];
    const source = overviewPosts.length > 0 ? overviewPosts : fallbackPosts;
    return source.slice(0, 6);
  }, [homeOverview?.posts, userPosts]);

  // Prefetch images likely to appear on first load (banner, featured tiles, recent posts).
  // This noticeably improves perceived performance on Android.
  useEffect(() => {
    const targets = [];

    // Banner carousel
    for (const item of bannerData || []) {
      if (item?.uri) targets.push(item.uri);
    }

    // Featured tiles (best-effort)
    const nextActivity = Array.isArray(homeOverview?.activities)
      ? homeOverview.activities
          .map(a => ({ a, d: getEffectiveNextDate(a) }))
          .filter(x => x.d)
          .sort((x, y) => x.d - y.d)[0]?.a
      : null;
    if (nextActivity?.imageUrl) targets.push(nextActivity.imageUrl);

    const nextEvent = Array.isArray(homeOverview?.events)
      ? homeOverview.events
          .map(e => ({ e, d: new Date(e.startTime || e.date) }))
          .filter(x => x.d instanceof Date && !isNaN(x.d))
          .sort((x, y) => x.d - y.d)[0]?.e
      : null;
    if (nextEvent?.imageUrl) targets.push(nextEvent.imageUrl);

    // Recent posts media
    for (const p of recentPosts || []) {
      const uri = Array.isArray(p?.media) ? p.media[0] : null;
      if (uri) targets.push(uri);
    }

    if (targets.length > 0) {
      prefetchImageSources(targets, { priority: 'high' });
    }
  }, [bannerData, homeOverview?.activities, homeOverview?.events, recentPosts]);

  const handleRecentPostPress = useCallback(
    (post) => {
      if (!post) return;
      navigateToPostDetail({
        navigation,
        post,
        postId: post._id,
        token,
        isTokenExpired,
        stayInCurrentStack: true,
      });
    },
    [navigation, token, isTokenExpired],
  );


  // Removed refresh-on-focus to avoid redundant session refreshes; centralized elsewhere
  // Fallback redirect to Login if loading takes too long
  useEffect(() => {
    let fallbackTimer;
    if (userActivities === null || userEvents === null || userPosts === null) {
      // Redirect to login after 10 seconds of unresolved loading
      fallbackTimer = setTimeout(() => {
        // Navigate to Login on parent stack
        navigation.getParent()?.navigate('Login');
      }, 10000);
    }
    return () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [userActivities, userEvents, userPosts, navigation]);
  const iosVersion = Platform.OS === 'ios'
    ? (typeof Platform.Version === 'string' ? parseFloat(Platform.Version) : Platform.Version)
    : 0;
  const useIconGlassButtons = Platform.OS === 'ios' && Number.isFinite(iosVersion) && iosVersion >= 26;
  const bottomContentInset = useMemo(() => insets.bottom + 120, [insets.bottom]);
  const isLoading = userActivities === null || userEvents === null || userPosts === null;
  const handleScroll = useCallback(
    (event) => {
      const offsetY = event?.nativeEvent?.contentOffset?.y ?? 0;
      const lockThreshold = IMAGE_BANNER_HEIGHT - MIN_BANNER_HEIGHT;
      if (!hasLockedBannerRef.current && offsetY >= lockThreshold - 2) {
        hasLockedBannerRef.current = true;
        setIsBannerLocked(true);
      }
    },
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      {bannerMessage && (
        <SlideBanner
          message={bannerMessage}
          onClose={() => setBannerMessage('')}
          slideTo={statusBarHeight + BANNER_CONTENT_OFFSET}
        />
      )}
      <View
        pointerEvents="box-none"
        style={[styles.floatingActions, { top: statusBarHeight + 12 }]}
      >
        {useIconGlassButtons ? (
          <LiquidGlassIconButton
            iconName="search-outline"
            iconColor={themeVariables.blackColor}
            accessibilityLabel="Search"
            onPress={() => navigation.navigate('Search')}
            hasShadow={false}
            glassStyle={styles.topIconGlass}
          />
        ) : (
          <LiquidGlassButton
            onPress={() => navigation.navigate('Search')}
            intensity={28}
            style={styles.topActionButton}
            containerStyle={styles.topGlassContainer}
            accessibilityLabel="Search"
          >
            <Ionicons name="search-outline" size={18} color={themeVariables.blackColor} />
          </LiquidGlassButton>
        )}
        <View style={styles.notificationWrapper}>
          {useIconGlassButtons ? (
            <LiquidGlassIconButton
              iconName="notifications-outline"
              iconColor={themeVariables.blackColor}
              accessibilityLabel="Notifications"
              onPress={() => navigation.navigate('Notifications')}
              hasShadow={false}
              glassStyle={styles.topIconGlass}
            />
          ) : (
            <LiquidGlassButton
              onPress={() => navigation.navigate('Notifications')}
              intensity={28}
              style={styles.topActionButton}
              containerStyle={styles.topGlassContainer}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color={themeVariables.blackColor} />
            </LiquidGlassButton>
          )}
          {unreadCount > 0 && (
            <View style={styles.notificationBadge} pointerEvents="none">
              <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.container}>
        <AnimatedBlurView
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.glassOverlay, { opacity: glassOpacity }]}
          blurType="light"
          blurAmount={24}
          reducedTransparencyFallbackColor="rgba(255,255,255,0.72)"
        />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.glassTint, { opacity: glassOpacity }]}
        />
        {/* Only override status bar to white on Home screen */}
        {isFocused && (
          <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        )}
        {/* Banner sits above scroll content and shrinks on scroll */}
        <Animated.View style={[styles.bannerShadow, { height: bannerHeight }]} pointerEvents="box-none">
          <ImageBanner
            topInset={statusBarHeight}
            height={bannerHeight}
            overlayColor="rgba(0,0,0,0.15)"
            containerStyle={styles.bannerContainer}
            renderContent={({ totalHeight }) => (
              <Animated.View style={{ height: totalHeight }}>
                <Carousel
                  data={bannerData}
                  itemWidth={SCREEN_WIDTH}
                  separatorWidth={0}
                  itemHeight={totalHeight}
                />
              </Animated.View>
            )}
          >
            <View
              style={[
                styles.bannerContent,
                { top: statusBarHeight + BANNER_CONTENT_OFFSET },
              ]}
              pointerEvents="box-none"
            >
              {/* Community info at banner bottom-left */}
              <View style={styles.bannerBottomLeft}>
                <Text style={styles.communityBannerName}>{user?.community?.name}</Text>
              </View>
              {/* Date */}
              {(() => {
                const nowDate = new Date();
                const gregorianDate = nowDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const badi = getBadiDate(nowDate);
                return (
                  <Text style={styles.bahaiDate}>
                    {gregorianDate} {'\u2022'} {badi.formatted}
                  </Text>
                );
              })()}
            </View>
          </ImageBanner>
        </Animated.View>
        <Animated.ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollView,
            {
              paddingTop: CONTENT_TOP_SPACING,
              paddingBottom: bottomContentInset,
            },
          ]}
          scrollEventThrottle={16}
          bounces
          alwaysBounceVertical
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false, listener: handleScroll }
          )}
        >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeVariables.primaryColor} />
          </View>
        ) : (
          <>
            <Text style={styles.heading}>{'Featured'}</Text>
            <View style={styles.tabContainer}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.featureTabIndicator,
                  {
                    transform: [{ translateX: tabIndicatorX }],
                    width: tabIndicatorWidth,
                    opacity: tabLayoutReady ? 1 : 0,
                  },
                ]}
              />
              {FEATURE_TABS.map((tab, index) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.tabButton}
                  onPress={() => handleTabPress(tab)}
                  onLayout={({ nativeEvent }) => {
                    const { x, width } = nativeEvent.layout;
                    setTabLayouts((prev) => {
                      if (prev[index]?.x === x && prev[index]?.width === width) return prev;
                      return { ...prev, [index]: { x, width } };
                    });
                    if (!tabLayoutReady && Object.keys(tabLayouts).length === 0) {
                      tabIndicatorX.setValue(x);
                      tabIndicatorWidth.setValue(width);
                    }
                  }}
                >
                  <Animated.Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tab && styles.tabButtonTextActive,
                      {
                        color: activeTabPosition.interpolate({
                          inputRange: [index - 1, index, index + 1],
                          outputRange: ['rgba(0,0,0,0.65)', themeVariables.whiteColor, 'rgba(0,0,0,0.65)'],
                          extrapolate: 'clamp',
                        }),
                      },
                    ]}
                  >
                    {tab}
                  </Animated.Text>
                </TouchableOpacity>
              ))}
            </View>
            <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            {/* Events Section */}
            {activeTab === 'Events' && userEvents && userEvents.length > 0 && (() => {
              const now = new Date();
              const upcoming = userEvents
                .filter(ev =>
                  ev.date &&
                  new Date(ev.date) >= now &&
                  (
                    ev.eventType === 'Feast' ||
                    ev.eventType === 'Holy Day'
                  )
                )
                .sort((a, b) => new Date(a.date) - new Date(b.date));
              const nextEvent = upcoming[0];
              if (!nextEvent) return null;
              // format event date/time for tile
              const eventDate = new Date(nextEvent.startTime);
              const eventDateTime = eventDate.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
              return (
                <View style={styles.dualGrid}>
                  {/* Large Upcoming Event Tile */}
                  <RectangularTile
                    title={nextEvent.title}
                    bgImgColour="green"
                    subheading={`${nextEvent.eventType || ''}`}
                    dateTime={eventDateTime}
                    onPress={() => handleNavigateToEvent(nextEvent)}
                    style={styles.largeTile}
                  />
                  {/* Adjacent Square Tiles */}
                  <View style={styles.smallTilesColumn}>
                    <SquareTile
                      subheading="Can You Host?"
                      bgImgColour="red"
                      onPress={() => {
                        if (eventWithoutHost) {
                          handleNavigateToEvent(eventWithoutHost);
                        } else {
                          navigation.navigate('Events');
                        }
                      }}
                      actionIcon="help-circle-outline"
                      style={styles.smallTileGap}
                    />
                    <SquareTile
                      subheading={`Events this month: ${homeOverview.stats?.eventsCount}`}
                      bgImgColour="red"
                      onPress={() => navigation.navigate('Events')}
                      actionIcon="bar-chart-outline"
                      style={styles.smallTileLast}
                    />
                  </View>
                </View>
              );
            })()}
            {/* Assembly Section */}
            {activeTab === 'Assembly' && (() => {
              if (!Array.isArray(homeOverview?.events)) return null;
              const now = new Date();
              const lsaEvents = homeOverview.events.filter(e => e.title === 'Local Spiritual Assembly Meeting');
              let nextLsaEvent = null;
              if (lsaEvents.length > 0) {
                const futureEvents = lsaEvents.filter(e => e.startTime && new Date(e.startTime) >= now);
                if (futureEvents.length > 0) {
                  futureEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                  nextLsaEvent = futureEvents[0];
                } else {
                  const pastEvents = lsaEvents.filter(e => e.startTime && new Date(e.startTime) < now);
                  if (pastEvents.length > 0) {
                    pastEvents.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
                    const lastEvent = pastEvents[0];
                    const fallbackDate = new Date(lastEvent.startTime);
                    fallbackDate.setDate(fallbackDate.getDate() + 14);
                    nextLsaEvent = { ...lastEvent, startTime: fallbackDate.toISOString() };
                  }
                }
              }
              if (!nextLsaEvent) {
                // No upcoming assembly meeting: show fallback tile with Coming Soon ribbon
                return (
                  <View style={styles.dualGrid}>
                    <RectangularTile
                      title="Local Spiritual Assembly Meeting"
                      bgImgColour="blue"
                      style={styles.largeTile}
                      ribbonText="Coming Soon"
                      onPress={() => {}}
                    />
                    <View style={styles.smallTilesColumn}>
                      <SquareTile
                        subheading="My Local Spiritual Assembly"
                        bgImgColour="red"
                        actionIcon="people-outline"
                        style={styles.smallTileGap}
                        onPress={() => setAssemblyModalVisible(true)}
                      />
                      <SquareTile
                        subheading="Request Agenda Item"
                        bgImgColour="red"
                        actionIcon="document-text-outline"
                        style={styles.smallTileLast}
                        onPress={() => navigation.navigate('RequestAgendaItem')}
                      />
                    </View>
                  </View>
                );
              }
              const eventDate = new Date(nextLsaEvent.startTime);
              const day = eventDate.toLocaleDateString(undefined, { weekday: 'short' });
              const date = eventDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
              const time = eventDate
                .toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric', hour12: true })
                .toLowerCase()
                .replace(/\s+/g, '');
              const dateTimeStr = `${day}, ${date} at ${time}`;
              return (
                <View style={styles.dualGrid}>
                  <RectangularTile
                    title="Local Spiritual Assembly Meeting"
                    bgImgColour="blue"
                    imageSource={localImages[nextLsaEvent.imageUrl] || { uri: nextLsaEvent.imageUrl }}
                    dateTime={dateTimeStr}
                    subheading="Admin"
                    onPress={() => handleNavigateToEvent(nextLsaEvent)}
                    style={styles.largeTile}
                    showRibbon={false}
                  />
                  <View style={styles.smallTilesColumn}>
                    <SquareTile
                      subheading="My Local Spiritual Assembly"
                      bgImgColour="red"
                      actionIcon="people-outline"
                      style={styles.smallTileGap}
                      onPress={() => setAssemblyModalVisible(true)}
                    />
                    <SquareTile
                      subheading="Request Agenda Item"
                      bgImgColour="red"
                      actionIcon="document-text-outline"
                      style={styles.smallTileLast}
                      onPress={() => navigation.navigate('RequestAgendaItem')}
                    />
                  </View>
                </View>
              );
            })()}
            {/* Activities Section (homeOverview) */}
            {activeTab === 'Activities' && Array.isArray(homeOverview?.activities) && homeOverview?.activities.length > 0 && (() => {
              const now = new Date();
              // Prepare activities with next dates (session or root date)
              const upcomingWithDate = homeOverview.activities
              .map(a => ({ activity: a, nextDate: getEffectiveNextDate(a) }))
              .filter(({ nextDate }) => nextDate && nextDate >= now)
              .sort((a, b) => a.nextDate - b.nextDate);
              const upcoming = upcomingWithDate.map(({ activity }) => activity);
              const nextActData = upcomingWithDate[0] || null;
              const nextAct = nextActData?.activity || null;
              const nextDate = nextActData?.nextDate || null;
              // Next activity with available facilitator slots
              const activityToFacilitate = upcoming.find(a => {
                const currentCount = Array.isArray(a.facilitators) ? a.facilitators.length : 0;
                return typeof a.facilitatorLimit === 'number' && currentCount < a.facilitatorLimit;
              }) || null;
              if (!nextAct || !nextDate) return null;
              // Format date/time for nextAct
              const dateLabel = nextDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const timeLabel = formatGroupTime(nextAct?.groupDetails?.time) || nextDate.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              });
              const actDateTime = `${dateLabel}, ${timeLabel}`;
              return (
                <View style={styles.dualGrid}>
                  <RectangularTile
                    title={nextAct.title}
                    dateTime={actDateTime}
                    subheading={`${nextAct.activityType?.name || ''}`}
                    imageSource={{ uri: nextAct.imageUrl }}
                    onPress={() =>
                      navigateToActivityDetail({
                        navigation,
                        activity: nextAct,
                        token,
                        isTokenExpired,
                      })
                    }
                    style={styles.largeTile}
                  />
                  <View style={styles.smallTilesColumn}>
                    <SquareTile
                      subheading="Can You Facilitate?"
                      bgImgColour="blue"
                      onPress={() => {
                        if (activityToFacilitate) {
                          navigateToActivityDetail({
                            navigation,
                            activity: activityToFacilitate,
                            token,
                            isTokenExpired,
                          });
                        } else {
                          navigation.navigate('Activities');
                        }
                      }}
                      actionIcon="help-circle-outline"
                      style={styles.smallTileGap}
                    />
                    <SquareTile
                      subheading={`Activities this month: ${homeOverview.stats?.activitiesCount}`}
                      bgImgColour="blue"
                      onPress={() => navigation.navigate('Activities')}
                      actionIcon="bar-chart-outline"
                      style={styles.smallTileLast}
                    />
                  </View>
                </View>
              );
            })()}
            {/* Posts Section */}
            {activeTab === 'Posts' && userPosts && userPosts.length > 0 && (() => {
              const posts = userPosts;
              const firstPost = posts[0];
              console.log('firstPost: ', firstPost);
              const secondPost = posts[1];
              return (
                <View style={styles.dualGrid}>
                  <View style={styles.smallTilesColumn}>
                    {secondPost && (
                      <SquareTile
                        title={`${secondPost.content?.slice(0, 25)}...`}
                        onPress={() => navigation.navigate('Feed', { post: secondPost })}
                        style={styles.smallTileGap}
                      />
                    )}
                    <SquareTile
                      title="See More Posts"
                      onPress={() => navigation.navigate('Feed')}
                      actionIcon="arrow-forward-outline"
                      style={styles.smallTileLast}
                    />
                  </View>
                  <RectangularTile
                    subheading="Recent Post"
                    title={`${firstPost.content?.slice(0, 30) || ''}...`}
                    imageSource={{ uri: firstPost.mediaThumbnails[0] || null }}
                    onPress={() => navigation.navigate('Feed', { post: firstPost })}
                    style={styles.largeTile}
                  />
                </View>
              );
            })()}
            </Animated.View>
            <Text style={styles.heading}>{'Your Liquid Spirit'}</Text>
            <View style={styles.createContainer}>
              {/* <TouchableOpacity
                style={styles.createRow}
                onPress={() => navigation.navigate('CreateActivity', {
                  communityId,
                  userId: user?.id,
                })}
              >
                <View style={styles.createRowContent}>
                  <Ionicons
                    name="list-outline"
                    size={16}
                    color={themeVariables.primaryColor}
                    style={styles.createIcon}
                  />
                  <Text style={styles.createRowText}>Create Activity</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={themeVariables.primaryColor} />
              </TouchableOpacity>
              <View style={styles.separator} /> */}
              <TouchableOpacity
                style={styles.createRow}
                onPress={() => Linking.openURL(RIDVAN_182_BE)}
              >
                <View style={styles.createRowContent}>
                  <Ionicons
                    name="mail-open-outline"
                    size={16}
                    color={themeVariables.blackColor}
                    style={styles.createIcon}
                  />
                  <Text style={styles.createRowText}>Ridvan Message 182 BE</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={themeVariables.blackColor} />
              </TouchableOpacity>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.createRow}
                onPress={() => navigation.navigate('Activities')}
              >
                <View style={styles.createRowContent}>
                  <Ionicons
                    name="list-outline"
                    size={16}
                    color={themeVariables.blackColor}
                    style={styles.createIcon}
                  />
                  <Text style={styles.createRowText}>View All Activities</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={themeVariables.blackColor} />
              </TouchableOpacity>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.createRow}
                onPress={() => navigation.navigate('Events')}
              >
                <View style={styles.createRowContent}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={themeVariables.blackColor}
                    style={styles.createIcon}
                  />
                  <Text style={styles.createRowText}>View All Events</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={themeVariables.blackColor} />
              </TouchableOpacity>

              {/* <TouchableOpacity
                style={styles.createRow}
                onPress={() => navigation.navigate('Activities')}
              >
                <View style={styles.createRowContent}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={themeVariables.primaryColor}
                    style={styles.createIcon}
                  />
                  <Text style={styles.createRowText}>Recent Arrivals</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={themeVariables.primaryColor} />
              </TouchableOpacity> */}
            </View>
            {recentPosts.length > 0 && (
              <View style={styles.recentPostsSection}>
                <Text style={[styles.heading, styles.recentHeading]}>Recent Posts</Text>
                <FlatList
                  data={recentPosts}
                  keyExtractor={(item, index) => item?._id?.toString?.() || `recent-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={RECENT_CARD_WIDTH + RECENT_CARD_GAP}
                  snapToAlignment="start"
                  decelerationRate="fast"
                  contentContainerStyle={styles.recentListContent}
                  ItemSeparatorComponent={() => <View style={{ width: RECENT_CARD_GAP }} />}
                  renderItem={({ item }) => {
                    const imageSource = resolveImageSource(item?.media?.[0], {
                      priority: 'high',
                      fallback: '/img/events/Event_Placeholder.png',
                    });
                    return (
                      <TouchableOpacity
                        style={styles.recentCard}
                        onPress={() => handleRecentPostPress(item)}
                        activeOpacity={0.9}
                      >
                        <FastImage
                          source={imageSource}
                          style={styles.recentImage}
                          resizeMode={FastImage.resizeMode.cover}
                        />
                        <View style={styles.recentOverlay}>
                          <Text style={styles.recentTitle} numberOfLines={2} ellipsizeMode="tail">
                            {item?.content || 'View Post'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
          </>
        )}
        </Animated.ScrollView>
      {/* Local Spiritual Assembly Members Modal: members loaded from CommunityContext */}
      <LocalAssemblyModal
        visible={assemblyModalVisible}
        onClose={() => setAssemblyModalVisible(false)}
      />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  floatingActions: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    zIndex: 5,
  },
  topActionButton: {
    backgroundColor: 'transparent',
    borderRadius: themeVariables.borderRadiusPill,
    padding: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGlassContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 38,
    minWidth: 38,
    borderRadius: 19,
  },
  topIconGlass: {
    backgroundColor: 'rgba(240,240,240,0.8)',
    borderColor: 'rgba(200,200,200,0.9)',
    borderWidth: 1,
    shadowColor: 'rgba(255,255,255,0.5)',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  notificationWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.greyColor,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  glassTint: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollArea: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    elevation: 3,
  },
  scrollView: {
    flexGrow: 1,
  },
  bannerShadow: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 1,
    zIndex: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: themeVariables.whiteColor,
  },
  bannerContainer: {
    position: 'relative',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  bannerContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
  },
  // Community bottom-left in banner
  bannerBottomLeft: {
    position: 'absolute',
    left: 20,
    bottom: 30,
  },
  communityBannerName: {
    fontSize: 46,
    fontWeight: 'bold',
    color: themeVariables.whiteColor,
  },
  communityBannerMembers: {
    fontSize: 16,
    color: themeVariables.whiteColor,
    marginTop: 4,
  },
  statsSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: themeVariables.primaryColor,
  },
  statsLabel: {
    fontSize: 16,
    color: themeVariables.blackColor,
  },
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  gridItem: {
    width: '48%',
    backgroundColor: themeVariables.lightGreyColor,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  // Dummy Baha'i date at bottom left of banner
  bahaiDate: {
    position: 'absolute',
    left: 22,
    bottom: 10,
    fontSize: 14,
    color: themeVariables.whiteColor,
  },
  // Bottom two large squares
  bottomSquaresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    marginTop: 20,
    marginBottom: 40,
  },
  bottomSquare: {
    width: BOTTOM_SQUARE_SIZE,
    height: BOTTOM_SQUARE_SIZE,
  },
  bottomSquareRight: {
    marginLeft: GUTTER,
  },
  gridItemCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeVariables.primaryColor,
    marginBottom: 5,
  },
  gridItemTitle: {
    fontSize: 14,
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeVariables.whiteColor,
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: themeVariables.whiteColor,
  },
  // Events & Activities dual-grid
  dualGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 0,
    // align tiles at top of grid rows
    alignItems: 'flex-start',
  },
  largeTile: {
    // fixed width via RectangularTile wrapper
    borderRadius: 8,
    overflow: 'hidden',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tileImageLarge: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  tileImageStyleLarge: {
    // Crop image showing left half: expand width and anchor to left
    position: 'absolute',
    left: 0,
    top: 0,
    width: '200%',
    height: '100%',
    resizeMode: 'cover',
    alignSelf: 'flex-start',
  },
  tileOverlayLarge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  largeTileTitle: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: themeVariables.whiteColor,
  },
  largeTileName: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontSize: 14,
    color: themeVariables.whiteColor,
  },
  smallTilesColumn: {
    // gutter between rectangle and square tiles
    marginLeft: 10,
  },
  smallTileGap: {
    marginBottom: 10,
  },
  smallTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  smallTileLast: {
    marginBottom: 0,
  },
  smallTileColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallTileLink: {
    fontSize: 14,
    color: themeVariables.primaryColor,
    textDecorationLine: 'underline',
    marginTop: 6,
  },
  smallTileText: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.primaryColor,
    marginLeft: 6,
  },
  // Host-required tile text
  smallTileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: themeVariables.primaryColor,
    textAlign: 'center',
    marginBottom: 4,
  },
  smallTileSubTitle: {
    fontSize: 14,
    color: themeVariables.blackColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  requestButton: {
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'center',
  },
  requestButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 14,
    fontWeight: '600',
  },
  // Tab buttons
  heading: {
    color: themeVariables.blackColor,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 4,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    paddingVertical: 3,
    paddingHorizontal: 2,
    backgroundColor: themeVariables.whiteColor,
    borderColor: themeVariables.blackColor,
    borderWidth: 1,
    borderRadius: 25,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 14,
  },
  tabButton: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  tabButtonText: {
    fontSize: 14,
    color: themeVariables.blackColor,
    textAlign: 'center',
    fontWeight: '500',
    flexShrink: 1,
    maxWidth: '100%',
  },
  tabButtonTextActive: {
    fontWeight: '700',
  },
  featureTabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 2,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 18,
  },
  // Create Activity row under tabs
  createRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  createRowText: {
    fontSize: 16,
    fontWeight: '500',
    color: themeVariables.blackColor,
    textAlign: 'left',
    width: Platform.select({ android: 200 }),
  },
  createContainer: {
    marginHorizontal: 20,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.blackColor,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 12,
  },
  createRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: themeVariables.blackColor,
  },
  createIcon: {
    marginRight: 8,
  },
  recentPostsSection: {
    marginTop: 6,
    paddingBottom: 20,
  },
  recentHeading: {
    marginBottom: 12,
  },
  recentListContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 6,
  },
  recentCard: {
    width: RECENT_CARD_WIDTH,
    height: RECENT_CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: themeVariables.whiteColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  recentOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  recentTitle: {
    color: themeVariables.whiteColor,
    fontSize: 14,
    fontWeight: '600',
  },
  // Posts Section
  postsList: {
    marginTop: 10,
  },
  postCard: {
    backgroundColor: themeVariables.lightGreyColor,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  postContent: {
    fontSize: 16,
    color: themeVariables.blackColor,
  },
});

export default Home;
