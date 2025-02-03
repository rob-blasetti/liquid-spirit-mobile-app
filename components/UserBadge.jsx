import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Tooltip } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const BadgeIcon = ({ iconName, label, style }) => (
  <Tooltip popover={<Text style={styles.tooltipText}>{label}</Text>}>
    <View style={[styles.badge, style]}>
      <Icon name={iconName} size={16} color="#fff" />
    </View>
  </Tooltip>
);

const UserBadge = ({ user, userCertifications, type = 'user' }) => {
  if (!user || typeof user !== 'object') {
    console.error('Invalid user data provided to UserBadge component');
    return <View style={[styles.container, styles.errorContainer]}><Text>Error</Text></View>;
  }

  let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  let avatarUri = user.profilePicture || null;
  let certifications = [];

  if (type === 'user') {
    if (userCertifications?.isVerified) {
      certifications.push({ iconName: 'check-decagram', label: 'Verified User', style: styles.verifiedBadge });
    }
    if (userCertifications?.hasChildProtection) {
      certifications.push({ iconName: 'shield-check', label: 'Child Protection Certified', style: styles.protectionBadge });
    }
    if (userCertifications?.isLocalAssemblyMember) {
      certifications.push({ iconName: 'star', label: 'LSA Member', style: styles.lsaBadge });
    }
  }

  return (
    <View style={styles.container}>
      {/* Avatar Section */}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatarContainer, !avatarUri && styles.defaultAvatar]}>
          {avatarUri ? (
            <FastImage source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <Icon name="account" size={30} color="#aaa" /> // Default User Icon
          )}
        </View>

        {/* Name */}
        <Text style={styles.name}>{displayName || 'Unknown User'}</Text>
      </View>

      {/* Certifications */}
      <View style={styles.certificationsWrapper}>
        {certifications.length > 0 && (
          <View style={styles.certifications}>
            {certifications.map((cert, index) => (
              <BadgeIcon key={index} iconName={cert.iconName} label={cert.label} style={cert.style} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    marginHorizontal: 5,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  avatarContainer: {
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#ddd', // ✅ Grey background when no profile image
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#312783',
    textAlign: 'center',
    maxWidth: 80,
    marginTop: 4,
  },
  certificationsWrapper: {
    height: 24, // ✅ Fixed height to maintain equal badge sizes
    justifyContent: 'center',
    alignItems: 'center',
  },
  certifications: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
  },
  protectionBadge: {
    backgroundColor: '#FF9800',
  },
  lsaBadge: {
    backgroundColor: '#673AB7',
  },
  tooltipText: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#333',
    padding: 5,
    borderRadius: 5,
  },
});

export default UserBadge;
