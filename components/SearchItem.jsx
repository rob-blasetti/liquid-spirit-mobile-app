import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import themeVariables from '../styles/theme';
import { colors } from '../styles/colours';

const SearchItem = ({
  imageSource,
  leadingComponent,
  title,
  subtitle,
  secondarySubtitle,
  date,
  time,
  metaText,
  tagText,
  statusTagText,
  communityTagText,
  rightLabelText,
  sessionStatusTagText,
  secondaryFooterText,
  isEvent = false,
  onPress,
  onTagPress,
}) => {
  const hasLeading = Boolean(imageSource) || Boolean(leadingComponent);
  const handleTagPress = (value) => {
    if (!value) return;
    if (typeof onTagPress === 'function') {
      onTagPress(value);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.divider} />
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
        {secondarySubtitle ? (
          <Text style={styles.secondarySubtitle} numberOfLines={1}>
            {secondarySubtitle}
          </Text>
        ) : null}
        {subtitle ? (
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        ) : null}
        <View style={styles.footerRow}>
          {isEvent ? (
            <>
              {date ? (
                <Text style={styles.dateText} numberOfLines={1}>
                  {date}
                </Text>
              ) : null}
              {date && time ? (
                <Text style={styles.delimiter}>•</Text>
              ) : null}
              {time ? (
                <Text style={styles.timeText} numberOfLines={1}>
                  {time}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              {time ? (
                <Text style={styles.timeText} numberOfLines={1}>
                  {time}
                </Text>
              ) : null}
              {time && date ? (
                <Text style={styles.delimiter}>•</Text>
              ) : null}
              {date ? (
                <Text style={styles.dateText} numberOfLines={1}>
                  {date}
                </Text>
              ) : null}
            </>
          )}
          {(time || date) && metaText ? (
            <Text style={styles.delimiter}>•</Text>
          ) : null}
          {metaText ? (
            <Text style={styles.metaText} numberOfLines={1}>
              {metaText}
            </Text>
          ) : null}
          {(time || date || metaText) && rightLabelText ? (
            <Text style={styles.delimiter}>•</Text>
          ) : null}
          {rightLabelText ? (
            <Text style={styles.rightLabelText} numberOfLines={1}>
              {rightLabelText}
            </Text>
          ) : null}
        </View>
        {secondaryFooterText ? (
          <Text style={styles.secondaryFooterText} numberOfLines={1}>
            {secondaryFooterText}
          </Text>
        ) : null}
        {(communityTagText || tagText || sessionStatusTagText || statusTagText) ? (
          <View style={styles.tagsRow}>
            {communityTagText ? (
              <View style={[styles.tag, styles.communityTag]}>
                <Text style={[styles.tagText, styles.communityTagText]} numberOfLines={1}>
                  {communityTagText}
                </Text>
              </View>
            ) : null}
            {tagText ? (
              <TouchableOpacity
                style={[styles.tag, styles.typeTag]}
                activeOpacity={0.7}
                onPress={() => handleTagPress(tagText)}
              >
                <Text style={styles.tagText} numberOfLines={1}>
                  {tagText}
                </Text>
              </TouchableOpacity>
            ) : null}
            {sessionStatusTagText ? (
              <View style={[styles.tag, styles.sessionStatusTag]}>
                <Text style={[styles.tagText, styles.sessionStatusTagText]} numberOfLines={1}>
                  {sessionStatusTagText}
                </Text>
              </View>
            ) : null}
            {statusTagText ? (
              <View style={[styles.tag, styles.statusTag]}>
                <Text style={styles.tagText} numberOfLines={1}>
                  {statusTagText}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {hasLeading ? (
        <View style={styles.trailingContainer}>
          {leadingComponent ? (
            <View style={styles.customLeadingWrapper}>{leadingComponent}</View>
          ) : (
            <FastImage source={imageSource} style={styles.image} />
          )}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 12,
    marginLeft: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  divider: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: StyleSheet.hairlineWidth,
    backgroundColor: themeVariables.blackColor,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  trailingContainer: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  customLeadingWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginRight: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: themeVariables.secondaryLightColor,
    marginLeft: 6,
  },
  communityTag: {
    backgroundColor: themeVariables.primaryColor,
    marginLeft: 0,
    marginRight: 6,
  },
  statusTag: {
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: themeVariables.blackColor,
    marginLeft: 6,
  },
  tagText: {
    fontSize: 12,
    color: themeVariables.blackColor,
    fontWeight: '500',
  },
  communityTagText: {
    color: themeVariables.whiteColor,
  },
  subtitle: {
    fontSize: 14,
    color: themeVariables.blackColor,
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  secondarySubtitle: {
    fontSize: 13,
    color: '#555',
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  delimiter: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  rightLabelText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  secondaryFooterText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  sessionStatusTag: {
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    marginLeft: 6,
  },
  sessionStatusTagText: {
    color: themeVariables.primaryColor,
  },
  typeTag: {
    marginLeft: 6,
  },
});

export default SearchItem;
