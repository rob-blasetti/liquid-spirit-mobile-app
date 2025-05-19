import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUsers, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

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

const SearchCard = ({ item, onPress }) => {
  const renderContent = () => {
    switch (item.type) {
      case 'activity':
        return (
          <>
            <Text style={styles.title}>{safeText(item.title)}</Text>
            <Text style={styles.field}>{safeText(item.activityType)}</Text>
            <Text style={styles.field}>{formatDate(item.date)}</Text>
            <View style={styles.chipContainer}>
              <View style={[styles.chip, styles.communityChip]}>
                <FontAwesomeIcon icon={faUsers} size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
                <Text style={styles.chipText}>{safeText(item.community)}</Text>
              </View>
              <View style={[styles.chip, styles.statusChip]}>
                <FontAwesomeIcon icon={faInfoCircle} size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
                <Text style={styles.chipText}>{safeText(item.status)}</Text>
              </View>
            </View>
          </>
        );
      case 'event':
        return (
          <>
            <Text style={styles.title}>{safeText(item.title)}</Text>
            <Text style={styles.field}>{safeText(item.eventType)}</Text>
            <Text style={styles.field}>{formatDate(item.date)}</Text>
            <View style={styles.chipContainer}>
              <View style={[styles.chip, styles.communityChip]}>
                <FontAwesomeIcon icon={faUsers} size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
                <Text style={styles.chipText}>{safeText(item.community)}</Text>
              </View>
            </View>
          </>
        );
      case 'member':
      case 'user':
        return (
          <>
            <Text style={styles.title}>{safeText(item.firstName)} {safeText(item.lastName)}</Text>
            <Text style={styles.field}>ID: {safeText(item.bahaiId)}</Text>
            <View style={styles.chipContainer}>
              <View style={[styles.chip, styles.communityChip]}>
                <FontAwesomeIcon icon={faUsers} size={12} color={themeVariables.whiteColor} style={styles.chipIcon} />
                <Text style={styles.chipText}>{safeText(item.community)}</Text>
              </View>
            </View>
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
      <View>
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
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  communityChip: {
    backgroundColor: themeVariables.primaryColor,
  },
  statusChip: {
    backgroundColor: themeVariables.secondaryColor || themeVariables.greenColor,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    color: themeVariables.whiteColor,
  },
});

export default SearchCard;