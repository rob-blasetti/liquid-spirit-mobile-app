import React, { useContext, useState, useRef, useMemo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Linking,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faUsers, faAlignLeft, faQuestionCircle, faEnvelopeOpen, faBahai, faCalendarDays, faSquarePollVertical, faBell } from '@fortawesome/free-solid-svg-icons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { useFocusEffect } from '@react-navigation/native';
import { getBadiDate } from '../utils/badiDate';
import SquareTile from '../components/SquareTile';
import RectangularTile from '../components/RectangularTile';
import ChangeableProfileImage from '../components/ChangeableProfileImage';
import LocalAssemblyModal from '../modal/LocalAssemblyModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Helper: get the next upcoming session date for an activity
const getNextSessionDate = (activity) => {
  if (!Array.isArray(activity.sessions)) return null;
  const now = new Date();
  const future = activity.sessions
    .filter(s => ['Scheduled', 'Confirmed'].includes(s.status))
    .map(s => new Date(s.date))
    .filter(d => !isNaN(d) && d >= now);
  if (future.length === 0) return null;
  future.sort((a, b) => a - b);
  return future[0];
};
// Fallback helper: use session date or root-level date
const getEffectiveNextDate = (activity) => {
  const nextSession = getNextSessionDate(activity);
  if (nextSession) return nextSession;
  if (activity.date) {
    const d = new Date(activity.date);
    if (!isNaN(d)) return d;
  }
  return null;
};

// Constants for bottom squares layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GUTTER = 10;
const BOTTOM_SQUARE_SIZE = (SCREEN_WIDTH - 2 * GRID_PADDING - GUTTER) / 2;
const RIDVAN_182_BE = 'https://universalhouseofjustice.bahai.org/ridvan-messages/20250420_001';

