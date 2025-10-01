import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import resolveImageSource from '../utils/imageSource';

/**
 * Card component to display a search result of type activity, event, or member.
 * Expects item.type to be one of: 'activity', 'event', 'member'.
 */
/**
 * Safely convert a value to displayable text.
 * If object has a 'name' property, use it. Otherwise JSON.stringify.
 */
function safeText(val) {
  if (val == null) return '';
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (typeof val === 'object' && 'name' in val) return val.name;
  return JSON.stringify(val);
}

function isVideoUrl(url = '') {
  if (typeof url !== 'string') return false;
  return /\.(mp4|mov|m4v|3gp|avi)$/i.test(url) || url.includes('/video');
}

function truncateText(text, limit) {
  if (!text) return '';
  const str = String(text);
  if (str.length <= limit) return str;
  return `${str.slice(0, limit).trimEnd()}...`;
}

/**
 * Returns an image source for activities, events, or member avatars.
 */
const SearchCard = ({ item, onPress }) => {
  const placeholder = require('../assets/img/placeholder.png');
  // Top section: image (event/activity) or avatar (member/user)
  const renderImageSection = () => {
    if (item.type === 'event') {
      const source = resolveImageSource(item.imageUrl, {
        priority: 'high',
        fallback: placeholder,
      });
      return (
        <View style={styles.imageContainer}>
          <FastImage source={source} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
          <View style={styles.overlayChipContainer}>{renderChipsOverlay()}</View>
        </View>
      );
    }
    if (item.type === 'activity' || item.type === 'session') {
      const source = resolveImageSource(item.imageUrl, {
        priority: 'high',
        fallback: placeholder,
      });
      return (
        <View style={styles.imageContainer}>
          <FastImage source={source} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
          <View style={styles.overlayChipContainer}>{renderChipsOverlay()}</View>
        </View>
      );
    }
    if (item.type === 'member' || item.type === 'user') {
      const hasPic = Boolean(item.profilePicture);
      return (
        <View style={styles.imageContainer}>
          {hasPic ? (
            <FastImage
              source={resolveImageSource(item.profilePicture, { priority: 'normal', fallback: placeholder })}
              style={StyleSheet.absoluteFill}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <Avatar
              size={120}
              name={`${item.firstName || ''} ${item.lastName || ''}`.trim()}
              variant="beam"
              colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={styles.overlayChipContainer}>{renderChipsOverlay()}</View>
        </View>
      );
    }
    if (item.type === 'post') {
      const thumbnail = Array.isArray(item.mediaThumbnails) && item.mediaThumbnails.length > 0
        ? item.mediaThumbnails[0]
        : null;
      const media = Array.isArray(item.media) && item.media.length > 0 ? item.media[0] : null;
      const previewUri = thumbnail || media;
      const source = resolveImageSource(previewUri, {
        priority: 'normal',
        fallback: placeholder,
      });
      const videoBadgeVisible = isVideoUrl(media);
      return (
        <View style={styles.imageContainer}>
          <FastImage
            source={source}
            style={StyleSheet.absoluteFill}
            resizeMode={FastImage.resizeMode.cover}
          />
          {videoBadgeVisible && (
            <View style={styles.videoBadge}>
              <Ionicons name="play" size={16} color={themeVariables.whiteColor} />
            </View>
          )}
          <View style={styles.overlayChipContainer}>{renderChipsOverlay()}</View>
        </View>
      );
    }
    return null;
  };

  const renderChipsOverlay = () => {
    switch (item.type) {
      case 'activity':
        // Community chip and status chip; status chip shows red background if expired
        return (
          <>
            <View style={[styles.chip, styles.communityChip]}>
              <Ionicons
                name="leaf-outline"
                size={12}
                color={themeVariables.whiteColor}
                style={styles.chipIcon}
              />
              <Text style={styles.chipText}>{safeText(item.community)}</Text>
            </View>
          </>
        );
      case 'session':
        // Community chip and status chip; status chip shows red background if expired
        return (
          <>
            <View style={[styles.chip, styles.communityChip]}>
              <Ionicons
                name="leaf-outline"
                size={12}
                color={themeVariables.whiteColor}
                style={styles.chipIcon}
              />
              <Text style={styles.chipText}>{safeText(item.community)}</Text>
            </View>
            {
              // Determine if status is expired (case-insensitive)
              (() => {
                const status = (item.status || '').toString().toLowerCase();
                const isError = status === 'expired' || status === 'cancelled';
                return (
                  <View style={[
                      styles.chip,
                      isError ? styles.expiredStatusChip : styles.statusChip,
                  ]}>
                    <Ionicons
                      name={isError ? 'close-circle' : 'time-outline'}
                      size={12}
                      color={themeVariables.blackColor}
                      style={styles.chipIcon}
                    />
                    <Text
                      // Status chip text in black
                      style={[styles.chipText, styles.statusChipText]}
                    >
                      {safeText(item.status)}
                    </Text>
                  </View>
                );
              })()
            }
          </>
        );
      case 'event':
        return (
          <View style={[styles.chip, styles.communityChip]}>
            <Ionicons name="leaf-outline" size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
            <Text style={styles.chipText}>{safeText(item.community)}</Text>
          </View>
        );
      case 'member':
      case 'user':
        return (
          <View style={[styles.chip, styles.communityChip]}>
            <Ionicons name="leaf-outline" size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
            <Text style={styles.chipText}>{safeText(item.community)}</Text>
          </View>
        );
      case 'post': {
        const communityText = safeText(item.community);
        if (!communityText) return null;
        return (
          <View style={[styles.chip, styles.communityChip]}>
            <Ionicons name="leaf-outline" size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
            <Text style={styles.chipText}>{communityText}</Text>
          </View>
        );
      }
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case 'activity':
      case 'session':
        return (
          <>
            <Text style={styles.title}>{safeText(item.title)}</Text>
            <Text style={styles.field}>{safeText(item.activityType)}</Text>
            <Text style={styles.field}>{formatDate(item.date)}</Text>
          </>
        );
      case 'event':
        return (
          <>
            <Text style={styles.title}>{safeText(item.title)}</Text>
            <Text style={styles.field}>{safeText(item.eventType)}</Text>
            <Text style={styles.field}>{formatDate(item.date)}</Text>
          </>
        );
      case 'member':
      case 'user':
        return (
          <>
            <Text style={styles.title}>{safeText(item.firstName)} {safeText(item.lastName)}</Text>
            <Text style={styles.field}>Baha'i ID: {safeText(item.bahaiId)}</Text>
          </>
        );
      case 'post': {
        const rawContent = safeText(item.content || item.title);
        const content = truncateText(rawContent, 25) || 'View post details';
        const authorName = [safeText(item.author?.firstName), safeText(item.author?.lastName)]
          .filter(Boolean)
          .join(' ');
        return (
          <>
            <Text style={styles.postContent}>{content}</Text>
            {authorName ? <Text style={styles.postMetaText}>By {authorName}</Text> : null}
            {item.createdAt ? (
              <Text style={styles.postMetaText}>{formatDate(item.createdAt)}</Text>
            ) : null}
          </>
        );
      }
      default:
        return <Text style={styles.field}>{JSON.stringify(item)}</Text>;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={() => onPress && onPress(item)}
    >
      {renderImageSection()}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </TouchableOpacity>
  );
};

function formatDate(dateString) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = d.getDate();
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const j = day % 10, k = day % 100;
  let suffix = 'th';
  if (j === 1 && k !== 11) suffix = 'st';
  else if (j === 2 && k !== 12) suffix = 'nd';
  else if (j === 3 && k !== 13) suffix = 'rd';
  return `${day}${suffix} ${month} ${year}`;
}

const styles = StyleSheet.create({
  card: {
    width: '46%',
    margin: 8,
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'visible',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: themeVariables.primaryColor,
  },
  field: {
    fontSize: 14,
    color: themeVariables.blackColor,
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
    flexShrink: 1,
  },
  communityChip: {
    backgroundColor: themeVariables.primaryColor,
  },
  // Default status chip: light secondary background, dark secondary text and border
  statusChip: {
    backgroundColor: themeVariables.secondaryLightColor,
  },
  // Text color for status chip labels
  statusChipText: {
    color: themeVariables.blackColor,
  },
  // Expired status chip: red background and border
  expiredStatusChip: {
    backgroundColor: themeVariables.redColor,
    borderWidth: 1,
    borderColor: themeVariables.redColor,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    color: themeVariables.whiteColor,
    flexShrink: 1,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  overlayChipContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 12,
    padding: 4,
  },
  content: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  postContent: {
    fontSize: 15,
    fontWeight: '500',
    color: themeVariables.blackColor,
    marginBottom: 6,
    lineHeight: 20,
  },
  postMetaText: {
    fontSize: 12,
    color: themeVariables.blackColor,
    marginBottom: 4,
  },
});

export default SearchCard;
