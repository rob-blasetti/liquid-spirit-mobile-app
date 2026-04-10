import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BaseModal from './BaseModal';

const renderLimitValue = value =>
  value == null ? null : (
    <Text style={styles.modalLimitText}>{`Limit: ${String(value)}`}</Text>
  );

const SessionPeopleModal = ({
  visible,
  onClose,
  facilitators,
  participants,
  facilitatorCount,
  participantCount,
  facilitatorLimit,
  participantLimit,
  showFacilitatorRequestBadge,
  showParticipantRequestBadge,
  onFacilitatorRequest,
  onParticipantRequest,
  renderUserList,
  renderRequestBadge,
}) => (
  <BaseModal
    visible={visible}
    onClose={onClose}
    title="Who's in this session?">
    <View style={styles.modalSectionHeader}>
      <Text style={styles.sectionTitle}>
        {`Facilitators (${facilitatorCount})`}
      </Text>
      {renderLimitValue(facilitatorLimit)}
    </View>
    <View style={styles.modalUserGrid}>
      {renderUserList(facilitators, {
        contained: true,
        containerStyle: styles.modalUserBadgeCell,
      })}
      {showFacilitatorRequestBadge
        ? renderRequestBadge({
            label: `Request To\nFacilitate`,
            onPress: onFacilitatorRequest,
            containerStyle: styles.modalUserBadgeCell,
          })
        : null}
    </View>

    <View style={styles.modalSectionHeader}>
      <Text style={styles.sectionTitle}>
        {`Participants (${participantCount})`}
      </Text>
      {renderLimitValue(participantLimit)}
    </View>
    <View style={styles.modalUserGrid}>
      {renderUserList(participants, {
        contained: true,
        containerStyle: styles.modalUserBadgeCell,
      })}
      {showParticipantRequestBadge
        ? renderRequestBadge({
            label: `Request To\nParticipate`,
            onPress: onParticipantRequest,
            containerStyle: styles.modalUserBadgeCell,
          })
        : null}
    </View>
  </BaseModal>
);

const styles = StyleSheet.create({
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    width: '100%',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginRight: 12,
  },
  modalLimitText: {
    minWidth: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#7B7F87',
    textAlign: 'right',
    marginLeft: 12,
  },
  modalUserGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalUserBadgeCell: {
    width: '48%',
    marginBottom: 12,
  },
});

export default SessionPeopleModal;
