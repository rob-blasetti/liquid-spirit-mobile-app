import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {formatLongSessionDate} from '../utils/activityHelpers';

const DETAIL_ITEMS = [
  {
    key: 'day',
    label: 'Day',
    icon: 'calendar-outline',
  },
  {
    key: 'time',
    label: 'Time',
    icon: 'time-outline',
  },
  {
    key: 'frequency',
    label: 'Frequency',
    icon: 'repeat-outline',
  },
];

const formatSessionDate = session => {
  const value =
    session?.dateObj || (session?.date ? new Date(session.date) : null);
  if (!value || Number.isNaN(value.getTime?.())) return '';
  return formatLongSessionDate(value);
};

const ActivityFactsSection = ({
  styles,
  dayOfWeek,
  timeMain,
  frequency,
  nextSession,
  onPressNextSession,
  onCreateNextSession,
}) => {
  const values = {
    day: dayOfWeek || 'N/A',
    time: timeMain || 'N/A',
    frequency: frequency || 'N/A',
  };
  const nextSessionDate = formatSessionDate(nextSession);
  const canJumpToSession = Boolean(nextSessionDate && onPressNextSession);
  const canCreateNextSession = Boolean(!nextSessionDate && onCreateNextSession);
  const nextSessionText = nextSessionDate || 'Not yet created';

  return (
    <>
      <Text style={styles.mapTitle}>Activity Details</Text>
      <View style={styles.activityFactsCard}>
        <View style={styles.activityFactsTopRow}>
          {DETAIL_ITEMS.map((item, index) => (
            <React.Fragment key={item.key}>
              <View style={styles.activityFactItem}>
                <View style={styles.activityFactIconWrap}>
                  <Ionicons
                    name={item.icon}
                    size={16}
                    style={styles.activityFactIcon}
                  />
                </View>
                <View style={styles.activityFactContent}>
                  <Text style={styles.activityFactLabel}>{item.label}</Text>
                  <Text style={styles.activityFactValue}>{values[item.key]}</Text>
                </View>
              </View>
              {index < DETAIL_ITEMS.length - 1 ? (
                <View style={styles.activityFactDivider} />
              ) : null}
            </React.Fragment>
          ))}
        </View>
        <TouchableOpacity
          style={styles.nextSessionRow}
          activeOpacity={canJumpToSession ? 0.8 : 1}
          onPress={canJumpToSession ? onPressNextSession : undefined}
          disabled={!canJumpToSession}>
          <View style={styles.nextSessionContent}>
            <Text style={styles.nextSessionLabel}>Next Upcoming Session</Text>
            <Text
              style={[
                styles.nextSessionValue,
                !nextSessionDate ? styles.nextSessionValueEmpty : null,
              ]}>
              {nextSessionText}
            </Text>
          </View>
          {canJumpToSession ? (
            <Ionicons
              name="chevron-down-outline"
              size={18}
              style={styles.nextSessionIcon}
            />
          ) : canCreateNextSession ? (
            <TouchableOpacity
              style={styles.nextSessionCreateButton}
              onPress={onCreateNextSession}
              activeOpacity={0.8}>
              <Ionicons
                name="add-circle-outline"
                size={16}
                color="#fff"
              />
              <Text style={styles.nextSessionCreateButtonText}>Create it</Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </>
  );
};

export default ActivityFactsSection;
