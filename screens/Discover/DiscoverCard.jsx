import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';

import themeVariables from '../../styles/theme';

const DiscoverCard = ({
  title,
  imageSource,
  typeLabel,
  locationLabel,
  timeLabel,
  onPress,
  style,
  testID,
}) => (
  <TouchableOpacity
    style={[styles.card, style]}
    onPress={onPress}
    activeOpacity={0.9}
    testID={testID}
  >
    <View style={styles.imageWrapper}>
      <FastImage source={imageSource} style={styles.image} resizeMode={FastImage.resizeMode.cover} />
      {typeLabel ? (
        <View style={styles.typeChip}>
          <Text style={styles.typeChipText} numberOfLines={1}>
            {typeLabel}
          </Text>
        </View>
      ) : null}
    </View>
    <View style={styles.content}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.divider} />
      <View style={[styles.metaRow, styles.locationRow]}>
        <Ionicons name="location-outline" size={13} color={themeVariables.blackColor} style={styles.metaIcon} />
        <Text style={styles.meta} numberOfLines={1}>
          {locationLabel}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Ionicons name="time-outline" size={12} color={themeVariables.blackColor} style={styles.metaIcon} />
        <Text style={styles.meta} numberOfLines={1}>
          {timeLabel}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default DiscoverCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginRight: 0,
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
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
