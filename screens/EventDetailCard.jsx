import React, { useContext, useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Linking,
  Dimensions,
  Modal,
  Image,
  StatusBar,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Card, CardTitle, CardContent } from 'react-native-material-cards';
import FastImage from 'react-native-fast-image';
import ImageViewing from 'react-native-image-viewing';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../styles/theme';
import { fetchEventDetails, joinEvent } from '../services/EventService';
import localImages from '../utils/localImages';
import UserBadge from '../components/UserBadge';
import UserCell from '../components/UserCell';
// import OversightBadges from '../components/OversightBadges'; // unused, replaced by avatars
import { fetchUserBodyByEventType } from '../services/UserBodyService';
import { UserContext } from '../contexts/UserContext';
import { API_URL } from '../config';
// Amount to offset content so top corners are hidden initially
const HEADER_OFFSET = 0;

const { height: windowHeight } = Dimensions.get('window');

// Get abbreviated weekday name, e.g. "Wed"
const getDayName = d => d.toLocaleDateString(undefined, { weekday: 'short' });
const getDayMonth = d => d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
// Format day and month with full month name, e.g. "30 July"
const getDayMonthName = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
// Parse time strings (ISO datetime or HH:mm) into a localized time string
const parseTime = timeStr => {
  const dt = new Date(timeStr);
  if (!isNaN(dt.getTime())) {
    return dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const parts = timeStr.split(':');
  const hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  return new Date(1970, 0, 1, hour, minute).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const EventDetailCard = ({ route }) => {
  // Enable swipe-down to dismiss
  const navigation = useNavigation();
  const { eventPreload, oversightMembersPreload, eventId } = route.params;
  const [event, setEvent] = useState(eventPreload || null);
  const [bannerViewerVisible, setBannerViewerVisible] = useState(false);
  const handleShare = async () => {
    const id = event?._id || eventId;
    if (!id) return;
    const url = `https://www.liquidspirit.org/events/${id}`;
    const title = event?.title || 'Liquid Spirit Event';
    const message = `Check out this event on Liquid Spirit \uD83D\uDC47\n${url}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const messengerUrl = `fb-messenger://share?link=${encodeURIComponent(url)}`;

    try {
      if (await Linking.canOpenURL(whatsappUrl)) {
        await Linking.openURL(whatsappUrl);
        return;
      }
      if (await Linking.canOpenURL(messengerUrl)) {
        await Linking.openURL(messengerUrl);
        return;
      }
      await Share.share({ message, url, title });
    } catch (err) {
      console.error('Error sharing:', err);
      Alert.alert('Sharing Error', 'Something went wrong while trying to share the event.');
    }
  };
  // Add share button in header, styled like back arrow
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{
            backgroundColor: themeVariables.greyColor,
            borderRadius: themeVariables.borderRadiusPill,
            padding: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color={themeVariables.blackColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, event]);
  const { user, token, communityId } = useContext(UserContext);
  const [optimisticJoin, setOptimisticJoin] = useState(false);

  // Fetch full event details in the background and update state
  useEffect(() => {
    if (eventPreload) {
      setEvent(eventPreload);
    }
    if (eventId && token) {
      fetchEventDetails(eventId, token)
        .then(data => setEvent(data))
        .catch(err => console.error('Error fetching event details:', err));
    }
  }, [eventId, token, eventPreload]);
  // Show loading spinner while fetching event details
  if (!event) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['left','right','bottom']}>
      {/* Use dark-content for status bar icons */}
      <StatusBar animated translucent backgroundColor="transparent" barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_OFFSET, paddingBottom: 30 }}
        overScrollMode="always"
        scrollEventThrottle={16}
        onScrollEndDrag={({ nativeEvent }) => {
          if (nativeEvent.contentOffset.y < -HEADER_OFFSET / 2) {
            navigation.goBack();
          }
        }}
      >
        <EventCardBody
          event={event}
          setEvent={setEvent}
          userId={user?.id}
          token={token}
          optimisticJoin={optimisticJoin}
          setOptimisticJoin={setOptimisticJoin}
          oversightMembersPreload={oversightMembersPreload}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const EventCardBody = ({ event, setEvent, userId, token, optimisticJoin, setOptimisticJoin, oversightMembersPreload }) => {
  // Access current user and community from context for joining
  const { user, communityId } = useContext(UserContext);
  // Destructure raw attendees from event; we'll enrich with full user data below
  const { imageUrl, title, eventType, date, startTime, endTime, venue,
    attendees: rawAttendees = [], host, materials = [] } = event;
  const dateObj = new Date(date);
  const dateMain = getDayName(dateObj);
  const dateSub = getDayMonth(dateObj);
  // Full month name, e.g. "30 July"
  const dateSubName = getDayMonthName(dateObj);
  const timeMain = startTime ? parseTime(startTime) : 'N/A';
  // Append hyphen before end time to indicate range
  const timeSub = endTime ? `- ${parseTime(endTime)}` : '';
  const fullAddr = venue || 'No location';
  // Map region state for location map
  const [region, setRegion] = useState(null);
  useEffect(() => {
    if (!fullAddr) return;
    const q = encodeURIComponent(fullAddr);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`)
      .then(res => res.json())
      .then(results => {
        if (results && results.length > 0) {
          const { lat, lon } = results[0];
          setRegion({
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      })
      .catch(err => console.warn('Geocode error', err));
  }, [fullAddr]);
  // Determine join status based on raw attendees (before enrichment)
  const hasJoined = optimisticJoin || rawAttendees.some(a => a.refId?.toString() === userId?.toString());

  const openMaps = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`);
  const handleJoin = async () => {
    setOptimisticJoin(true);
    try {
      // Join the event and notify community
      await joinEvent(event._id, token || '', event.title, user, communityId);
      const updated = await fetchEventDetails(event._id, token || '');
      setEvent(updated);
    } catch (err) {
      setOptimisticJoin(false);
      console.error('Join event failed:', err);
      alert('Failed to join event');
    }
  };

  const [attendeesModalVisible, setAttendeesModalVisible] = useState(false);
  const [oversightModalVisible, setOversightModalVisible] = useState(false);
  // State for enriched attendees: load full user data for each attendee
  const [enrichedAttendees, setEnrichedAttendees] = useState(null);

  // State for oversight body members; initialize name based on eventType to avoid empty jump
  const defaultOversightName = (eventType || '').toLowerCase().includes('feast')
    ? 'Feast Committee'
    : (eventType || '').toLowerCase().includes('holy')
      ? 'Holy Days Committee'
      : 'Local Spiritual Assembly';
  // Initialize with preloaded members if available to avoid loading jump
  const [oversightBody, setOversightBody] = useState({ name: defaultOversightName, members: oversightMembersPreload || [] });
  const [oversightLoading, setOversightLoading] = useState(!oversightMembersPreload);
  
  // Fetch appropriate body members based on eventType
  useEffect(() => {
    let isMounted = true;
    // Skip fetch if preloaded
    if (oversightMembersPreload) {
      return () => { isMounted = false; };
    }
    const loadBody = async () => {
      const type = (eventType || '').toLowerCase();
      let name;
      if (type.includes('feast')) {
        name = 'Feast Committee';
      } else if (type.includes('holy')) {
        name = 'Holy Days Committee';
      } else {
        name = 'Local Spiritual Assembly';
      }
      try {
        setOversightLoading(true);
        const members = await fetchUserBodyByEventType(eventType, token);
        if (isMounted) {
          setOversightBody({ name, members });
          setOversightLoading(false);
        }
      } catch (err) {
        console.error('Failed to load oversight body members', err);
        if (isMounted) setOversightLoading(false);
      }
    };
    loadBody();
    return () => { isMounted = false; };
  }, [eventType, oversightMembersPreload]);
  
  const attendees = enrichedAttendees ?? rawAttendees;
  
  return (
    <Card style={styles.card}>
      {imageUrl && (
        <TouchableOpacity onPress={() => setBannerViewerVisible(true)}>
          {localImages[imageUrl] ? (
            <Image source={localImages[imageUrl]} style={styles.banner} resizeMode="cover" />
          ) : (
            <FastImage source={{ uri: imageUrl }} style={styles.banner} resizeMode={FastImage.resizeMode.cover} />
          )}
        </TouchableOpacity>
      )}
      <ImageViewing
        images={[{ uri: imageUrl }]}
        imageIndex={0}
        visible={bannerViewerVisible}
        onRequestClose={() => setBannerViewerVisible(false)}
      />
      <View style={styles.overlayCard}>
        {hasJoined && (
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>Attending</Text>
          </View>
        )}
        <CardTitle
          title={title}
          subtitle={eventType || ''}
          style={styles.titleBlock}
          titleStyle={styles.cardTitleText}
          subtitleStyle={styles.cardSubtitleText}
        />
        <CardContent style={styles.cardContent}>
          {/* Date & Time */}
          <View style={styles.headerInfoContainer}>
            <Text style={styles.headerInfoText}>
              {dateMain} ‧ {dateSubName} ‧ {timeMain} {timeSub}
            </Text>
          </View>
          <View style={styles.divider} />

          {/* Host Address */}
          <Text style={styles.mapTitle}>Where is it?</Text>
          <View style={styles.mapWrapper}>
            {region ? (
              <MapView style={styles.map} initialRegion={region}>
                <Marker coordinate={region} />
              </MapView>
            ) : (
              <View style={styles.mapLoader}>
                <ActivityIndicator size="small" color={themeVariables.primaryColor} />
              </View>
            )}
          </View>
          <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>  
            {fullAddr}
          </Text>
          <View style={styles.divider} />

          {/* Host Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.mapTitle, { marginTop: 0, marginBottom: 0 }]}>Host</Text>
            {!host && (
              <TouchableOpacity style={styles.requestButton} onPress={() => alert('Request Host')} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={18} color={themeVariables.whiteColor} />
                <Text style={styles.requestButtonText}>Request Host</Text>
              </TouchableOpacity>
            )}
          </View>
          {host ? (
            <UserBadge user={host} userCertifications={host.certifications} />
          ) : (
            <Text style={styles.headerInfoText}>No host yet</Text>
          )}
          <View style={styles.divider} />
          {/* Materials */}
          <Text style={styles.mapTitle}>Materials</Text>
          {materials.length > 0 ? (
            <View style={styles.materialsContainer}>
              {materials.map((mat, idx) => {
                const url = mat.url || mat.link || mat.fileUrl;
                return (
                  <TouchableOpacity
                    key={mat._id || mat.name || idx}
                    style={styles.materialTile}
                    onPress={() => url && Linking.openURL(url)}
                    disabled={!url}
                  >
                    <Ionicons name="document-outline" size={16} color={themeVariables.primaryColor} />
                    <Text style={[styles.materialText, url && styles.linkText]} numberOfLines={1}>
                      {mat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.headerInfoText}>No materials available</Text>
          )}
          <View style={styles.divider} />
          {/* Oversight Body */}
          <Text style={styles.mapTitle}>Oversight Body</Text>
          {/* Show committee name */}
          <Text style={[styles.headerInfoText, { marginBottom: 8, alignSelf: 'flex-start' }]}>
            {oversightBody.name}
          </Text>
          {oversightLoading ? (
            <ActivityIndicator size="small" color={themeVariables.primaryColor} />
          ) : oversightBody.members.length > 0 ? (
            <>
              <View style={styles.userListContainer}>
                {oversightBody.members.slice(0, 4).map((member, idx) => (
                  <View key={member._id || idx} style={styles.userListItem}>
                    <UserCell user={member} type="Member" />
                  </View>
                ))}
              </View>
              {oversightBody.members.length > 4 && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={() => setOversightModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeMoreButtonText}>See More</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.headerInfoText}>No oversight available</Text>
          )}
          <View style={styles.divider} />
          {/* Attendees */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.mapTitle, { marginTop: 0, marginBottom: 0 }]}>Attendees ({attendees.length})</Text>
            {!hasJoined && (
              <TouchableOpacity style={styles.requestButton} onPress={handleJoin} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={18} color={themeVariables.whiteColor} />
                <Text style={styles.requestButtonText}>Attend</Text>
              </TouchableOpacity>
            )}
          </View>
          {attendees.length > 0 ? (
            <View style={styles.userListContainer}>
              {attendees.map((a, idx) => {
                const user = a.details || a.user || a;
                return <UserCell key={user._id || idx} user={user} type={a.type} />;
              })}
            </View>
          ) : (
            <Text style={styles.headerInfoText}>No attendees</Text>
          )}
          <View style={styles.divider} />
        </CardContent>
      </View>
      <BadgeModal
        visible={attendeesModalVisible}
        onClose={() => setAttendeesModalVisible(false)}
        list={attendees.map(a => ({ details: a.details || a.user || a, certifications: a.certifications }))}
        title="Attendees"
      />
      <BadgeModal
        visible={oversightModalVisible}
        onClose={() => setOversightModalVisible(false)}
        list={oversightBody.members}
        title={oversightBody.name}
      />
    </Card>
  );
};

const Fact = ({ icon, label, value, onPress, link }) => (
  <TouchableOpacity
    style={styles.factBox}
    disabled={!onPress}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons name={icon} size={18} color="#312783" />
    <Text style={styles.factLabel}>{label}</Text>
    <Text style={[styles.factValue, link && styles.linkText]} numberOfLines={1}>
      {value}
    </Text>
  </TouchableOpacity>
);
const DetailCell = ({ icon, label, main, sub, onPress, isLink, style: cellStyle, labelStyle, mainStyle, subStyle }) => (
  <TouchableOpacity
    style={[styles.detailCell, cellStyle]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={18} color="#312783" style={styles.detailIcon} />
    <Text style={[styles.detailLabel, labelStyle]}>{label}</Text>
    <Text style={[styles.detailValue, isLink && styles.linkText, mainStyle]}>{main}</Text>
    {sub ? <Text style={[styles.detailSub, subStyle]}>{sub}</Text> : null}
  </TouchableOpacity>
);
const OverlappingAvatars = ({ list }) => {
  const maxDisplay = 2;
  const extraCount = list.length - maxDisplay;
  const displayList = list.slice(0, maxDisplay);
  const navigation = useNavigation();
  return (
    <View style={styles.avatarsContainer}>
      {displayList.map((item, idx) => {
        const key = item.details?._id || idx;
        const user = item.details || {};
        const avatarUri = user.profilePicture;
        const imageStyle = [styles.avatar, idx > 0 && { marginLeft: -15 }];
        return (
          <TouchableOpacity
            key={key}
            style={imageStyle}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('PublicUserProfile', { userId: user._id })}
          >
            {avatarUri ? (
              <FastImage source={{ uri: avatarUri }} style={imageStyle} />
            ) : (
              <Avatar
                size={styles.avatar.width}
                name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                variant="beam"
                colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
                style={imageStyle}
              />
            )}
          </TouchableOpacity>
        );
      })}
      {extraCount > 0 && (
        <View key="extra" style={[styles.avatar, styles.extraCount, { marginLeft: -15 }]}>
          <Text style={styles.extraCountText}>+{extraCount}</Text>
        </View>
      )}
    </View>
  );
};
const BadgeModal = ({ visible, onClose, list, title }) => {
  const navigation = useNavigation();
  return (
  <Modal visible={visible} animationType="slide" transparent>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <ScrollView contentContainerStyle={styles.modalList}>
              {list.map((item, idx) => {
                const key = item.details?._id || item.user?._id || idx;
                const user = item.details || item.user || item;
                const certs = item.certifications;
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.modalBadgeWrap}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PublicUserProfile', { userId: user._id })}
                  >
                    <UserBadge user={user} userCertifications={certs} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton} activeOpacity={0.8}><Text style={styles.modalCloseText}>Close</Text></TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: themeVariables.whiteColor,
    paddingBottom: 30,
  },
  headerInfoContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  headerInfoText: {
    fontSize: 16,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  // Wrapper for MapView with corner radius matching ActivityDetailCard
  mapWrapper: {
    width: '100%',
    height: 300,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoader: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  cardSubtitleText: {
    fontSize: 20,
    color: '#444',
    textAlign: 'center',
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 14,
    alignSelf: 'flex-start',
    color: themeVariables.blackColor,
  },
  centered:{flex:1,minHeight:windowHeight,justifyContent:'center',alignItems:'center',backgroundColor:themeVariables.whiteColor},
  loadingWrapper:{flex:1,backgroundColor:themeVariables.whiteColor},
  loadingOverlayContainer:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(255,255,255,0.6)',justifyContent:'center',alignItems:'center'},
  errorText:{color:'red',fontSize:16},
  noEventText:{color:'#666',fontSize:18},
  card:{
    width:'100%',
    backgroundColor:'transparent',
    margin:0,
    padding:0,
  },
  banner:{width:'100%',height:220,borderRadius:0},
  overlayCard:{width:'100%',marginTop:-40,backgroundColor:'#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,padding:16,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:6,shadowOffset:{width:0,height:3},elevation:4},
  titleBlock:{paddingTop:0},
  factRow:{flexDirection:'row',justifyContent:'space-between',borderWidth:1,borderColor:'#ddd',borderRadius:12,paddingVertical:10,paddingHorizontal:10,marginBottom:14},
  factBox:{flex:1,alignItems:'center'},
  factLabel:{fontSize:11,color:'#666',marginTop:4},
  factValue:{fontSize:14,fontWeight:'600',color:themeVariables.blackColor},
  linkText:{color:themeVariables.primaryColor,textDecorationLine:'underline'},
  cardContent:{paddingTop:8,marginHorizontal:-15},
  detailRow:{flexDirection:'row',justifyContent:'space-between',borderWidth:1,borderColor:'#ddd',borderRadius:12,paddingHorizontal:10,paddingVertical:10,marginBottom:14},
  detailCell:{flex:1,alignItems:'center',paddingHorizontal:4},
  detailIcon:{marginBottom:6},
  detailLabel:{fontSize:11,color:'#666',marginBottom:4,textAlign:'center', textAlign: 'center', width: Platform.select({ android: 50 }) },
  detailValue:{fontSize:14,fontWeight:'600',color:'#312783',marginBottom:4,textAlign:'center', width: Platform.select({ android: 140 })},
  detailSub:{fontSize:12,color:'#666',textAlign:'center'},
  sectionsContainer:{
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 14,
    overflow: 'hidden',
  },
  sideSection:{flex:1,paddingVertical:10,paddingHorizontal:10,alignItems:'center'},
  dividerVertical:{width:1,backgroundColor:'#ddd'},
  sectionHeaderRow:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
  },
  avatarsContainer:{flexDirection:'row',justifyContent:'center',alignItems:'center'},
  // User list styling copied from SessionCard UserCell layout
  userListContainer:{flexDirection:'row',flexWrap:'wrap'},
  // Preview list item wrapper for two-column layout
  userListItem:{
    width:'50%',
    paddingVertical:4,
    paddingHorizontal:4,
  },
  avatar:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:'#fff'},
  extraCount:{backgroundColor:'#666',justifyContent:'center',alignItems:'center'},
  extraCountText:{color:'#fff',fontSize:14,fontWeight:'600'},
  modalContainer:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  modalContent:{backgroundColor:themeVariables.whiteColor,borderTopLeftRadius:16,borderTopRightRadius:16,padding:16,maxHeight:'80%'},
  modalTitle:{fontSize:18,fontWeight:'bold',textAlign:'center',marginBottom:12,color:themeVariables.blackColor},
  modalList:{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-start'},
  modalBadgeWrap:{width:100,alignItems:'center',margin:8},
  modalCloseButton:{
    // Limit width to content and center in modal
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText:{color:themeVariables.whiteColor,fontWeight:'600',fontSize:16},
  requestButton:{
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#312783',
  },
  requestButtonWrapper:{marginTop:8,alignItems:'center'},
  requestButtonText:{fontSize:14,fontWeight:'600',color:themeVariables.whiteColor,marginLeft:6, width: Platform.select({ android: 100 })},
  /* See More button for preview lists */
  seeMoreButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: themeVariables.whiteColor,
    color: themeVariables.primaryColor,
    borderStyle: 'solid',
    borderColor: themeVariables.primaryColor,
    borderWidth: 1,
    borderRadius: 16,
    marginVertical: 8,
  },
  seeMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.primaryColor,
  },
  /* Section container (unused) */
  sectionContainer:{
    borderWidth:1,
    borderColor:'#ddd',
    borderRadius:0,
    backgroundColor:'#fff',
    paddingVertical:10,
    paddingHorizontal:10,
    marginBottom:14,
    alignItems:'center',
  },
  sectionTitle:{
    fontSize:14,
    fontWeight:'bold',
    textAlign:'center',
    marginBottom:4,
    color:themeVariables.blackColor,
    textAlign: 'center',
    width: Platform.select({ android: 160 }),    
  },
  sectionSubtitle: {
    fontSize:12,
    color:'#666',
    textAlign:'center',
    marginBottom:8,
    textAlign: 'center',
    width: Platform.select({ android: 160 }),    
  },
  hostAvatar:{
    width:40,
    height:40,
    borderRadius:20,
    marginBottom:8,
  },
  noHostText:{
    fontSize:12,
    color:'#666',
    marginBottom:8,
    textAlign: 'center',
    width: Platform.select({ android: 160 }),    
  },
  materialsContainer:{
    flexDirection:'row',
    flexWrap:'wrap',
    justifyContent:'center',
  },
  materialTile:{
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#eee',
    borderRadius:8,
    paddingVertical:6,
    paddingHorizontal:10,
    margin:4,
  },
  materialText:{
    marginLeft:4,
    fontSize:12,
    color:themeVariables.blackColor,
  },
  noDataText:{
    fontSize:12,
    color:'#666',
    textAlign: 'center',
    width: Platform.select({ android: 160 }),    
  },
  statusChip:{position:'absolute',top:16,right:12,backgroundColor:themeVariables.primaryColor,borderRadius:12,paddingHorizontal:8,paddingVertical:4,zIndex:10},
  statusChipText:{color:themeVariables.whiteColor,fontSize:12,fontWeight:'600', width: Platform.select({ android: 65 })},
});

export default EventDetailCard;