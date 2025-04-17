import React, { useContext, useState, useEffect } from 'react';
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
} from 'react-native';
import { Card, CardTitle, CardContent } from 'react-native-material-cards';
import FastImage from 'react-native-fast-image';
import Avatar from '@flipxyz/react-native-boring-avatars';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendar, faClock, faCarSide, faUsers, faPlusCircle, faFileAlt } from '@fortawesome/free-solid-svg-icons';

import themeVariables from '../styles/theme';
import { fetchEventDetails, joinEvent } from '../services/EventService';
import localImages from '../utils/localImages';
import UserBadge from '../components/UserBadge';
// import OversightBadges from '../components/OversightBadges'; // unused, replaced by avatars
import { fetchUserBodyByEventType } from '../services/UserBodyService';
import { UserContext } from '../contexts/UserContext';

const { height: windowHeight } = Dimensions.get('window');

const getDayName = d => d.toLocaleDateString(undefined, { weekday: 'long' });
const getDayMonth = d => d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
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
  const { eventPreload, oversightMembersPreload } = route.params;
  const { user, token } = useContext(UserContext);
  const [event, setEvent] = useState(eventPreload);
  const [optimisticJoin, setOptimisticJoin] = useState(false);

  // No initial API call: we use the passed-in preload event details directly.

  // No loading or error state: always render the card based on preloaded data.
  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noEventText}>Event details not available.</Text>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
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
  );
};

