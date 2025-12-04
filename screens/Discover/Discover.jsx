import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { UserContext } from '../../contexts/UserContext';
import themeVariables from '../../styles/theme';
import { navigateToEventDetail } from '../../utils/navigateToEventDetail';
import { navigateToActivityDetail } from '../../utils/navigateToActivityDetail';
import resolveImageSource from '../../utils/imageSource';
import LiquidGlassButton from '../DetailCard/common/LiquidGlassButton';
import LiquidGlassIconButton from '../../components/LiquidGlassIconButton';
import DiscoverCard from './DiscoverCard';
import useDiscoverData from './hooks/useDiscoverData';

const TIMEFRAME_WINDOWS = {
  week: 7,
  month: 30,
  quarter: 90,
};

const TIMEFRAME_LABELS = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
};

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

const filterByTimeframe = (items, timeframe, dateKey) => {
  if (!Array.isArray(items)) return [];
  const windowInDays = TIMEFRAME_WINDOWS[timeframe];
  if (!windowInDays) return items;

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + windowInDays);

  return items.filter((item) => {
    const date = item?.[dateKey];
    if (!(date instanceof Date) || isNaN(date)) return false;
    return date >= now && date <= horizon;
  });
};

const Discover = ({ navigation }) => {
  const { userActivities, userEvents, token, isTokenExpired } = useContext(UserContext);
  const insets = useSafeAreaInsets();
  const { activityPreview, eventPreview } = useDiscoverData({ userActivities, userEvents });
  const [timeframe, setTimeframe] = useState('week');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredActivityPreview = useMemo(
    () => filterByTimeframe(activityPreview, timeframe, 'nextDate'),
    [activityPreview, timeframe],
  );

  const filteredEventPreview = useMemo(
    () => filterByTimeframe(eventPreview, timeframe, 'when'),
    [eventPreview, timeframe],
  );

  const timeframeLabel = TIMEFRAME_LABELS[timeframe]?.toLowerCase?.() || 'week';
  const activitiesTitle = `Activities this ${timeframeLabel}`;
  const eventsTitle = `Events this ${timeframeLabel}`;
  const [showActivitiesGrid, setShowActivitiesGrid] = useState(false);
  const [showEventsGrid, setShowEventsGrid] = useState(false);

  useEffect(() => {
    if (!activityPreview) return;
    console.log('[Discover] activities preview', activityPreview.map(({ activity, nextDate, addressLabel }) => ({
      id: activity?._id || activity?.id,
      title: activity?.title,
      nextDate,
      addressLabel,
    })));
  }, [activityPreview]);

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

  const iosVersion = Platform.OS === 'ios'
    ? (typeof Platform.Version === 'string' ? parseFloat(Platform.Version) : Platform.Version)
    : 0;
  const useIconGlassButtons = Platform.OS === 'ios' && Number.isFinite(iosVersion) && iosVersion >= 26;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.filterWrapper}>
          {useIconGlassButtons ? (
            <LiquidGlassIconButton
              iconName="filter-outline"
              iconColor={themeVariables.blackColor}
              accessibilityLabel="Filter discover content by timeframe"
              onPress={() => setIsFilterOpen((prev) => !prev)}
              hasShadow={false}
              forceFallback
              glassStyle={styles.filterIconGlass}
            />
          ) : (
            <LiquidGlassButton
              onPress={() => setIsFilterOpen((prev) => !prev)}
              intensity={24}
              accessibilityLabel="Filter discover content by timeframe"
            >
              <View style={styles.filterButtonContent}>
                <View style={styles.filterGlyph}>
                  <View style={[styles.filterGlyphLine, styles.filterGlyphLineTop]} />
                  <View style={[styles.filterGlyphLine, styles.filterGlyphLineMiddle]} />
                  <View style={[styles.filterGlyphLine, styles.filterGlyphLineBottom]} />
                </View>
              </View>
            </LiquidGlassButton>
          )}
          {isFilterOpen ? (
            <View style={styles.filterMenu}>
              {Object.keys(TIMEFRAME_WINDOWS).map((key) => {
                const isActive = timeframe === key;
                return (
                  <LiquidGlassButton
                    key={key}
                    onPress={() => {
                      setTimeframe(key);
                      setIsFilterOpen(false);
                    }}
                    intensity={isActive ? 0 : 14}
                    borderRadius={14}
                    style={styles.filterMenuItemShadow}
                    containerStyle={[
                      styles.filterMenuItem,
                      isActive && styles.filterMenuItemActive,
                      isActive && styles.filterMenuItemActiveBorder,
                    ]}
                    withHighlight={false}
                  >
                    <View style={styles.filterMenuItemContent}>
                      <View style={styles.filterMenuCheckSlot}>
                        {isActive ? (
                          <Ionicons name="checkmark" size={18} color={themeVariables.whiteColor} />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          styles.filterMenuItemLabel,
                          isActive && styles.filterMenuItemLabelActive,
                        ]}
                      >
                        {TIMEFRAME_LABELS[key]}
                      </Text>
                    </View>
                  </LiquidGlassButton>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{activitiesTitle}</Text>
          {filteredActivityPreview.length > 0 ? (
            <TouchableOpacity
              onPress={() => setShowActivitiesGrid((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.iconButton}
            >
              <Ionicons
                name={showActivitiesGrid ? 'remove-outline' : 'add-outline'}
                size={22}
                color={themeVariables.primaryColor}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {filteredActivityPreview.length === 0 ? (
          <Text style={styles.emptyText}>
            No upcoming activities this {TIMEFRAME_LABELS[timeframe].toLowerCase()}.
          </Text>
        ) : showActivitiesGrid ? (
          <View style={styles.gridList}>
            {filteredActivityPreview.map(({ activity, nextDate, addressLabel }) => {
              const dayLabel = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
              const dateLabel = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeLabel =
                formatGroupTime(activity?.groupDetails?.time) ||
                nextDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              const imageSource = resolveImageSource(
                activity.imageUrl || 'https://via.placeholder.com/300',
                { priority: 'high' },
              );
              const typeLabel = activity.activityType?.name;
              return (
                <DiscoverCard
                  key={activity._id}
                  title={activity.title}
                  imageSource={imageSource}
                  typeLabel={typeLabel}
                  locationLabel={addressLabel}
                  timeLabel={`${timeLabel} · ${dayLabel} · ${dateLabel}`}
                  onPress={() => handleActivityPress(activity)}
                  style={styles.cardGrid}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.carouselWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              style={styles.carouselScroll}
            >
              {filteredActivityPreview.map(({ activity, nextDate, addressLabel }) => {
                const dayLabel = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
                const dateLabel = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeLabel =
                  formatGroupTime(activity?.groupDetails?.time) ||
                  nextDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                const imageSource = resolveImageSource(
                  activity.imageUrl || 'https://via.placeholder.com/300',
                  { priority: 'high' },
                );
                const typeLabel = activity.activityType?.name;
                return (
                  <DiscoverCard
                    key={activity._id}
                    title={activity.title}
                    imageSource={imageSource}
                    typeLabel={typeLabel}
                    locationLabel={addressLabel}
                    timeLabel={`${timeLabel} · ${dayLabel} · ${dateLabel}`}
                    onPress={() => handleActivityPress(activity)}
                    style={styles.cardCarousel}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={[styles.sectionHeader, styles.sectionSpacing]}>
          <Text style={styles.sectionTitle}>{eventsTitle}</Text>
          {filteredEventPreview.length > 0 ? (
            <TouchableOpacity
              onPress={() => setShowEventsGrid((prev) => !prev)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.iconButton}
            >
              <Ionicons
                name={showEventsGrid ? 'remove-outline' : 'add-outline'}
                size={22}
                color={themeVariables.primaryColor}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {filteredEventPreview.length === 0 ? (
          <Text style={styles.emptyText}>
            No upcoming events this {TIMEFRAME_LABELS[timeframe].toLowerCase()}.
          </Text>
        ) : showEventsGrid ? (
          <View style={styles.gridList}>
            {filteredEventPreview.map(({ event, when, addressLabel }) => {
              const dayLabel = when.toLocaleDateString('en-US', { weekday: 'short' });
              const dateLabel = when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeLabel = when.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              const imageSource = resolveImageSource(event.imageUrl, {
                priority: 'high',
                fallback: '/img/events/Event_Placeholder.png',
              });
              const typeLabel = event.eventType;
              return (
                <DiscoverCard
                  key={event._id || event.id || `${event.title}-${event.startTime || event.date}`}
                  title={event.title || 'Untitled Event'}
                  imageSource={imageSource}
                  typeLabel={typeLabel}
                  locationLabel={addressLabel}
                  timeLabel={`${timeLabel} · ${dayLabel} · ${dateLabel}`}
                  onPress={() => handleEventPress(event)}
                  style={styles.cardGrid}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.carouselWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carousel}
              style={styles.carouselScroll}
            >
              {filteredEventPreview.map(({ event, when, addressLabel }) => {
                const dayLabel = when.toLocaleDateString('en-US', { weekday: 'short' });
                const dateLabel = when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeLabel = when.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                const imageSource = resolveImageSource(event.imageUrl, {
                  priority: 'high',
                  fallback: '/img/events/Event_Placeholder.png',
                });
                const typeLabel = event.eventType;
                return (
                  <DiscoverCard
                    key={event._id || event.id || `${event.title}-${event.startTime || event.date}`}
                    title={event.title || 'Untitled Event'}
                    imageSource={imageSource}
                    typeLabel={typeLabel}
                    locationLabel={addressLabel}
                    timeLabel={`${timeLabel} · ${dayLabel} · ${dateLabel}`}
                    onPress={() => handleEventPress(event)}
                    style={styles.cardCarousel}
                  />
                );
              })}
            </ScrollView>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: themeVariables.blackColor,
  },
  filterWrapper: {
    position: 'relative',
    marginLeft: 8,
    marginRight: 8,
  },
  filterButton: {
    width: 52,
    height: 52,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonShadow: {
    shadowColor: '#0b1f33',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconGlass: {
    backgroundColor: 'rgba(240,240,240,0.8)',
    borderColor: 'rgba(200,200,200,0.9)',
    borderWidth: 1,
  },
  // TODO: legacy styles for the old filter glyph button; keep for non-iOS26 fallback
  filterGlyph: {
    width: 16,
    height: 16,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterGlyphLine: {
    height: 2.6,
    borderRadius: 2,
    backgroundColor: '#3c3c3c',
    width: '100%',
    marginVertical: 1,
  },
  filterGlyphLineTop: {
    width: '90%',
  },
  filterGlyphLineMiddle: {
    width: '70%',
  },
  filterGlyphLineBottom: {
    width: '60%',
  },
  filterMenu: {
    position: 'absolute',
    top: 46,
    right: 0,
    minWidth: 160,
    maxWidth: 190,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#0b1f33',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 20,
  },
  filterMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    justifyContent: 'center',
  },
  filterMenuItemActive: {
    backgroundColor: themeVariables.primaryColor,
  },
  filterMenuItemActiveBorder: {
    borderColor: themeVariables.primaryColor,
  },
  filterMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    columnGap: 10,
  },
  filterMenuItemShadow: {
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 8,
  },
  filterMenuCheckSlot: {
    width: 22,
    alignItems: 'center',
  },
  filterMenuItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: themeVariables.blackColor,
    flex: 1,
    textAlign: 'left',
  },
  filterMenuItemLabelActive: {
    color: themeVariables.whiteColor,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
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
    marginRight: 10,
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
  iconButton: {
    padding: 6,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  carouselWrapper: {
    overflow: 'visible',
  },
  carouselScroll: {
    overflow: 'visible',
  },
  carousel: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  cardCarousel: {
    width: 180,
    marginRight: 12,
  },
  cardGrid: {
    width: '48%',
    marginRight: 0,
    marginBottom: 12,
  },
});

export default Discover;
