import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';
import localImages from '../utils/localImages';
import FastImage from 'react-native-fast-image';
import Avatar from '@flipxyz/react-native-boring-avatars';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faXmarkCircle, faClock, faSprout } from '@fortawesome/free-solid-svg-icons';

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

/**
 * Returns an image source for activities, events, or member avatars.
 */
const SearchCard = ({ item, onPress }) => {
  console.log('Rendering SearchCard for item:', item);
  // Top section: image (event/activity) or avatar (member/user)
  const renderImageSection = () => {
    if (item.type === 'event') {
      const source = item.imageUrl && localImages[item.imageUrl]
        ? localImages[item.imageUrl]
        : item.imageUrl
          ? { uri: item.imageUrl }
          : require('../assets/img/placeholder.png');
      return (
        <View style={styles.imageContainer}>
          <FastImage source={source} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
          <View style={styles.overlayChipContainer}>{renderChipsOverlay()}</View>
        </View>
      );
    }
    if (item.type === 'activity' || item.type === 'session') {
      const source = item.imageUrl
        ? { uri: item.imageUrl }
        : require('../assets/img/placeholder.png');
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
            <FastImage source={{ uri: item.profilePicture }} style={StyleSheet.absoluteFill} resizeMode={FastImage.resizeMode.cover} />
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
    return null;
  };

  const renderChipsOverlay = () => {
    switch (item.type) {
      case 'activity':
        // Community chip and status chip; status chip shows red background if expired
        return (
          <>
            <View style={[styles.chip, styles.communityChip]}>
              <FontAwesomeIcon
                icon={faSprout}
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
              <FontAwesomeIcon
                icon={faSprout}
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
                    <FontAwesomeIcon
                      icon={isError ? faXmarkCircle : faClock}
                      size={12}
                      color={themeVariables.whiteColor}
                      style={styles.chipIcon}
                    />
                    <Text style={styles.chipText}>
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
            <FontAwesomeIcon icon={faSprout} size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
            <Text style={styles.chipText}>{safeText(item.community)}</Text>
          </View>
        );
      case 'member':
      case 'user':
        return (
          <View style={[styles.chip, styles.communityChip]}>
            <FontAwesomeIcon icon={faSprout} size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
            <Text style={styles.chipText}>{safeText(item.community)}</Text>
          </View>
        );
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
    'July','August','September','October','November','December'
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
    // fixed width for two-column layout
    width: '48%',
    margin: 6,
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
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
  // Text color for default status chip (white for contrast)
  statusChipText: {
    color: themeVariables.whiteColor,
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
  content: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
});

export default SearchCard;