const EventCardBody = ({ event, setEvent, userId, token, optimisticJoin, setOptimisticJoin, oversightMembersPreload }) => {
  const { imageUrl, title, eventType, date, startTime, endTime, venue, attendees = [], host, materials = [] } = event;
  const dateObj = new Date(date);
  const dateMain = getDayName(dateObj);
  const dateSub = getDayMonth(dateObj);
  const timeMain = startTime ? parseTime(startTime) : 'N/A';
  // Append hyphen before end time to indicate range
  const timeSub = endTime ? `- ${parseTime(endTime)}` : '';
  const fullAddr = venue || 'No location';
  const hasJoined = optimisticJoin || attendees.some(a => a.refId?.toString() === userId?.toString());

  const openMaps = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`);
  const handleJoin = async () => {
    setOptimisticJoin(true);
    try {
      await joinEvent(event._id, token || '');
      const updated = await fetchEventDetails(event._id, token || '');
      setEvent(updated);
    } catch {
      setOptimisticJoin(false);
      alert('Failed to join event');
    }
  };

  const [attendeesModalVisible, setAttendeesModalVisible] = useState(false);
  const [oversightModalVisible, setOversightModalVisible] = useState(false);

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
  
  return (
    <Card style={styles.card}>
      {imageUrl && (
        localImages[imageUrl] ? (
          <Image source={localImages[imageUrl]} style={styles.banner} resizeMode="cover" />
        ) : (
          <FastImage source={{ uri: imageUrl }} style={styles.banner} resizeMode={FastImage.resizeMode.cover} />
        )
      )}
      <View style={styles.overlayCard}>
        {hasJoined && (
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>Attending</Text>
          </View>
        )}
        <CardTitle title={title} subtitle={eventType || ''} style={styles.titleBlock} />
        <CardContent style={styles.cardContent}>
          {/* Date / Time / Location */}
          <View style={styles.detailRow}>
            <DetailCell icon={faCalendar} label="Date" main={dateMain} sub={dateSub} />
            <DetailCell icon={faClock} label="Time" main={timeMain} sub={timeSub} />
            <DetailCell
              icon={faCarSide}
              label="Location"
              main={fullAddr}
              sub=""
              isLink
              onPress={openMaps}
            />
          </View>

          {/* Host & Materials */}
          <View style={styles.sectionsContainer}>
            {/* Host */}
            <View style={styles.sideSection}>
              <Text style={styles.sectionTitle}>Host</Text>
              {host ? (
                host.profilePicture ? (
                  <FastImage source={{ uri: host.profilePicture }} style={styles.hostAvatar} />
                ) : (
                  <Avatar
                    size={styles.hostAvatar.width}
                    name={`${host.firstName || ''} ${host.lastName || ''}`.trim()}
                    variant="beam"
                    colors={[ '#1B263B','#0A74DA','#6C7A89','#F8F9FA','#0C0C0C' ]}
                    style={styles.hostAvatar}
                  />
                )
              ) : (
                <>
                  <Text style={styles.noHostText}>No host yet</Text>
                  <TouchableOpacity style={styles.requestButton} onPress={() => alert('Request Host')}>
                    <Text style={styles.requestButtonText}>Request Host</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View style={styles.dividerVertical} />
            {/* Materials */}
            <View style={styles.sideSection}>
              <Text style={styles.sectionTitle}>Materials</Text>
              {materials.length > 0 ? (
                <View style={styles.materialsContainer}>
                  {materials.map((mat, idx) => (
                    <TouchableOpacity
                      key={mat._id || mat.name || idx}
                      style={styles.materialTile}
                      onPress={() => alert(`Material: ${mat.name}`)}
                    >
                      <FontAwesomeIcon icon={faFileAlt} size={16} color={themeVariables.primaryColor} />
                      <Text style={styles.materialText}>{mat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No materials available</Text>
              )}
            </View>
          </View>

          {/* Oversight & Attendees */}
          <View style={styles.sectionsContainer}>
            {/* Oversight Body (left) - entire section clickable */}
            <TouchableOpacity style={styles.sideSection} onPress={() => setOversightModalVisible(true)} activeOpacity={0.8}>
              <Text style={styles.sectionTitle}>Oversight Body</Text>
              <Text style={styles.sectionSubtitle}>{oversightBody.name}</Text>
              {oversightLoading ? (
                <ActivityIndicator size="small" color={themeVariables.primaryColor} />
              ) : oversightBody.members.length > 0 ? (
                <OverlappingAvatars list={oversightBody.members.map(u => ({ details: u }))} />
              ) : (
                <Text style={styles.noDataText}>No oversight available</Text>
              )}
            </TouchableOpacity>
            <View style={styles.dividerVertical} />
            {/* Attendees (right) - entire section clickable */}
            <TouchableOpacity style={styles.sideSection} onPress={() => setAttendeesModalVisible(true)} activeOpacity={0.8}>
              <Text style={styles.sectionTitle}>Attendees ({attendees.length})</Text>
              {attendees.length > 0 ? (
                <OverlappingAvatars list={attendees.map(a => ({ details: a.user || a }))} />
              ) : (
                <Text style={styles.noDataText}>No attendees</Text>
              )}
              {/* Join Event button for non-attending users */}
              {!hasJoined && (
                <View style={styles.requestButtonWrapper}>
                  <TouchableOpacity style={styles.requestButton} onPress={handleJoin} activeOpacity={0.8}>
                    <FontAwesomeIcon icon={faPlusCircle} size={18} color={themeVariables.primaryColor} />
                    <Text style={styles.requestButtonText}>Attend</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </CardContent>
      </View>
      <BadgeModal
        visible={attendeesModalVisible}
        onClose={() => setAttendeesModalVisible(false)}
        list={attendees.map(a => ({ details: a.user || a, certifications: a.certifications }))}
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
    <FontAwesomeIcon icon={icon} size={18} color="#312783" />
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
    <FontAwesomeIcon icon={icon} size={18} color="#312783" style={styles.detailIcon} />
    <Text style={[styles.detailLabel, labelStyle]}>{label}</Text>
    <Text style={[styles.detailValue, isLink && styles.linkText, mainStyle]}>{main}</Text>
    {sub ? <Text style={[styles.detailSub, subStyle]}>{sub}</Text> : null}
  </TouchableOpacity>
);
const OverlappingAvatars = ({ list }) => {
  const maxDisplay = 2;
  const extraCount = list.length - maxDisplay;
  const displayList = list.slice(0, maxDisplay);
  return (
    <View style={styles.avatarsContainer}>
      {displayList.map((item, idx) => {
        const key = item.details?._id || idx;
        const user = item.details || {};
        const avatarUri = user.profilePicture;
        const style = [styles.avatar, idx > 0 && { marginLeft: -15 }];
        return avatarUri ? (
          <FastImage key={key} source={{ uri: avatarUri }} style={style} />
        ) : (
          <Avatar key={key} size={styles.avatar.width} name={`${user.firstName||''} ${user.lastName||''}`.trim()} variant="beam" colors={[ '#1B263B','#0A74DA','#6C7A89','#F8F9FA','#0C0C0C' ]} style={style} />
        );
      })}
      {extraCount > 0 && (
        <View key="extra" style={[styles.avatar, styles.extraCount, { marginLeft: -15 }]}><Text style={styles.extraCountText}>+{extraCount}</Text></View>
      )}
    </View>
  );
};
const BadgeModal = ({ visible, onClose, list, title }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <ScrollView contentContainerStyle={styles.modalList}>
              {list.map((item, idx) => {
                const key = item.user?._id || item.details?._id || idx;
                const user = item.user || item.details || item;
                const certs = item.certifications;
                return (
                  <View key={key} style={styles.modalBadgeWrap}>
                    <UserBadge user={user} userCertifications={certs} />
                  </View>
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
const styles = StyleSheet.create({
  scroll:{flexGrow:1,backgroundColor:themeVariables.whiteColor,paddingBottom:30},
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
  overlayCard:{width:'100%',marginTop:-40,backgroundColor:'#fff',borderRadius:16,padding:16,shadowColor:'#000',shadowOpacity:0.15,shadowRadius:6,shadowOffset:{width:0,height:3},elevation:4},
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
  detailLabel:{fontSize:11,color:'#666',marginBottom:4,textAlign:'center'},
  detailValue:{fontSize:14,fontWeight:'600',color:'#312783',marginBottom:4,textAlign:'center'},
  detailSub:{fontSize:12,color:'#666',textAlign:'center'},
  sectionsContainer:{flexDirection:'row',borderWidth:1,borderColor:'#ddd',borderRadius:12,backgroundColor:'#fff',marginBottom:14,overflow:'hidden'},
  sideSection:{flex:1,paddingVertical:10,paddingHorizontal:10,alignItems:'center'},
  dividerVertical:{width:1,backgroundColor:'#ddd'},
  avatarsContainer:{flexDirection:'row',justifyContent:'center',alignItems:'center'},
  avatar:{width:40,height:40,borderRadius:20,borderWidth:1,borderColor:'#fff'},
  extraCount:{backgroundColor:'#666',justifyContent:'center',alignItems:'center'},
  extraCountText:{color:'#fff',fontSize:14,fontWeight:'600'},
  modalContainer:{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'},
  modalContent:{backgroundColor:themeVariables.whiteColor,borderTopLeftRadius:16,borderTopRightRadius:16,padding:16,maxHeight:'80%'},
  modalTitle:{fontSize:18,fontWeight:'bold',textAlign:'center',marginBottom:12,color:themeVariables.blackColor},
  modalList:{flexDirection:'row',flexWrap:'wrap',justifyContent:'flex-start'},
  modalBadgeWrap:{width:100,alignItems:'center',margin:8},
  modalCloseButton:{padding:12,backgroundColor:themeVariables.primaryColor,borderRadius:20,alignItems:'center',marginTop:16},
  modalCloseText:{color:themeVariables.whiteColor,fontWeight:'600',fontSize:16},
  requestButton:{flexDirection:'row',alignItems:'center',paddingVertical:8,paddingHorizontal:12,borderRadius:20,backgroundColor:'#eee'},
  requestButtonWrapper:{marginTop:8,alignItems:'center'},
  requestButtonText:{fontSize:14,fontWeight:'600',color:themeVariables.primaryColor,marginLeft:6},
  /* New Section Styles */
  sectionContainer:{
    borderWidth:1,
    borderColor:'#ddd',
    borderRadius:12,
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
  },
  sectionSubtitle: {
    fontSize:12,
    color:'#666',
    textAlign:'center',
    marginBottom:8,
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
  },
  statusChip:{position:'absolute',top:16,right:12,backgroundColor:themeVariables.primaryColor,borderRadius:12,paddingHorizontal:8,paddingVertical:4,zIndex:10},
  statusChipText:{color:themeVariables.whiteColor,fontSize:12,fontWeight:'600'},
});

export default EventDetailCard;