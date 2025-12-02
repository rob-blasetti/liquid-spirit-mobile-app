import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import resolveImageSource from '../../../../utils/imageSource';
import themeVariables from '../../../../styles/theme';

const AuthorSection = ({ authorName, authorCommunity, profilePic, actions }) => (
  <View style={styles.authorRow}>
    {profilePic ? (
      <FastImage source={resolveImageSource(profilePic, { priority: 'normal' })} style={styles.avatar} />
    ) : (
      <Avatar
        size={40}
        name={authorName}
        variant="beam"
        colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
        style={styles.avatar}
      />
    )}
    <View style={styles.authorInfoContainer}>
      <Text style={styles.authorName}>{authorName}</Text>
      {authorCommunity ? (
        <View style={styles.communityChip}>
          <Text style={styles.communityChipText}>{authorCommunity}</Text>
        </View>
      ) : null}
    </View>
    {actions ? <View style={styles.actionsContainer}>{actions}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    marginTop: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeVariables.greyColor,
  },
  authorInfoContainer: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: { fontSize: 14, fontWeight: '600', color: themeVariables.blackColor, marginLeft: 2 },
  communityChip: {
    alignSelf: 'flex-start',
    backgroundColor: themeVariables.primaryColor,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  communityChipText: { color: '#fff', fontSize: 12 },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    flexShrink: 0,
  },
});

export default AuthorSection;
