import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import themeVariables from '../styles/theme';
import UserCell from './UserCell';
import { BlurView } from '@react-native-community/blur';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-regular-svg-icons';

const SessionCard = ({
  session,
  detailsLoaded,
  hasFacilitatorSpace,
  hasParticipantSpace,
  isUserFacilitator,
  isUserParticipant,
  hasRequestedFacilitator,
  hasRequestedParticipant,
  onFacilitatorRequest,
  onParticipantRequest,
  width,
}) => {
  // Extract curriculum lesson details from session
  const { curriculumLesson } = session;
  // Data fields: grade, setTitle, lessonNumber, lessonTitle
  const grade = curriculumLesson?.grade;
  const setTitle = curriculumLesson?.setTitle || curriculumLesson?.set;
  const lessonNumber = curriculumLesson?.lessonNumber;
  let statusIcon;
  switch (session.status) {
    case 'Scheduled':
      statusIcon = faClock;
      break;
    case 'Completed':
      statusIcon = faCheckCircle;
      break;
    case 'Cancelled':
    case 'Expired':
      statusIcon = faTimesCircle;
      break;
    default:
      statusIcon = null;
  }
  
  const [modalVisible, setModalVisible] = useState(false);
  const overlayOpacity = useState(new Animated.Value(0))[0];
  // navigation to curriculum detail
  const navigation = useNavigation();

  const renderUserList = (users, type) => users.slice(0, 3).map((item, i) => (
    <UserCell key={item.refId?._id || i} user={item.refId || item.details || item} type={item.type} />
  ));

  const openModal = () => {
  setModalVisible(true);
  Animated.timing(overlayOpacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
    easing: Easing.out(Easing.ease),
  }).start();
};

const closeModal = () => {
  Animated.timing(overlayOpacity, {
    toValue: 0,
    duration: 200,
    useNativeDriver: true,
    easing: Easing.in(Easing.ease),
  }).start(() => {
    setModalVisible(false);
  });
};

  return (
    <View style={[styles.sessionCard, { width }]}> 
      <View style={styles.sessionCardHeader}>
        <Text style={styles.sessionCardDate}>
          {session.dateObj.toLocaleDateString(undefined, {
            weekday: 'short', month: 'short', day: 'numeric',
          })}
        </Text>
        <View style={styles.sessionStatusInline}>
          {statusIcon && (
            <FontAwesomeIcon
              icon={statusIcon}
              size={14}
              color={themeVariables.whiteColor}
              style={styles.statusIcon}
            />
          )}
          <Text style={styles.sessionStatusInlineText}>{session.status}</Text>
        </View>
      </View>
      {/* curriculum lesson summary */}
      {grade != null && (
        <TouchableOpacity
          style={styles.curriculumContainer}
          activeOpacity={0.8}
          // onPress={() => navigation.navigate('CurriculumDetailScreen', { curriculumLesson })}
        >
          <Text style={styles.curriculumTitle}>Grade {grade}</Text>
          {setTitle && <Text style={styles.curriculumSet}>{setTitle}</Text>}
          {lessonNumber != null && (
            <Text style={styles.curriculumLesson}>Lesson {lessonNumber}</Text>
          )}
        </TouchableOpacity>
      )}
      <View style={styles.sectionsContainer}>
        <View style={styles.sideSection}>
          <Text style={styles.sessionSectionTitle}>Facilitators</Text>
          <View style={styles.userListContainer}>{renderUserList(session.facilitators)}</View>
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.sideSection}>
          <Text style={styles.sessionSectionTitle}>Participants</Text>
          <View style={styles.userListContainer}>{renderUserList(session.participants)}</View>
        </View>
      </View>

      <TouchableOpacity onPress={openModal} style={styles.seeMoreContainer}>
        <BlurView style={styles.blurView} blurType="light" blurAmount={10} />
        <Text style={styles.seeMoreText}>See More</Text>
      </TouchableOpacity>

      <Modal animationType="fade" transparent visible={modalVisible}>
  <TouchableWithoutFeedback onPress={closeModal}>
    <Animated.View style={[styles.modalOverlay, { opacity: overlayOpacity }]}>
      <TouchableWithoutFeedback>
        <View style={styles.modalContent}>
          <ScrollView>

            {/* Facilitators Section */}
            <View style={styles.modalSectionHeader}>
              <Text style={styles.modalTitle}>Facilitators</Text>
              {detailsLoaded && hasFacilitatorSpace && !isUserFacilitator && !hasRequestedFacilitator && (
                <TouchableOpacity style={styles.requestButtonSmall} onPress={onFacilitatorRequest}>
                  <FontAwesomeIcon icon={faPlusCircle} size={16} color={themeVariables.whiteColor} />
                  <Text style={styles.requestButtonText}>Request Join</Text>
                </TouchableOpacity>
              )}
            </View>
            {session.facilitators.map((item, i) => (
              <UserCell key={item.refId?._id || i} user={item.refId || item.details || item} type={item.type} />
            ))}

            {/* Participants Section */}
            <View style={styles.modalSectionHeader}>
              <Text style={styles.modalTitle}>Participants</Text>
              {detailsLoaded && hasParticipantSpace && !isUserParticipant && !hasRequestedParticipant && (
                <TouchableOpacity style={styles.requestButtonSmall} onPress={onParticipantRequest}>
                  <FontAwesomeIcon icon={faPlusCircle} size={16} color={themeVariables.whiteColor} />
                  <Text style={styles.requestButtonText}>Request Join</Text>
                </TouchableOpacity>
              )}
            </View>
            {session.participants.map((item, i) => (
              <UserCell key={item.refId?._id || i} user={item.refId || item.details || item} type={item.type} />
            ))}

          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  </TouchableWithoutFeedback>
</Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: themeVariables.whiteColor,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 100,
    borderRadius: 12,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  sessionCardDate: {
    fontSize: 18,
    color: themeVariables.blackColor
  },
  sessionStatusInline: {
    flexDirection: 'row', // <-- This makes icon and text appear side-by-side
    alignItems: 'center', // Vertically aligns icon with text
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    marginRight: 10,
  },
  sessionStatusInlineText: {
    color: themeVariables.whiteColor,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionsContainer: {
    flexDirection: 'row',
  },
  curriculumContainer: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  curriculumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.primaryColor,
    marginBottom: 4,
  },
  curriculumSet: {
    fontSize: 14,
    fontWeight: '500',
    color: themeVariables.textColor || '#555',
    marginBottom: 4,
  },
  curriculumLesson: {
    fontSize: 14,
    color: themeVariables.textColor || '#333',
  },
  sideSection: {
    flex: 1,
    alignItems: 'flex-start',
    paddingVertical: 10,
    width: '100%',
  },

  sessionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
  },
  statusIcon: {
    marginRight: 6,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 15,
    marginVertical: 40, // this shortens the divider by adding space at top and bottom
  },
  userListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  seeMoreContainer: {
    position: 'relative',
    alignSelf: 'stretch',
    padding: 10,
    alignItems: 'center',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  seeMoreText: {
    fontWeight: '600',
    backgroundColor: themeVariables.whiteColor,
    color: themeVariables.primaryColor,
    borderStyle: 'solid',
    borderColor: themeVariables.primaryColor,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
  modalContent: {
    backgroundColor: themeVariables.whiteColor,
    padding: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 10,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  requestButtonSmall: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 16,
  },
  requestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 20,
    marginVertical: 10,
    width: 140,
  },
  requestButtonText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
    marginLeft: 6,
  },
  closeModal: {
    marginTop: 10,
    alignItems: 'center',
  },
  closeText: {
    color: themeVariables.primaryColor,
  },
});

export default SessionCard;