const Home = ({ navigation, homeOverview }) => {
  const insets = useSafeAreaInsets();
  // Compute status bar offset: on Android use StatusBar.currentHeight, on iOS use safe-area inset
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;
  // Extra padding to further push content down and enlarge banner
  const EXTRA_TOP = 50;
  const { user, communityId, userActivities, userEvents, userPosts, token, isTokenExpired, refreshSession, unreadCount } = useContext(UserContext);
  // Determine the next upcoming event without a host from overview
  const eventWithoutHost = useMemo(() => {
    if (!Array.isArray(homeOverview.events)) return null;
    const now = new Date();
    const upcoming = homeOverview.events
      .filter(e => {
        const date = e.startTime || e.date;
        const d = new Date(date);
        return !isNaN(d) && d >= now;
      })
      .sort((a, b) => new Date(a.startTime || a.date) - new Date(b.startTime || b.date));
    return upcoming.find(e => !e.hosts || (Array.isArray(e.hosts) && e.hosts.length === 0)) || null;
  }, [homeOverview.events]);
  const [activeTab, setActiveTab] = useState('Activities');
  const [assemblyModalVisible, setAssemblyModalVisible] = useState(false);
  // animated value for sliding panels
  const slideAnim = useRef(new Animated.Value(0)).current;


  // handle tab switch: slide old panel left, then slide in new panel
  const handleTabPress = (tab) => {
    if (tab === activeTab) return;
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

  useFocusEffect(
    useCallback(() => {
      if (token && isTokenExpired(token)) {
        refreshSession();
      }
    }, [token])
  );
  if (userActivities === null || userEvents === null || userPosts === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Banner Section */}
        <View style={[
          styles.bannerContainer,
          { marginTop: -statusBarHeight, height: 200 + statusBarHeight + EXTRA_TOP }
        ]}>
          <Image
            source={{
              uri: Array.isArray(user?.community?.bannerImage)
                ? user.community.bannerImage[0]
                : user?.community?.bannerImage
            }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay} />
          <View style={[
            styles.bannerContent,
            { top: statusBarHeight + EXTRA_TOP }
          ]}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <FontAwesomeIcon icon={faBell} size={20} color={themeVariables.blackColor} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.bannerMiddleRow}>
              <ChangeableProfileImage imageStyle={styles.profileAvatar} avatarSize={55} />
              <View style={styles.profileColumn}>
                <Text style={styles.profileName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text style={styles.profileBahaiId}>
                  {user?.bahaiId}
                </Text>
              </View>
              <View style={styles.communityColumn}>
                <Text style={styles.communityName}>{user?.community?.name}</Text>
                <Text style={styles.communityMembers}>{homeOverview.stats?.communityMembersCount} members</Text>
              </View>
            </View>
            {(() => {
              const nowDate = new Date();
              // Gregorian date
              const gregorianDate = nowDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              // Badi date
              const badi = getBadiDate(nowDate);
              return (
                <Text style={styles.bahaiDate}>
                  {gregorianDate} {'\u2022'} {badi.formatted}
                </Text>
              );
            })()}
          </View>
        </View>

        <Text style={styles.heading}>{'Featured'}</Text>
        <View style={styles.tabContainer}>
          {['Activities','Events', 'Assembly'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab===tab && styles.tabButtonActive]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[styles.tabButtonText, activeTab===tab && styles.tabButtonTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
        {/* Events Section */}
        {activeTab==='Events' && userEvents && userEvents.length > 0 && (() => {
          const now = new Date();
          const upcoming = userEvents
            .filter(ev => ev.date && new Date(ev.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          const nextEvent = upcoming[0];
          // format event date/time for tile
          const eventDate = new Date(nextEvent.startTime);
          const eventDateTime = eventDate.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
          if (!nextEvent) return null;
          return (
            <View style={styles.dualGrid}>
              {/* Large Upcoming Event Tile */}
              <RectangularTile
                title="Upcoming"
                bgImgColour="green"
                // Show title and event type separated by a dot
                subheading={`${nextEvent.title} \u2022 ${nextEvent.eventType || ''}`}
                dateTime={eventDateTime}
                onPress={() => navigation.navigate('EventDetailCard', { eventId: nextEvent._id, eventPreload: nextEvent })}
                style={styles.largeTile}
              />
              {/* Adjacent Square Tiles */}
              <View style={styles.smallTilesColumn}>
                <SquareTile
                  subheading="Can You Host?"
                  bgImgColour="red"
                  onPress={() => {
                    if (eventWithoutHost) {
                      navigation.navigate('EventDetailCard', { eventId: eventWithoutHost._id, eventPreload: eventWithoutHost });
                    } else {
                      navigation.navigate('Events');
                    }
                  }}
                  actionIcon={faQuestionCircle}
                  style={styles.smallTileGap}
                />
                <SquareTile
                  subheading={`Events this month: ${homeOverview.stats?.eventsCount}`}
                  bgImgColour="red"
                  onPress={() => navigation.navigate('Events')}
                  actionIcon={faSquarePollVertical}
                  style={styles.smallTileLast}
                />
              </View>
            </View>
          );
        })()}
        {/* Assembly Section */}
        {activeTab==='Assembly' && (() => {
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
          if (!nextLsaEvent) return null;
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
                title="Upcoming"
                bgImgColour="blue"
                dateTime={dateTimeStr}
                subheading="Next Local Spiritual Assembly Meeting"
                onPress={() => navigation.navigate('EventDetailCard', { eventId: nextLsaEvent._id, eventPreload: nextLsaEvent })}
                style={styles.largeTile}
              />
              <View style={styles.smallTilesColumn}>
                <SquareTile
                  subheading="My Local Spiritual Assembly"
                  bgImgColour="red"
                  actionIcon={faUsers}
                  style={styles.smallTileGap}
                  onPress={() => setAssemblyModalVisible(true)}
                />
                <SquareTile
                  subheading="Request Agenda Item"
                  bgImgColour="red"
                  actionIcon={faAlignLeft}
                  style={styles.smallTileLast}
                  onPress={() => navigation.navigate('RequestAgendaItem')}
                />
              </View>
            </View>
          );
        })()}
        {/* Activities Section (homeOverview) */}
        {activeTab === 'Activities' && Array.isArray(homeOverview.activities) && homeOverview.activities.length > 0 && (() => {
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
          const actDateTime = nextDate.toLocaleString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
          });
          return (
            <View style={styles.dualGrid}>
              <RectangularTile
                title="Upcoming"
                dateTime={actDateTime}
                subheading={`${nextAct.title} \u2022 ${nextAct.activityType?.name || ''}`}
                imageSource={{ uri: nextAct.imageUrl }}
                onPress={() => navigation.navigate('ActivityDetailCard', { activityId: nextAct._id, activityPreload: nextAct })}
                style={styles.largeTile}
              />
              <View style={styles.smallTilesColumn}>
                <SquareTile
                  subheading="Can You Facilitate?"
                  bgImgColour="blue"
                  onPress={() => {
                    if (activityToFacilitate) {
                      navigation.navigate('ActivityDetailCard', { activityId: activityToFacilitate._id, activityPreload: activityToFacilitate });
                    } else {
                      navigation.navigate('Activities');
                    }
                  }}
                  actionIcon={faQuestionCircle}
                  style={styles.smallTileGap}
                />
                <SquareTile
                  subheading={`Activities this month: ${homeOverview.stats?.activitiesCount}`}
                  bgImgColour="blue"
                  onPress={() => navigation.navigate('Activities')}
                  actionIcon={faSquarePollVertical}
                  style={styles.smallTileLast}
                />
              </View>
            </View>
          );
        })()}
        {/* Posts Section */}
        {activeTab==='Posts' && userPosts && userPosts.length > 0 && (() => {
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
                  actionIcon={faArrowRight}
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
              <FontAwesomeIcon
                icon={faAlignLeft}
                size={16}
                color={themeVariables.primaryColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>Create Activity</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.primaryColor} />
          </TouchableOpacity>
          <View style={styles.separator} /> */}
          <TouchableOpacity
            style={styles.createRow}
            onPress={() => Linking.openURL(RIDVAN_182_BE)}
          >
            <View style={styles.createRowContent}>
              <FontAwesomeIcon
                icon={faEnvelopeOpen}
                size={16}
                color={themeVariables.blackColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>Ridvan Message 182 BE</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.blackColor} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.createRow}
            onPress={() => navigation.navigate('Activities')}
          >
            <View style={styles.createRowContent}>
              <FontAwesomeIcon
                icon={faAlignLeft}
                size={16}
                color={themeVariables.blackColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>View All Activities</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.blackColor} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.createRow}
            onPress={() => navigation.navigate('Events')}
          >
            <View style={styles.createRowContent}>
              <FontAwesomeIcon
                // Changed icon to calendar for events
                icon={faCalendarDays}
                size={16}
                color={themeVariables.blackColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>View All Events</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.blackColor} />
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={styles.createRow}
            onPress={() => navigation.navigate('Activities')}
          >
            <View style={styles.createRowContent}>
              <FontAwesomeIcon
                icon={faUsers}
                size={16}
                color={themeVariables.primaryColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>Recent Arrivals</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.primaryColor} />
          </TouchableOpacity> */}
        </View>
      </ScrollView>
      {/* Local Spiritual Assembly Members Modal */}
      <LocalAssemblyModal
        visible={assemblyModalVisible}
        onClose={() => setAssemblyModalVisible(false)}
        members={homeOverview.localSpiritualAssembly || []}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.darkGreyColor,
  },
  // Styles for notification button on banner, matching Profile banner icon style
  notificationButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 6,
    // subtle shadow for raised effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'red',
    borderRadius: 8,
    width: 16,
    height: 16,
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
  scrollView: {
    flexGrow: 1,
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bannerContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
  },
  bannerMiddleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileColumn: {
    flex: 1,
    marginLeft: 10,
  },
  communityColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: themeVariables.whiteColor,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: themeVariables.whiteColor,
  },
  profileBahaiId: {
    fontSize: 14,
    color: themeVariables.whiteColor,
    marginBottom: 4,
  },
  communityName: {
    fontSize: 24,
    fontWeight: '600',
    color: themeVariables.whiteColor,
    width: Platform.select({ android: 100 }),
  },
  communityMembers: {
    fontSize: 14,
    color: themeVariables.whiteColor,
    marginTop: 4,
    width: Platform.select({ android: 100 }),
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
    left: 20,
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
    marginBottom: 10,
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
    padding: 4,
    backgroundColor: themeVariables.whiteColor,
    borderColor: themeVariables.blackColor,
    borderWidth: 1,
    borderRadius: 25,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: -1,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: themeVariables.primaryColor,
  },
  tabButtonText: {
    fontSize: 14,
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: Platform.select({ android: 65 }),
  },
  tabButtonTextActive: {
    color: themeVariables.whiteColor,
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
    overflow: 'hidden',
    marginBottom: 20,
  },
  createRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: themeVariables.primaryColor,
  },
  createIcon: {
    marginRight: 8,
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
