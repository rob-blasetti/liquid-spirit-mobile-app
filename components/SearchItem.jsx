import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import {colors} from '../styles/colours';

const AVATAR_COLORS = ['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C'];
const SEARCH_ITEM_MIN_HEIGHT = 80;
const SEARCH_ITEM_VERTICAL_PADDING = 12;
const SEARCH_ITEM_HORIZONTAL_PADDING = 12;

function renderVisual({
  type,
  source,
  name,
  iconName,
  kind = 'cover',
  tone = 'default',
  position,
  size = 'compact',
}) {
  if (!type) return null;

  const isStart = position === 'start';
  const isAvatarKind = kind === 'avatar';
  const isResultSize = size === 'result';
  const isBleedSize = size === 'bleed';
  const visualSlotStyle = isResultSize
    ? styles.resultVisualSlot
    : isBleedSize
    ? type === 'image' && !isAvatarKind
      ? styles.bleedCompactImageSlot
      : type === 'avatar' || isAvatarKind
      ? styles.bleedCompactAvatarSlot
      : styles.bleedCompactVisualSlot
    : styles.compactVisualSlot;
  const slotStyles = [
    styles.visualSlot,
    isStart ? styles.startVisualSlot : styles.endVisualSlot,
    visualSlotStyle,
  ];

  if (type === 'image' && source) {
    const shouldFillBleedSlot = isBleedSize && !isAvatarKind;
    return (
      <View style={slotStyles}>
        <FastImage
          source={source}
          style={[
            styles.visualImage,
            isResultSize
              ? styles.resultVisualImage
              : isBleedSize
              ? isAvatarKind
                ? styles.bleedCompactAvatarImage
                : styles.bleedCompactVisualImage
              : styles.compactVisualImage,
            isAvatarKind
              ? styles.avatarVisualImage
              : shouldFillBleedSlot
              ? styles.bleedCoverVisualImage
              : styles.coverVisualImage,
            isResultSize && !isAvatarKind && styles.resultCoverVisualImage,
          ]}
        />
      </View>
    );
  }

  if (type === 'avatar') {
    const avatarSize = isResultSize ? 60 : isBleedSize ? 80 : 44;
    return (
      <View style={slotStyles}>
        <View
          style={[
            styles.avatarVisualWrapper,
            isResultSize
              ? styles.resultAvatarVisualWrapper
              : isBleedSize
              ? styles.bleedCompactAvatarVisualWrapper
              : styles.compactAvatarVisualWrapper,
          ]}>
          <Avatar
            size={avatarSize}
            name={name || 'Search Result'}
            variant="beam"
            colors={AVATAR_COLORS}
          />
        </View>
      </View>
    );
  }

  if (type === 'icon' && iconName) {
    return (
      <View style={slotStyles}>
        <View
          style={[
            styles.iconVisualWrapper,
            tone === 'plain' && styles.plainIconVisualWrapper,
          ]}>
          <Ionicons
            name={iconName}
            size={20}
            color={themeVariables.blackColor}
          />
        </View>
      </View>
    );
  }

  return null;
}

