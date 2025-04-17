import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { Tooltip } from 'react-native-elements';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck, faShieldAlt, faStar } from '@fortawesome/free-solid-svg-icons';
import Avatar from '@flipxyz/react-native-boring-avatars';

const BadgeIcon = ({ iconName, label, style }) => (
  <Tooltip popover={<Text style={styles.tooltipText}>{label}</Text>}>
    <View style={[styles.badge, style]}>
      <FontAwesomeIcon icon={iconName} size={16} color="#fff" />
    </View>
  </Tooltip>
);

const UserBadge = ({ user, userCertifications, type = 'user' }) => {
  console.log(user);
  if (!user || typeof user !== 'object') {
    console.error('Invalid user data provided to UserBadge component');
    return <View style={[styles.container, styles.errorContainer]}><Text>Error</Text></View>;
  }

  let displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  let avatarUri = user.profilePicture || null;
  let certifications = [];

  if (type === 'user') {
    if (userCertifications?.isVerified) {
      certifications.push({ iconName: faCheck, label: 'Verified User', style: styles.verifiedBadge });
    }
    if (userCertifications?.hasChildProtection) {
      certifications.push({ iconName: faShieldAlt, label: 'Child Prot Cert.', style: styles.protectionBadge });
    }
    if (userCertifications?.isLocalAssemblyMember) {
      certifications.push({ iconName: faStar, label: 'LSA Member', style: styles.lsaBadge });
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
            <Avatar
              size={55}
              name={displayName}
              variant="beam"
              colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
            />
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
    backgroundColor: '#ddd', // Grey background when no profile image
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
    height: 24, // Fixed height to maintain equal badge sizes
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
    backgroundColor: '#3e8e41',
  },
  protectionBadge: {
    backgroundColor: '#d81b60',
  },
  lsaBadge: {
    backgroundColor: '#b71c1c',
  },
  tooltipText: {
    fontSize: 14,
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 200,
    flexWrap: 'wrap',
    textAlign: 'left',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default UserBadge;
