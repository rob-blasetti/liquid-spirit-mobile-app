import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing, ScrollView, TouchableWithoutFeedback } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import UserCell from './UserCell';
import { Button } from 'liquid-spirit-styleguide/native';
const plusCircle = 'add-circle-outline';
const clockIcon = 'time-outline';
const checkCircle = 'checkmark-circle-outline';
const timesCircle = 'close-circle-outline';

const sanitizeUserList = (users) => {
  if (!Array.isArray(users)) return [];
  return users.filter(Boolean);
};

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
  let statusIcon;
  switch (session.status) {
    case 'Scheduled':
      statusIcon = clockIcon;
      break;
    case 'Completed':
      statusIcon = checkCircle;
      break;
    case 'Cancelled':
    case 'Expired':
      statusIcon = timesCircle;
      break;
    default:
      statusIcon = null;
  }

  const [modalVisible, setModalVisible] = useState(false);
  const overlayOpacity = useState(new Animated.Value(0))[0];

  const resolveUserDetails = (entry) => {
    if (!entry) return null;
    // Prefer hydrated details.
    if (entry.details && typeof entry.details === 'object') return entry.details;
    // refId can be an object (already hydrated) or a string (id wrapper). Only use when it's an object.
    if (entry.refId && typeof entry.refId === 'object') return entry.refId;
    if (entry.refID && typeof entry.refID === 'object') return entry.refID;
    if (typeof entry === 'object') return entry;
    return null;
  };

  const renderUserList = (users = []) =>
    sanitizeUserList(users)
      .slice(0, 3)
      .map((item, i) => {
        const userDetails = resolveUserDetails(item);
        return (
          <UserCell
            key={userDetails?._id || item?.refId?._id || item?._id || i}
            user={userDetails || { firstName: '', lastName: '' }}
            type={item?.type}
          />
        );
      });

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
            <Ionicons
              name={statusIcon}
              size={14}
              color={themeVariables.whiteColor}
              style={styles.statusIcon}
            />
          )}
          <Text style={styles.sessionStatusInlineText}>{session.status}</Text>
        </View>
      </View>
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

      <Button
        secondary
        size="small"
        label="See More"
        onPress={openModal}
        style={styles.seeMoreButton}
        textStyle={styles.seeMoreButtonText}
      />

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
                  <Ionicons name={plusCircle} size={16} color={themeVariables.whiteColor} />
                  <Text style={styles.requestButtonText}>Request Join</Text>
                </TouchableOpacity>
              )}
            </View>
            {sanitizeUserList(session.facilitators).map((item, i) => {
              const userDetails = resolveUserDetails(item);
              return (
                <UserCell
                  key={userDetails?._id || item?.refId?._id || item?._id || i}
                  user={userDetails || { firstName: '', lastName: '' }}
                  type={item?.type}
                />
              );
            })}

            {/* Participants Section */}
            <View style={styles.modalSectionHeader}>
              <Text style={styles.modalTitle}>Participants</Text>
              {detailsLoaded && hasParticipantSpace && !isUserParticipant && !hasRequestedParticipant && (
                <TouchableOpacity style={styles.requestButtonSmall} onPress={onParticipantRequest}>
                  <Ionicons name={plusCircle} size={16} color={themeVariables.whiteColor} />
                  <Text style={styles.requestButtonText}>Request Join</Text>
                </TouchableOpacity>
              )}
            </View>
            {sanitizeUserList(session.participants).map((item, i) => {
              const userDetails = resolveUserDetails(item);
              return (
                <UserCell
                  key={userDetails?._id || item?.refId?._id || item?._id || i}
                  user={userDetails || { firstName: '', lastName: '' }}
                  type={item?.type}
                />
              );
            })}

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
    color: themeVariables.blackColor,
  },
  sessionStatusInline: {
    flexDirection: 'row', // <-- This makes icon and text appear side-by-side
    alignItems: 'center', // Vertically aligns icon with text
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    marginRight: 14,
  },
  sessionStatusInlineText: {
    color: themeVariables.whiteColor,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionsContainer: {
    flexDirection: 'row',
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
  seeMoreButton: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  seeMoreButtonText: {
    fontWeight: '600',
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