const SearchItem = ({
  variant = 'result',
  containerRadius = 18,
  title,
  titleNumberOfLines = 1,
  secondarySubtitle,
  secondarySubtitleNumberOfLines = 1,
  secondarySubtitleBadgeText,
  subtitle,
  subtitleNumberOfLines = 2,
  date,
  time,
  metaText,
  tagText,
  extraTagTexts = [],
  statusTagText,
  communityTagText,
  rightLabelText,
  sessionStatusTagText,
  badgeText,
  badgeTagText,
  badgeTextNumberOfLines = 2,
  secondaryFooterText,
  secondaryFooterNumberOfLines = 2,
  isEvent = false,
  startVisualType,
  startImageSource,
  startVisualName,
  startIconName,
  startVisualKind = 'cover',
  startVisualTone = 'default',
  startVisualSize = 'compact',
  bleedStartVisual = false,
  endVisualType,
  endImageSource,
  endVisualName,
  endIconName,
  endVisualKind = 'cover',
  endVisualTone = 'default',
  endVisualSize = 'result',
  accessoryIconName,
  accessoryOnPress,
  accessoryHitSlop = {top: 8, bottom: 8, left: 8, right: 8},
  onPress,
  onTagPress,
}) => {
  const tagValues = [
    tagText,
    ...(Array.isArray(extraTagTexts) ? extraTagTexts : []),
  ].filter(Boolean);
  const hasFooterContent = Boolean(time || date || metaText || rightLabelText);
  const resolvedBadgeText =
    badgeText ||
    (typeof secondaryFooterText === 'string' &&
    secondaryFooterText.trim().startsWith('Matched')
      ? secondaryFooterText
      : '');
  const resolvedFooterText =
    resolvedBadgeText && secondaryFooterText === resolvedBadgeText
      ? ''
      : secondaryFooterText;
  const titleStyle = [
    styles.title,
    variant === 'recent' && styles.compactTitle,
  ];
  const supportingTextStyle = [
    styles.supportingText,
    variant === 'result'
      ? styles.resultSupportingText
      : styles.compactSupportingText,
  ];
  const subtitleStyle = [
    styles.subtitle,
    variant === 'result' ? styles.resultSubtitle : styles.compactSubtitle,
  ];
  const footerTextStyle = [
    styles.secondaryFooterText,
    variant === 'result'
      ? styles.resultFooterText
      : styles.compactFooterText,
  ];

  const handleAccessoryPress = event => {
    event.stopPropagation?.();
    if (typeof accessoryOnPress === 'function') {
      accessoryOnPress(event);
    }
  };

  const handleTagPress = value => {
    if (!value) return;
    if (typeof onTagPress === 'function') {
      onTagPress(value);
    }
  };

  return (
    <View style={[styles.containerShadow, {borderRadius: containerRadius}]}>
      <TouchableOpacity
        style={[styles.containerSurface, {borderRadius: containerRadius}]}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
        disabled={!onPress}>
        <View style={styles.divider} />
        {renderVisual({
          type: startVisualType,
          source: startImageSource,
          name: startVisualName,
          iconName: startIconName,
          kind: startVisualKind,
          tone: startVisualTone,
          position: 'start',
          size: bleedStartVisual ? 'bleed' : startVisualSize,
        })}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            {title ? (
              <Text style={titleStyle} numberOfLines={titleNumberOfLines}>
                {title}
              </Text>
            ) : null}
          </View>
          {secondarySubtitle || secondarySubtitleBadgeText ? (
            <View style={styles.supportingRow}>
              {secondarySubtitle ? (
                <Text
                  style={[supportingTextStyle, styles.supportingRowText]}
                  numberOfLines={secondarySubtitleNumberOfLines}>
                  {secondarySubtitle}
                </Text>
              ) : null}
              {secondarySubtitleBadgeText ? (
                <View style={[styles.tag, styles.communityTag, styles.inlineTag]}>
                  <Text
                    style={[styles.tagText, styles.communityTagText]}
                    numberOfLines={1}>
                    {secondarySubtitleBadgeText}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {subtitle ? (
            <View style={styles.subtitleRow}>
              <Text style={subtitleStyle} numberOfLines={subtitleNumberOfLines}>
                {subtitle}
              </Text>
            </View>
          ) : null}
          {hasFooterContent ? (
            <View style={styles.footerRow}>
              {isEvent ? (
                <>
                  {date ? (
                    <Text style={styles.dateText} numberOfLines={1}>
                      {date}
                    </Text>
                  ) : null}
                  {date && time ? <Text style={styles.delimiter}>•</Text> : null}
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
                  {time && date ? <Text style={styles.delimiter}>•</Text> : null}
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
          ) : null}
          {resolvedBadgeText || badgeTagText ? (
            <View style={styles.badgeRow}>
              {resolvedBadgeText ? (
                <View style={styles.badge}>
                  <Text
                    style={styles.badgeText}
                    numberOfLines={badgeTextNumberOfLines}>
                    {resolvedBadgeText}
                  </Text>
                </View>
              ) : null}
              {badgeTagText ? (
                <View style={[styles.tag, styles.communityTag, styles.badgeInlineTag]}>
                  <Text
                    style={[styles.tagText, styles.communityTagText]}
                    numberOfLines={1}>
                    {badgeTagText}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {resolvedFooterText ? (
            <Text
              style={footerTextStyle}
              numberOfLines={secondaryFooterNumberOfLines}>
              {resolvedFooterText}
            </Text>
          ) : null}
          {communityTagText ||
          tagValues.length > 0 ||
          sessionStatusTagText ||
          statusTagText ? (
            <View style={styles.tagsRow}>
              {communityTagText ? (
                <View style={[styles.tag, styles.communityTag]}>
                  <Text
                    style={[styles.tagText, styles.communityTagText]}
                    numberOfLines={1}>
                    {communityTagText}
                  </Text>
                </View>
              ) : null}
              {tagValues.map(value => (
                <TouchableOpacity
                  key={value}
                  style={[styles.tag, styles.typeTag]}
                  activeOpacity={0.7}
                  onPress={() => handleTagPress(value)}>
                  <Text style={styles.tagText} numberOfLines={1}>
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
              {sessionStatusTagText ? (
                <View style={[styles.tag, styles.sessionStatusTag]}>
                  <Text
                    style={[styles.tagText, styles.sessionStatusTagText]}
                    numberOfLines={1}>
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
        {accessoryIconName ? (
          <TouchableOpacity
            style={styles.accessoryButton}
            onPress={handleAccessoryPress}
            hitSlop={accessoryHitSlop}
            activeOpacity={0.6}>
            <Ionicons
              name={accessoryIconName}
              size={18}
              color={themeVariables.blackColor}
            />
          </TouchableOpacity>
        ) : null}
        {renderVisual({
          type: endVisualType,
          source: endImageSource,
          name: endVisualName,
          iconName: endIconName,
          kind: endVisualKind,
          tone: endVisualTone,
          position: 'end',
          size: endVisualSize,
        })}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  containerShadow: {
    marginVertical: 4,
    marginLeft: 12,
    marginRight: 12,
    shadowColor: '#111827',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  containerSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeVariables.whiteColor,
    minHeight: SEARCH_ITEM_MIN_HEIGHT,
    paddingVertical: SEARCH_ITEM_VERTICAL_PADDING,
    paddingLeft: SEARCH_ITEM_HORIZONTAL_PADDING,
    paddingRight: SEARCH_ITEM_HORIZONTAL_PADDING,
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#EEF1F5',
  },
  visualSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  startVisualSlot: {
    marginRight: 12,
  },
  endVisualSlot: {
    marginLeft: 12,
  },
  compactVisualSlot: {
    width: 44,
    height: 44,
  },
  bleedCompactVisualSlot: {
    width: 64,
    position: 'relative',
    alignSelf: 'stretch',
    marginLeft: -SEARCH_ITEM_HORIZONTAL_PADDING,
    marginTop: -SEARCH_ITEM_VERTICAL_PADDING,
    marginBottom: -SEARCH_ITEM_VERTICAL_PADDING,
    marginRight: SEARCH_ITEM_HORIZONTAL_PADDING,
  },
  bleedCompactAvatarSlot: {
    width: 84,
    position: 'relative',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginLeft: -SEARCH_ITEM_HORIZONTAL_PADDING,
    marginTop: -SEARCH_ITEM_VERTICAL_PADDING,
    marginBottom: -SEARCH_ITEM_VERTICAL_PADDING,
    marginRight: SEARCH_ITEM_HORIZONTAL_PADDING,
  },
  bleedCompactImageSlot: {
    aspectRatio: 1,
    position: 'relative',
    alignSelf: 'stretch',
    flexShrink: 0,
    marginLeft: -SEARCH_ITEM_HORIZONTAL_PADDING,
    marginTop: -SEARCH_ITEM_VERTICAL_PADDING,
    marginBottom: -SEARCH_ITEM_VERTICAL_PADDING,
    marginRight: SEARCH_ITEM_HORIZONTAL_PADDING,
  },
  resultVisualSlot: {
    width: 60,
    height: 60,
  },
  visualImage: {
    backgroundColor: themeVariables.lightGreyColor,
  },
  compactVisualImage: {
    width: 44,
    height: 44,
  },
  bleedCompactVisualImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bleedCompactAvatarImage: {
    width: 80,
    height: 80,
  },
  bleedCoverVisualImage: {
    borderRadius: 0,
  },
  resultVisualImage: {
    width: 60,
    height: 60,
  },
  avatarVisualImage: {
    borderRadius: 999,
  },
  coverVisualImage: {
    borderRadius: 10,
  },
  resultCoverVisualImage: {
    borderRadius: 8,
  },
  avatarVisualWrapper: {
    overflow: 'hidden',
  },
  compactAvatarVisualWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  bleedCompactAvatarVisualWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  resultAvatarVisualWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  iconVisualWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeVariables.lightGreyColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plainIconVisualWrapper: {
    backgroundColor: 'transparent',
  },
  accessoryButton: {
    marginLeft: 12,
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
  compactTitle: {
    marginRight: 0,
  },
  supportingText: {
    color: '#4B5563',
  },
  resultSupportingText: {
    fontSize: 13,
    marginTop: 6,
    color: '#555',
  },
  compactSupportingText: {
    fontSize: 12,
    marginTop: 4,
  },
  supportingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    marginTop: 6,
  },
  supportingRowText: {
    flexShrink: 1,
    marginTop: 0,
  },
  subtitle: {
    flexShrink: 1,
  },
  resultSubtitle: {
    fontSize: 14,
    color: themeVariables.blackColor,
  },
  compactSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: '#555',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  timeText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
    marginBottom: 2,
  },
  delimiter: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
    marginBottom: 2,
  },
  rightLabelText: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
    marginBottom: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  badgeText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  secondaryFooterText: {
    fontSize: 12,
    color: '#555',
  },
  resultFooterText: {
    marginTop: 4,
    lineHeight: 17,
  },
  compactFooterText: {
    marginTop: 4,
    lineHeight: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
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
  inlineTag: {
    marginTop: 0,
    marginRight: 0,
  },
  badgeInlineTag: {
    marginTop: 0,
    marginLeft: 8,
    marginRight: 0,
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
