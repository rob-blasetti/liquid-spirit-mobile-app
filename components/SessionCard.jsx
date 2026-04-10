import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../styles/theme';
import SessionPeopleModal from './SessionPeopleModal';
import UserBadgeCell from './UserBadgeCell';

const plusCircle = 'add-circle-outline';
const clockIcon = 'alarm-outline';
const checkCircle = 'checkmark-circle-outline';
const timesCircle = 'close-circle-outline';
const DEFAULT_FACILITATOR_LIMIT = 2;
const DEFAULT_PARTICIPANT_LIMIT = 6;

const sanitizeUserList = users => {
  if (!Array.isArray(users)) return [];
  return users.filter(Boolean);
};

const hasDisplayName = user => {
  if (!user || typeof user !== 'object') return false;
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  return Boolean(
    fullName ||
      user?.name ||
      user?.displayName ||
      user?.fullName ||
      user?.username ||
      user?.email,
  );
};

const resolveNumericLimit = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === 'string') {
      const parsed = Number(candidate.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const formatSessionCardDate = date =>
  `${date.toLocaleDateString(undefined, {weekday: 'long'})} ${date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    },
  )}, ${date.toLocaleDateString(undefined, {year: 'numeric'})}`;

const SessionCard = ({
  session,
  hasFacilitatorSpace,
  hasParticipantSpace,
  isUserFacilitator,
  isUserParticipant,
  hasRequestedFacilitator,
  hasRequestedParticipant,
  facilitatorLimit,
  participantLimit,
  onFacilitatorRequest,
  onParticipantRequest,
  width,
  isNextUpcomingSession = false,
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
  const shouldShowInlineRequestBadges =
    !isUserFacilitator && !isUserParticipant;
  const facilitatorCount = sanitizeUserList(session.facilitators).length;
  const participantCount = sanitizeUserList(session.participants).length;
  const resolvedFacilitatorLimit = resolveNumericLimit(
    session?.facilitatorLimit,
    session?.maxFacilitators,
    session?.facilitatorCapacity,
    session?.limits?.facilitators,
    facilitatorLimit,
    DEFAULT_FACILITATOR_LIMIT,
  );
  const resolvedParticipantLimit = resolveNumericLimit(
    session?.participantLimit,
    session?.maxParticipants,
    session?.participantCapacity,
    session?.limits?.participants,
    participantLimit,
    DEFAULT_PARTICIPANT_LIMIT,
  );
  const hasSessionFacilitatorSpace =
    resolvedFacilitatorLimit == null
      ? hasFacilitatorSpace
      : facilitatorCount < resolvedFacilitatorLimit;
  const hasSessionParticipantSpace =
    resolvedParticipantLimit == null
      ? hasParticipantSpace
      : participantCount < resolvedParticipantLimit;
  const showFacilitatorRequestBadge =
    shouldShowInlineRequestBadges &&
    hasSessionFacilitatorSpace &&
    !hasRequestedFacilitator;
  const showParticipantRequestBadge =
    shouldShowInlineRequestBadges &&
    hasSessionParticipantSpace &&
    !hasRequestedParticipant;

  const resolveUserDetails = entry => {
    if (!entry) return null;
    // Prefer hydrated details.
    if (entry.details && typeof entry.details === 'object') return entry.details;
    // refId can be an object (already hydrated) or a string (id wrapper). Only use when it's an object.
    if (entry.refId && typeof entry.refId === 'object') return entry.refId;
    if (entry.refID && typeof entry.refID === 'object') return entry.refID;
    if (typeof entry === 'object') return entry;
    return null;
  };

  const getUserBadgeCellProps = (item, i) => {
    const userDetails = resolveUserDetails(item);
    const userCertifications =
      item?.certifications ||
      userDetails?.certifications ||
      item?.details?.certifications;
    const memberStatus = [
      userDetails?.status,
      userDetails?.memberStatus,
      userDetails?.member_status,
      item?.refId?.status,
      item?.refId?.memberStatus,
      item?.refID?.status,
      item?.refID?.memberStatus,
      item?.memberStatus,
      item?.member_status,
      item?.details?.status,
      item?.details?.memberStatus,
      item?.status,
    ].find(value => typeof value === 'string' && value.trim().length > 0);
    const normalizedType = String(item?.type || userDetails?.type || '')
      .trim()
      .toLowerCase();
    const loading = !hasDisplayName(userDetails) ||
      (normalizedType === 'member' && !memberStatus);

    return {
      key: userDetails?._id || item?.refId?._id || item?._id || i,
      user: userDetails || { firstName: '', lastName: '' },
      type: item?.type || userDetails?.type,
      userCertifications,
      memberStatus,
      loading,
    };
  };

  const renderUserList = (
    users = [],
    {limit, contained = false, containerStyle} = {},
  ) =>
    sanitizeUserList(users)
      .slice(0, limit)
      .map((item, i) => {
        const {key, ...badgeCellProps} = getUserBadgeCellProps(item, i);

        return (
          <UserBadgeCell
            key={key}
            {...badgeCellProps}
            contained={contained}
            containerStyle={containerStyle}
          />
        );
      });

  const renderRequestBadge = ({
    label,
    onPress,
    containerStyle,
  }) => (
    <TouchableOpacity
      style={[
        styles.inlineRequestBadge,
        styles.inlineRequestBadgeAction,
        containerStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <View style={[styles.inlineRequestAvatar, styles.inlineRequestAvatarAction]}>
        <Ionicons
          name={plusCircle}
          size={18}
          style={[
            styles.inlineRequestBadgeIcon,
            styles.inlineRequestBadgeIconAction,
          ]}
        />
      </View>
      <Text
        style={[
          styles.inlineRequestBadgeText,
          styles.inlineRequestBadgeTextAction,
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <View style={[styles.sessionCardShadow, {width}]}>
        <View style={styles.sessionCard}>
          <View style={styles.sessionCardHeader}>
            <View style={styles.sessionCardHeaderText}>
              {isNextUpcomingSession ? (
                <Text style={styles.nextUpcomingLabel}>Next Upcoming Session</Text>
              ) : null}
              <Text style={styles.sessionCardDate}>
                {formatSessionCardDate(session.dateObj)}
              </Text>
            </View>
            <View style={styles.sessionStatusInline}>
              {statusIcon && (
                <Ionicons
                  name={statusIcon}
                  size={12}
                  color={themeVariables.whiteColor}
                  style={styles.statusIcon}
                />
              )}
              <Text style={styles.sessionStatusInlineText}>{session.status}</Text>
            </View>
          </View>
          <View style={styles.sectionsContainer}>
            <View style={styles.sideSection}>
              <Text style={styles.sessionSectionTitle}>
                {`Facilitators (${facilitatorCount})`}
              </Text>
              <View style={styles.sideSectionBody}>
                <View style={styles.userListContainer}>
                  {renderUserList(session.facilitators, {
                    limit: 3,
                    contained: true,
                  })}
                </View>
                {showFacilitatorRequestBadge ? (
                  renderRequestBadge({
                    label: `Request To\nFacilitate`,
                    onPress: onFacilitatorRequest,
                    containerStyle: styles.inlineRequestBadgeInline,
                  })
                ) : null}
              </View>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.sideSection}>
              <Text style={styles.sessionSectionTitle}>
                {`Participants (${participantCount})`}
              </Text>
              <View style={styles.sideSectionBody}>
                <View style={styles.userListContainer}>
                  {renderUserList(session.participants, {
                    limit: 3,
                    contained: true,
                  })}
                </View>
                {showParticipantRequestBadge ? (
                  renderRequestBadge({
                    label: `Request To\nParticipate`,
                    onPress: onParticipantRequest,
                    containerStyle: styles.inlineRequestBadgeInline,
                  })
                ) : null}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.seeMoreTrigger}
            onPress={openModal}
            activeOpacity={0.7}>
            <Ionicons
              name="ellipsis-horizontal-circle-outline"
              size={18}
              style={styles.seeMoreTriggerIcon}
            />
            <Text style={styles.seeMoreTriggerText}>See more</Text>
          </TouchableOpacity>
        </View>
      </View>
      <SessionPeopleModal
        visible={modalVisible}
        onClose={closeModal}
        facilitators={session.facilitators}
        participants={session.participants}
        facilitatorCount={facilitatorCount}
        participantCount={participantCount}
        facilitatorLimit={resolvedFacilitatorLimit}
        participantLimit={resolvedParticipantLimit}
        showFacilitatorRequestBadge={showFacilitatorRequestBadge}
        showParticipantRequestBadge={showParticipantRequestBadge}
        onFacilitatorRequest={onFacilitatorRequest}
        onParticipantRequest={onParticipantRequest}
        renderUserList={renderUserList}
        renderRequestBadge={renderRequestBadge}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sessionCardShadow: {
    marginRight: 10,
  },
  sessionCard: {
    backgroundColor: themeVariables.whiteColor,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
    minWidth: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    overflow: 'hidden',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  sessionCardHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  nextUpcomingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: themeVariables.primaryColor,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  sessionCardDate: {
    fontSize: 18,
    color: themeVariables.blackColor,
  },
  sessionStatusInline: {
    flexDirection: 'row', // <-- This makes icon and text appear side-by-side
    alignItems: 'center', // Vertically aligns icon with text
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 14,
  },
  sessionStatusInlineText: {
    color: themeVariables.whiteColor,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionsContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  sideSection: {
    flex: 1,
    alignItems: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  sideSectionBody: {
    flex: 1,
    justifyContent: 'space-between',
  },

  sessionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginBottom: 8,
    textAlign: 'left',
  },
  statusIcon: {
    marginRight: 6,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
    marginVertical: 16,
  },
  userListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    width: '100%',
  },
  inlineRequestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 56,
  },
  inlineRequestBadgeInline: {
    marginTop: 10,
  },
  inlineRequestAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inlineRequestAvatarAction: {
    backgroundColor: '#EDE9FF',
  },
  inlineRequestAvatarMuted: {
    backgroundColor: '#ECEFF3',
  },
  inlineRequestBadgeAction: {
    backgroundColor: '#F6F7FB',
    borderColor: themeVariables.primaryColor,
    shadowColor: themeVariables.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  inlineRequestBadgeMuted: {
    backgroundColor: '#F6F7FB',
    borderColor: '#E8EBF0',
  },
  inlineRequestBadgeIcon: {
    marginRight: 0,
  },
  inlineRequestBadgeIconAction: {
    color: themeVariables.primaryColor,
  },
  inlineRequestBadgeIconMuted: {
    color: '#7B7F87',
  },
  inlineRequestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'left',
    flexShrink: 1,
    flex: 1,
  },
  inlineRequestBadgeTextAction: {
    color: themeVariables.primaryColor,
  },
  inlineRequestBadgeTextMuted: {
    color: '#7B7F87',
  },
  seeMoreTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  seeMoreTriggerIcon: {
    color: themeVariables.primaryColor,
    marginRight: 6,
  },
  seeMoreTriggerText: {
    color: themeVariables.primaryColor,
    fontSize: 14,
    fontWeight: '700',
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
