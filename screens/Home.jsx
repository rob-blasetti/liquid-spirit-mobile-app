import React, { useContext, useState, useRef, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  FlatList,
  Dimensions,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faArrowRight, faUsers, faAlignLeft, faQuestionCircle, faEnvelopeOpen, faBahai } from '@fortawesome/free-solid-svg-icons';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import localImages from '../utils/localImages';
import { getBadiDate } from '../utils/badiDate';
import SquareTile from '../components/SquareTile';
import RectangularTile from '../components/RectangularTile';

// Constants for bottom squares layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 20;
const GUTTER = 10;
const BOTTOM_SQUARE_SIZE = (SCREEN_WIDTH - 2 * GRID_PADDING - GUTTER) / 2;
const RIDVAN_182_BE = 'https://universalhouseofjustice.bahai.org/ridvan-messages/20250420_001';

const Home = ({ navigation }) => {
  const { user, communityId, userActivities, userEvents, userPosts } = useContext(UserContext);
  // Determine the next upcoming event without a host
  const eventWithoutHost = useMemo(() => {
    if (!Array.isArray(userEvents)) return null;
    const now = new Date();
    // Filter future events
    const upcoming = userEvents.filter(e => {
      const d = new Date(e.date);
      return !isNaN(d) && d >= now;
    });
    // Sort by date ascending
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    // Find first with no hosts
    return upcoming.find(e => !e.hosts || (Array.isArray(e.hosts) && e.hosts.length === 0)) || null;
  }, [userEvents]);
  const [activeTab, setActiveTab] = useState('Activities');
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Banner Section */}
        <View style={styles.bannerContainer}>
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
          <View style={styles.bannerContent}>
            <View style={styles.bannerMiddleRow}>
              <FastImage
                source={{ uri: user?.profilePicture }}
                style={styles.profileAvatar}
              />
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
                <Text style={styles.communityMembers}>144 members</Text>
              </View>
            </View>
          {/* Show Gregorian date and Badi date with separator */}
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

        {/* Tabs: Events, Activities, Posts, Admin */}
        <Text style={styles.heading}>{'Featured'}</Text>
        <View style={styles.tabContainer}>
          {['Activities','Events'].map(tab => (
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
          const eventDate = new Date(nextEvent.date);
          const eventDateTime = eventDate.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
          console.log(nextEvent);
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
                  onPress={() => navigation.navigate('EventDetailCard', { eventId: eventWithoutHost._id, eventPreload: eventWithoutHost })}
                  actionIcon={faQuestionCircle}
                  style={styles.smallTileGap}
                />
                <SquareTile
                  subheading="See All Events"
                  bgImgColour="red"
                  onPress={() => navigation.navigate('Events')}
                  actionIcon={faCalendar}
                  style={styles.smallTileLast}
                />
              </View>
            </View>
          );
        })()}
        {/* Admin Section */}
        {activeTab==='Admin' && (() => {
          const recentMember = { name: 'Alice Smith', avatarUrl: 'https://via.placeholder.com/400' };
          return (
            <View style={styles.dualGrid}>
              {/* Main Assembly Tile */}
              <RectangularTile
                title="Upcoming"
                bgImgColour="blue"
                dateTime="Mon, 28 Apr at 7:30pm"
                subheading="Next Local Spiritual Assembly Meeting"
                onPress={() => navigation.navigate('Profile')}
                style={styles.largeTile}
              />
              <View style={styles.smallTilesColumn}>
                <SquareTile
                  subheading="My Local Spiritual Assembly"
                  onPress={() => navigation.navigate('EventDetail', { event: nextEvent })}
                  bgImgColour="red"
                  actionIcon={faUsers}
                  style={styles.smallTileGap}
                />
                <SquareTile
                  subheading="Request Agenda Item"
                  onPress={() => {/* TODO: request topic */}}
                  bgImgColour="red"
                  actionIcon={faAlignLeft}
                  style={styles.smallTileLast}
                />
              </View>
            </View>
          );
        })()}
        {/* Activities Section */}
        {activeTab==='Activities' && userActivities && userActivities.length > 0 && (() => {
          const now = new Date();
          const upcomingA = userActivities
            .filter(ac => ac.date && new Date(ac.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          const nextAct = upcomingA[0];
          const nextActWithSpace = upcomingA[1];
          // format activity date/time for tile
          const actDate = new Date(nextAct?.date);
          const actDateTime = actDate.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' });
          console.log('nextAct: ', nextAct);
          if (!nextAct) return null;
          return (
            <View style={styles.dualGrid}>
          <RectangularTile
                title="Upcoming"
                dateTime={actDateTime}
                // Show title and activity type separated by a dot
                subheading={`${nextAct.title} \u2022 ${nextAct.activityType?.name || ''}`}
                imageSource={{ uri: nextAct.imageUrl }}
                onPress={() => navigation.navigate('ActivityDetailCard', { activityId: nextAct._id, activityPreload: nextAct })}
                style={styles.largeTile}
              />
              <View style={styles.smallTilesColumn}>
                <SquareTile
                  subheading="Can You Facilitate?"
                  bgImgColour="blue"
                  onPress={() => navigation.navigate('ActivityDetailCard', { activityId: nextActWithSpace._id, activityPreload: nextActWithSpace })}
                  actionIcon={faQuestionCircle}
                  style={styles.smallTileGap}
                />
                <SquareTile
                  subheading="See All Activities"
                  bgImgColour="blue"
                  onPress={() => navigation.navigate('Activities')}
                  actionIcon={faAlignLeft}
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
                color={themeVariables.primaryColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>Ridvan Message 182 BE</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.primaryColor} />
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
                color={themeVariables.primaryColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>View All Activities</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.primaryColor} />
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity
            style={styles.createRow}
            onPress={() => navigation.navigate('Events')}
          >
            <View style={styles.createRowContent}>
              <FontAwesomeIcon
                icon={faBahai}
                size={16}
                color={themeVariables.primaryColor}
                style={styles.createIcon}
              />
              <Text style={styles.createRowText}>View All Events</Text>
            </View>
            <FontAwesomeIcon icon={faArrowRight} size={16} color={themeVariables.primaryColor} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: themeVariables.pirmaryColor,
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
    borderColor: themeVariables.primaryColor,
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
    color: themeVariables.primaryColor,
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
    color: themeVariables.primaryColor,
    textAlign: 'left',
    width: Platform.select({ android: 200 }),
  },
  createContainer: {
    marginHorizontal: 20,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
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
  postDate: {
    fontSize: 12,
    color: themeVariables.greyColor,
    marginTop: 8,
    textAlign: 'right',
  },
});

export default Home;
