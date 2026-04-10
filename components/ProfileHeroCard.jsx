import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';

import themeVariables from '../styles/theme';
import resolveImageSource from '../utils/imageSource';

const PROFILE_STAT_CARDS = [
  {key: 'activities', label: 'Current Activities'},
  {key: 'events', label: 'Upcoming Events'},
  {key: 'posts', label: 'Total Posts'},
];

const ProfileHeroCard = ({
  name,
  joinedLabel,
  stats,
  renderAvatar,
  profilePicture,
  avatarName,
  avatarSize = 68,
  containerStyle,
}) => {
  const avatar =
    typeof renderAvatar === 'function' ? (
      renderAvatar({
        imageStyle: styles.profilePictureLarge,
        avatarSize,
        containerStyle: styles.profileAvatarWrap,
      })
    ) : profilePicture ? (
      <FastImage
        style={styles.profilePictureLarge}
        source={resolveImageSource(profilePicture, {priority: 'high'})}
        resizeMode={FastImage.resizeMode.cover}
      />
    ) : (
      <Avatar
        size={avatarSize}
        name={avatarName || name}
        variant="beam"
        colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
        style={styles.profilePictureLarge}
      />
    );

  return (
    <View style={[styles.profileHeroCard, containerStyle]}>
      <View style={styles.profileHeroColumns}>
        <View style={styles.profileIdentityColumn}>
          {avatar}
          <Text style={styles.nameCentered} numberOfLines={2}>
            {name}
          </Text>
          {joinedLabel ? (
            <Text style={styles.memberSinceCentered} numberOfLines={2}>
              {joinedLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.profileStatsColumn}>
          {PROFILE_STAT_CARDS.map((card, index) => (
            <View
              key={card.key}
              style={[
                styles.statRowCard,
                index < PROFILE_STAT_CARDS.length - 1 ? styles.statRowDivider : null,
              ]}>
              <Text style={styles.statRowLabel} numberOfLines={1}>
                {card.label}
              </Text>
              <Text style={styles.statRowValue} numberOfLines={1}>
                {stats?.[card.key] ?? 0}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileHeroCard: {
    width: '100%',
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EBF5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeroColumns: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    minHeight: 118,
  },
  profileIdentityColumn: {
    width: '42%',
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingVertical: 2,
  },
  profileStatsColumn: {
    flex: 1,
    minHeight: 112,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  profileAvatarWrap: {
    alignSelf: 'center',
  },
  profilePictureLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 4,
  },
  nameCentered: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: '100%',
  },
  memberSinceCentered: {
    marginTop: 2,
    fontSize: 11,
    color: '#6C7690',
    textAlign: 'center',
  },
  statRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 18,
    paddingVertical: 0,
    paddingHorizontal: 8,
    flex: 0.88,
  },
  statRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAF1',
    marginBottom: 0,
    paddingBottom: 0,
  },
  statRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: themeVariables.blackColor,
    textAlign: 'left',
    flex: 1,
    marginRight: 12,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'right',
    minWidth: 24,
  },
});

export default ProfileHeroCard;
