import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {CommunityContext, UserContext} from '../contexts';
import BaseModal from '../components/BaseModal';
import UserBadgeCell from '../components/UserBadgeCell';

const HORIZONTAL_PADDING = 6;

const normalizeAssemblyMember = member => ({
  id: member?.id || member?._id,
  firstName: member?.firstName || '',
  lastName: member?.lastName || '',
  bahaiId: member?.bahaiId ?? null,
  type: member?.type || 'Member',
  profilePicture: member?.profilePicture || null,
  certifications: member?.certifications || {
    isLocalAssemblyMember: Boolean(member?.isLocalAssemblyMember),
    isVerified: Boolean(member?.isVerified),
    hasChildProtection: Boolean(member?.hasChildProtection),
  },
});

// LocalAssemblyModal now consumes assembly member data from CommunityContext
const LocalAssemblyModal = ({ visible, onClose }) => {
  const {homeOverview} = useContext(CommunityContext);
  const {user} = useContext(UserContext);
  const members = homeOverview?.localSpiritualAssembly || [];
  const communityName =
    user?.community?.name?.trim?.() || homeOverview?.community?.name?.trim?.();

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="Your Local Spiritual Assembly"
      headerContent={
        communityName ? (
          <View style={styles.communityChip}>
            <Ionicons
              name="leaf-outline"
              size={12}
              style={styles.communityChipIcon}
            />
            <Text style={styles.communityChipText} numberOfLines={1}>
              {communityName}
            </Text>
          </View>
        ) : null
      }
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.grid}>
        {members.map((member, index) => {
          const normalizedMember = normalizeAssemblyMember(member);

          return (
            <UserBadgeCell
              key={
                normalizedMember.id ||
                `${normalizedMember.firstName}-${normalizedMember.lastName}-${index}`
              }
              user={normalizedMember}
              type={normalizedMember.type}
              userCertifications={normalizedMember.certifications}
              contained
              containerStyle={styles.memberBadge}
            />
          );
        })}
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 20,
  },
  communityChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF7F0',
    borderWidth: 1,
    borderColor: '#D6EBD9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    maxWidth: '100%',
  },
  communityChipIcon: {
    color: '#2F7A46',
    marginRight: 6,
  },
  communityChipText: {
    color: '#2F7A46',
    fontSize: 12,
    fontWeight: '600',
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
});

export default LocalAssemblyModal;
