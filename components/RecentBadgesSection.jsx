import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../styles/theme';
import {useTheme} from '../contexts/ThemeContext';

const BADGE_ICON_COLOR = '#ffffff';
const DASHBOARD_DARK_BORDER_COLOR = 'rgba(255, 255, 255, 0.35)';

const RecentBadgesSection = ({
  badges = [],
  onPressViewAll,
  title = 'Recent Badges',
  emptyText = 'Earn badges and they will show up here.',
  viewAllAccessibilityLabel,
  horizontalMargin = 20,
}) => {
  const {isDarkMode} = useTheme();
  const recentBadges = Array.isArray(badges) ? badges.slice(0, 4) : [];

  return (
    <>
      <View style={[styles.badgesHeadingRow, {marginHorizontal: horizontalMargin}]}>
        <View>
          <Text style={styles.badgesLabel}>{title}</Text>
        </View>
        {onPressViewAll ? (
          <TouchableOpacity
            onPress={onPressViewAll}
            style={styles.seeAllButton}
            accessibilityRole="button"
            accessibilityLabel={viewAllAccessibilityLabel || `View all ${title.toLowerCase()}`}>
            <Text style={styles.seeAllText}>View all</Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={themeVariables.primaryColor}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      <View
        style={[
          styles.badgesContainer,
          isDarkMode && styles.badgesContainerDark,
          {marginHorizontal: horizontalMargin},
        ]}>
        {recentBadges.length > 0 ? (
          <View style={styles.badgesPreviewRow}>
            {recentBadges.map((badge, index) => (
              <View
                key={badge?.key || `${badge?.label || 'badge'}-${index}`}
                style={styles.badgePreviewItem}>
                <View style={styles.badgePreviewCard}>
                  <View
                    style={[
                      styles.badgePreviewIcon,
                      {backgroundColor: badge?.color || themeVariables.primaryColor},
                    ]}>
                    <Ionicons
                      name={badge?.icon || 'ribbon-outline'}
                      size={18}
                      color={BADGE_ICON_COLOR}
                    />
                  </View>
                  <Text
                    style={styles.badgePreviewText}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {badge?.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.badgesEmptyState}>
            <View style={styles.badgesEmptyIcon}>
              <Ionicons
                name="ribbon-outline"
                size={18}
                color={themeVariables.primaryColor}
              />
            </View>
            <Text style={styles.badgesEmptyText}>{emptyText}</Text>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  badgesLabel: {
    color: themeVariables.blackColor,
    fontSize: 18,
    fontWeight: '700',
  },
  badgesHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 6,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  seeAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    marginTop: 0,
  },
  seeAllText: {
    marginRight: 3,
    fontSize: 12,
    fontWeight: '700',
    color: themeVariables.primaryColor,
  },
  badgesContainer: {
    marginHorizontal: 20,
    backgroundColor: themeVariables.whiteColor,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EBF5',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  badgesContainerDark: {
    borderColor: DASHBOARD_DARK_BORDER_COLOR,
  },
  badgesPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginBottom: 0,
    width: '100%',
  },
  badgePreviewItem: {
    flex: 1,
    paddingHorizontal: 3,
  },
  badgePreviewCard: {
    minHeight: 84,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  badgePreviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  badgePreviewText: {
    minHeight: 24,
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
    textAlign: 'center',
    width: '100%',
  },
  badgesEmptyState: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesEmptyIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    marginRight: 10,
  },
  badgesEmptyText: {
    flex: 1,
    fontSize: 14,
    color: '#6C7690',
  },
});

export default RecentBadgesSection;
