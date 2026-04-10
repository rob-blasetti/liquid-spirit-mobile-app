import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import resolveImageSource from '../utils/imageSource';
import UserBadgeCellSkeleton from './UserBadgeCellSkeleton';

const truncateText = (text, maxLength) =>
  text?.length > maxLength
    ? `${text?.substring(0, maxLength - 3)}...`
    : text;

const getCertificationBadges = certifications => {
  if (!certifications || typeof certifications !== 'object') {
    return [];
  }

  return [
    certifications?.isVerified
      ? {
          key: 'verified',
          icon: 'checkmark',
          backgroundColor: '#3E8E41',
        }
      : null,
    certifications?.hasChildProtection
      ? {
          key: 'child-protection',
          icon: 'shield-checkmark',
          backgroundColor: '#D81B60',
        }
      : null,
    certifications?.isLocalAssemblyMember
      ? {
          key: 'lsa-member',
          icon: 'star',
          backgroundColor: '#B71C1C',
        }
      : null,
  ].filter(Boolean);
};

const getDisplayTypeLabel = (type, memberStatus) => {
  const normalizedStatus = String(memberStatus || '')
    .trim()
    .toLowerCase();
  const normalizedType = String(type || '')
    .trim()
    .toLowerCase();

  if (
    normalizedStatus === 'bahai child' ||
    normalizedStatus === "baha'i child" ||
    normalizedType === 'bahai child' ||
    normalizedType === "baha'i child" ||
    normalizedStatus.includes('child')
  ) {
    return "Baha'i Child";
  }

  if (
    normalizedType === 'member' &&
    normalizedStatus.length > 0 &&
    normalizedStatus !== 'in good standing'
  ) {
    return memberStatus;
  }

  return type;
};

const resolveMemberStatus = ({memberStatus, user}) =>
  [
    memberStatus,
    user?.status,
    user?.memberStatus,
    user?.member_status,
    user?.membershipStatus,
    user?.refId?.status,
    user?.refId?.memberStatus,
    user?.refID?.status,
    user?.refID?.memberStatus,
    user?.user?.status,
    user?.user?.memberStatus,
    user?.profile?.status,
    user?.profile?.memberStatus,
    user?.details?.status,
    user?.details?.memberStatus,
  ].find(value => typeof value === 'string' && value.trim().length > 0) || '';

const UserBadgeCell = ({
  user,
  type,
  contained = false,
  userCertifications,
  memberStatus,
  hideRole = false,
  containerStyle,
  loading = false,
}) => {
  const navigation = useNavigation();

  if (loading) {
    return (
      <UserBadgeCellSkeleton
        contained={contained}
        containerStyle={containerStyle}
      />
    );
  }
  const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name;
  const resolvedMemberStatus = resolveMemberStatus({memberStatus, user});
  const displayTypeLabel = getDisplayTypeLabel(type, resolvedMemberStatus);
  const certificationBadges = getCertificationBadges(
    userCertifications || user?.certifications,
  );

  const navigateToProfile = () => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    navigation.navigate('PublicUserProfile', {userId});
  };

  return (
    <TouchableOpacity
      style={[
        styles.userItem,
        contained ? styles.userItemContained : null,
        containerStyle,
      ]}
      onPress={navigateToProfile}
      activeOpacity={0.7}>
      {user?.profilePicture ? (
        <FastImage
          source={resolveImageSource(user.profilePicture, {priority: 'normal'})}
          style={styles.smallAvatar}
        />
      ) : (
        <Avatar
          size={styles.smallAvatar.width}
          name={name}
          variant="beam"
          colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
          style={styles.smallAvatar}
        />
      )}
      <View style={styles.userInfo}>
        <Text style={styles.avatarName} numberOfLines={1}>
          {truncateText(name, 18)}
        </Text>
        {!hideRole && displayTypeLabel ? (
          <Text style={styles.avatarType} numberOfLines={1}>
            {displayTypeLabel}
          </Text>
        ) : null}
        <View style={styles.certificationRow}>
          {certificationBadges.map(badge => (
            <View
              key={badge.key}
              style={[
                styles.certificationBadge,
                {backgroundColor: badge.backgroundColor},
              ]}>
              <Ionicons name={badge.icon} size={10} color="#fff" />
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 12,
    marginBottom: 10,
  },
  userItemContained: {
    alignSelf: 'stretch',
    width: '100%',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F6F7FB',
    borderWidth: 1,
    borderColor: '#E8EBF0',
    marginRight: 0,
  },
  userInfo: {
    marginLeft: 6,
    flexDirection: 'column',
    justifyContent: 'center',
    flexShrink: 1,
    minWidth: 0,
  },
  smallAvatar: {
    width: 42,
    height: 42,
    borderRadius: 28,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    lineHeight: 14,
    minHeight: 14,
  },
  avatarType: {
    fontSize: 12,
    color: '#999',
    lineHeight: 14,
    minHeight: 14,
  },
  certificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    minHeight: 16,
  },
  certificationBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
});

export default UserBadgeCell;
