import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';

import themeVariables from '../../styles/theme';
import { useTheme } from '../../contexts/ThemeContext';

const DiscoverCard = ({
  title,
  imageSource,
  typeLabel,
  locationLabel,
  timeLabel,
  onPress,
  style,
  testID,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <View style={[styles.cardShadow, isDarkMode && styles.cardShadowDark, style]}>
      <TouchableOpacity
        style={[styles.card, isDarkMode && styles.cardDark]}
        onPress={onPress}
        activeOpacity={0.9}
        testID={testID}
      >
        <View style={styles.imageWrapper}>
          <FastImage
            source={imageSource}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
          />
          {typeLabel ? (
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText} numberOfLines={1}>
                {typeLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <View style={styles.divider} />
          <View style={[styles.metaRow, styles.locationRow]}>
            <Ionicons
              name="location-outline"
              size={13}
              color={themeVariables.blackColor}
              style={styles.metaIcon}
            />
            <Text style={styles.meta} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={12}
              color={themeVariables.blackColor}
              style={styles.metaIcon}
            />
            <Text style={styles.meta} numberOfLines={1}>
              {timeLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default DiscoverCard;

const styles = StyleSheet.create({
  cardShadow: {
    width: '100%',
    marginRight: 0,
    padding: 2,
    marginVertical: 1,
    shadowColor: 'rgba(12, 18, 28, 0.22)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'visible',
  },
  cardShadowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 14,
  },
  card: {
    width: '100%',
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardDark: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  imageWrapper: {
    padding: 4,
    backgroundColor: themeVariables.whiteColor,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 12,
  },
  typeChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: themeVariables.secondaryColor,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: themeVariables.blackColor,
  },
  content: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  divider: {
    height: 1,
    backgroundColor: themeVariables.darkGreyColor,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationRow: {
    marginBottom: 4,
    paddingRight: 6,
  },
  metaIcon: {
    marginRight: 6,
  },
  meta: {
    fontSize: 12,
    color: themeVariables.blackColor,
    marginTop: 0,
    marginRight: 8,
  },
});
