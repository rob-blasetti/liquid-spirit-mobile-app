import React, { useCallback, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserContext } from '../contexts/UserContext';
import themeVariables from '../styles/theme';
import { getEffectiveNextDate } from '../utils/activityDate';
import { navigateToEventDetail } from '../utils/navigateToEventDetail';
import { navigateToActivityDetail } from '../utils/navigateToActivityDetail';
import resolveImageSource from '../utils/imageSource';

const formatGroupTime = (timeStr) => {
  if (typeof timeStr !== 'string' || !timeStr.includes(':')) return null;
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr ?? 0);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  const temp = new Date();
  temp.setHours(hours, minutes, 0, 0);
  return temp.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const Discover = ({ navigation }) => {
  const { userActivities, userEvents, token, isTokenExpired } = useContext(UserContext);
  const insets = useSafeAreaInsets();

  const upcomingEvents = useMemo(() => {
    if (!Array.isArray(userEvents)) return [];
    const now = new Date();
    return userEvents
      .filter(evt => {
        const when = new Date(evt.startTime || evt.date);
        return !Number.isNaN(when) && when >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.startTime || a.date).getTime() - new Date(b.startTime || b.date).getTime(),
      );
  }, [userEvents]);

  const upcomingActivities = useMemo(() => {
    if (!Array.isArray(userActivities)) return [];
    const now = new Date();
    return userActivities
      .map(activity => ({ activity, nextDate: getEffectiveNextDate(activity) }))
      .filter(({ nextDate }) => nextDate && nextDate >= now)
      .sort((a, b) => a.nextDate - b.nextDate);
  }, [userActivities]);

  const handleEventPress = useCallback(
    (event) => {
      navigateToEventDetail({ navigation, event, token, isTokenExpired });
    },
    [navigation, token, isTokenExpired],
  );

  const handleActivityPress = useCallback(
    (activity) => {
      navigateToActivityDetail({ navigation, activity });
    },
    [navigation],
  );

  const handleViewAllActivities = useCallback(() => {
    navigation.navigate('Activities');
  }, [navigation]);

  const handleViewAllEvents = useCallback(() => {
    navigation.navigate('Events');
  }, [navigation]);

  if (userActivities === null || userEvents === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeVariables.primaryColor} />
      </View>
    );
  }

  const activityPreview = upcomingActivities.slice(0, 4);
  const eventPreview = upcomingEvents.slice(0, 4);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <TouchableOpacity onPress={handleViewAllActivities} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {activityPreview.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming activities.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {activityPreview.map(({ activity, nextDate }) => {
              const dateLabel = nextDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const timeLabel =
                formatGroupTime(activity?.groupDetails?.time) ||
                nextDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              const imageSource = resolveImageSource(
                activity.imageUrl || 'https://via.placeholder.com/300',
                { priority: 'high' },
              );
              return (
                <TouchableOpacity
                  key={activity._id}
                  style={styles.miniCard}
                  onPress={() => handleActivityPress(activity)}
                  activeOpacity={0.9}
                >
                  <FastImage source={imageSource} style={styles.miniImage} resizeMode={FastImage.resizeMode.cover} />
                  <View style={styles.miniContent}>
                    <Text style={styles.miniTitle} numberOfLines={2}>
                      {activity.title}
                    </Text>
                    <Text style={styles.miniMeta} numberOfLines={1}>
                      {dateLabel} · {timeLabel}
                    </Text>
                    {activity.activityType?.name ? (
                      <Text style={styles.miniTag}>{activity.activityType.name}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={[styles.sectionHeader, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>Events</Text>
          <TouchableOpacity onPress={handleViewAllEvents} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {eventPreview.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming events.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {eventPreview.map(event => {
              const when = new Date(event.startTime || event.date);
              const dateLabel = when.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const timeLabel = when.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              const imageSource = resolveImageSource(event.imageUrl, {
                priority: 'high',
                fallback: '/img/events/Event_Placeholder.png',
              });
              return (
                <TouchableOpacity
                  key={event._id || event.id || `${event.title}-${event.startTime || event.date}`}
                  style={styles.miniCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.9}
                >
                  <FastImage source={imageSource} style={styles.miniImage} resizeMode={FastImage.resizeMode.cover} />
                  <View style={styles.miniContent}>
                    <Text style={styles.miniTitle} numberOfLines={2}>
                      {event.title || 'Untitled Event'}
                    </Text>
                    <Text style={styles.miniMeta} numberOfLines={1}>
                      {dateLabel} · {timeLabel}
                    </Text>
                    {event.eventType ? <Text style={styles.miniTag}>{event.eventType}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: themeVariables.blackColor,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeVariables.blackColor,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.primaryColor,
  },
  emptyText: {
    fontSize: 14,
    color: themeVariables.darkGreyColor,
  },
  carousel: {
    paddingBottom: 8,
  },
  miniCard: {
    width: 180,
    marginRight: 12,
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  miniImage: {
    width: '100%',
    height: 110,
  },
  miniContent: {
    padding: 10,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  miniMeta: {
    fontSize: 12,
    color: themeVariables.blackColor,
    marginTop: 4,
  },
  miniTag: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: themeVariables.primaryColor,
  },
});

export default Discover;
