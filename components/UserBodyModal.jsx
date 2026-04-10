import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import BaseModal from './BaseModal';
import UserBadgeCell from './UserBadgeCell';
import themeVariables from '../styles/theme';

const getMemberBadgeData = member => {
  const user = member?.details || member?.user || member || {};

  return {
    key:
      member?._id ||
      member?.id ||
      user?._id ||
      user?.id ||
      `${user?.firstName || ''}-${user?.lastName || ''}`,
    user,
    type: user?.type || member?.type || 'Member',
    certifications: member?.certifications || user?.certifications,
  };
};

const UserBodyModal = ({
  visible,
  onClose,
  title,
  members = [],
  headerContent,
  emptyTitle = 'No members available',
  emptySubtitle = 'People in this body will appear here when available.',
}) => (
  <BaseModal
    visible={visible}
    onClose={onClose}
    title={title}
    headerContent={headerContent}
    contentContainerStyle={styles.contentContainer}>
    {Array.isArray(members) && members.length > 0 ? (
      <View style={styles.grid}>
        {members.map((member, index) => {
          const badgeData = getMemberBadgeData(member);
          const key =
            badgeData.key && String(badgeData.key).trim().length > 0
              ? String(badgeData.key)
              : `user-body-member-${index}`;

          return (
            <UserBadgeCell
              key={key}
              user={badgeData.user}
              type={badgeData.type}
              userCertifications={badgeData.certifications}
              contained
              containerStyle={styles.memberBadge}
            />
          );
        })}
      </View>
    ) : (
      <View style={styles.emptyStateCard}>
        <View style={styles.emptyStateIconWrap}>
          <Ionicons
            name="people-outline"
            size={22}
            color={themeVariables.primaryColor}
          />
        </View>
        <Text style={styles.emptyStateTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyStateSubtitle}>{emptySubtitle}</Text>
      </View>
    )}
  </BaseModal>
);

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 6,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberBadge: {
    width: '49%',
    marginBottom: 12,
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginVertical: 8,
    borderRadius: 22,
    backgroundColor: '#F7F7FA',
    borderWidth: 1,
    borderColor: '#E6E7EE',
  },
  emptyStateIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF0FF',
    marginBottom: 10,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default UserBodyModal;
