import React, { useContext, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import { UserContext } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import themeVariables from '../styles/theme';
import { STUDY_CIRCLE_BOOKS } from './CreateActivity/constants';

const BADGE_ICON_COLOR = '#ffffff';

const normalizeRuhiBadges = (value) => {
  if (!Array.isArray(value)) return [];

  const parsed = value
    .map((badge) => (typeof badge === "string" ? badge.trim() : ""))
    .filter((badge) => badge.length > 0);

  return Array.from(new Set(parsed));
};

const BADGE_DEFS = [
  {
    key: 'isVerified',
    label: 'Verified User',
    description: 'Identity verified by the community.',
    icon: 'checkmark-circle',
    color: '#3e8e41',
  },
  {
    key: 'hasChildProtection',
    label: 'Child Protection Certified',
    description: 'Completed child protection training.',
    icon: 'shield-checkmark',
    color: '#d81b60',
  },
  {
    key: 'isLocalAssemblyMember',
    label: 'LSA Member',
    description: 'Serving on the Local Spiritual Assembly.',
    icon: 'star',
    color: '#b71c1c',
    hideWhenLocked: true,
  },
];

const RUHI_BOOK_LABELS = STUDY_CIRCLE_BOOKS.reduce((acc, book) => {
  acc[book.value] = book.label;
  return acc;
}, {});

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'community', label: 'Community Badges' },
  { key: 'ruhi', label: 'Ruhi Sequence' },
];

const Badges = () => {
  const route = useRoute();
  const { userDetails } = useContext(UserContext);
  const { isDarkMode } = useTheme();
  const [activeFilter, setActiveFilter] = useState('all');
  const routeCertifications = route.params?.certifications;
  const profileName = route.params?.profileName || 'My';
  const certData = useMemo(
    () => routeCertifications || userDetails?.certifications || {},
    [routeCertifications, userDetails?.certifications],
  );
  const ruhiBadges = normalizeRuhiBadges(certData.ruhiBadges);

  const badgeItems = useMemo(
    () =>
      BADGE_DEFS.map((def) => ({
        ...def,
        earned: Boolean(certData?.[def.key]),
      })).filter(badge => badge.earned || !badge.hideWhenLocked),
    [certData],
  );

  const ruhiList = useMemo(
    () => {
      if (ruhiBadges.length === 0) {
        return [
          {
            key: 'ruhi:locked',
            label: 'Ruhi Sequence',
            description: 'Complete a Ruhi book to unlock this badge.',
            icon: 'book-outline',
            color: '#4A148C',
            earned: false,
          },
        ];
      }

      return ruhiBadges.map((badge) => ({
        key: `ruhi:${badge}`,
        label: `Ruhi ${badge}`,
        description: RUHI_BOOK_LABELS[badge]
          ? `Completed '${RUHI_BOOK_LABELS[badge]}'.`
          : 'Completed Ruhi book.',
        icon: 'book-outline',
        badgeNumber: String(badge).replace(/^Book\s*/i, ''),
        color: '#4A148C',
        earned: true,
      }));
    },
    [ruhiBadges],
  );

  const showCommunity = activeFilter === 'all' || activeFilter === 'community';
  const showRuhi = activeFilter === 'all' || activeFilter === 'ruhi';

  const renderBadgeRow = (badge, idx, list) => {
    const activeColor = badge.color;
    const inactiveColor = '#AAB3C5';
    const color = badge.earned ? activeColor : inactiveColor;

    return (
      <View key={badge.key}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badgeIconWrap,
              { backgroundColor: badge.earned ? color : '#EEF2F7' },
              !badge.earned && isDarkMode && styles.badgeIconWrapLockedDark,
            ]}
          >
            <Ionicons
              name={badge.icon}
              size={badge.badgeNumber ? 20 : 22}
              color={BADGE_ICON_COLOR}
            />
            {badge.badgeNumber ? (
              <View
                style={[
                  styles.badgeNumberBubble,
                  isDarkMode && styles.badgeNumberBubbleDark,
                ]}>
                <Text
                  style={[
                    styles.badgeNumberText,
                    isDarkMode && styles.badgeNumberTextDark,
                  ]}>
                  {badge.badgeNumber}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.badgeTextContainer}>
            <View style={styles.badgeTitleRow}>
              <Text
                style={[
                  styles.badgeTitle,
                  { color: badge.earned ? '#172033' : '#667085' },
                  isDarkMode && (
                    badge.earned
                      ? styles.badgeTitleEarnedDark
                      : styles.badgeTitleLockedDark
                  ),
                ]}>
                {badge.label}
              </Text>
              <View
                style={[
                  styles.statusChip,
                  badge.earned ? styles.statusChipEarned : styles.statusChipLocked,
                  isDarkMode && (
                    badge.earned
                      ? styles.statusChipEarnedDark
                      : styles.statusChipLockedDark
                  ),
                ]}>
                <Text
                  style={[
                    styles.statusChipText,
                    badge.earned
                      ? styles.statusChipTextEarned
                      : styles.statusChipTextLocked,
                    isDarkMode && (
                      badge.earned
                        ? styles.statusChipTextEarnedDark
                        : styles.statusChipTextLockedDark
                    ),
                  ]}>
                  {badge.earned ? 'Earned' : 'Locked'}
                </Text>
              </View>
            </View>
            <Text style={[styles.badgeDescription, isDarkMode && styles.badgeDescriptionDark]}>
              {badge.description}
            </Text>
          </View>
        </View>
        {idx < list.length - 1 && (
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {routeCertifications ? (
          <View style={styles.profileHeading}>
            <Text style={[styles.profileHeadingTitle, isDarkMode && styles.profileHeadingTitleDark]}>
              {profileName} Badges
            </Text>
            <Text
              style={[
                styles.profileHeadingSubtitle,
                isDarkMode && styles.profileHeadingSubtitleDark,
              ]}>
              Community recognition and Ruhi study milestones visible on this profile.
            </Text>
          </View>
        ) : null}
        <View style={styles.filterRow}>
          {FILTERS.map((filter, index) => {
            const isActive = filter.key === activeFilter;
            const isLast = index === FILTERS.length - 1;

            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                style={[
                  styles.filterPill,
                  !isLast && styles.filterPillSpacing,
                  isDarkMode && styles.filterPillDark,
                  isActive && styles.filterPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isDarkMode && styles.filterPillTextDark,
                    isActive && styles.filterPillTextActive,
                  ]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showCommunity && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Community Badges
              </Text>
              <Text style={[styles.sectionCaption, isDarkMode && styles.sectionCaptionDark]}>
                Recognition for verification, safety, and service.
              </Text>
            </View>

            <View style={[styles.badgesCard, isDarkMode && styles.badgesCardDark]}>
              {badgeItems.map((badge, idx, list) => renderBadgeRow(badge, idx, list))}
            </View>
          </>
        )}

        {showRuhi && (
          <>
            <View style={showCommunity ? styles.sectionHeaderSecondary : styles.sectionHeader}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Ruhi Sequence
              </Text>
              <Text style={[styles.sectionCaption, isDarkMode && styles.sectionCaptionDark]}>
                Study milestones completed through the Ruhi institute books.
              </Text>
            </View>

            <View style={[styles.badgesCard, isDarkMode && styles.badgesCardDark]}>
              {ruhiList.map((badge, idx, list) => renderBadgeRow(badge, idx, list))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  profileHeading: {
    marginBottom: 16,
  },
  profileHeadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#172033',
  },
  profileHeadingTitleDark: {
    color: themeVariables.textSoftInverseColor,
  },
  profileHeadingSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
  },
  profileHeadingSubtitleDark: {
    color: 'rgba(241, 244, 255, 0.62)',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
  },
  filterPillDark: {
    backgroundColor: '#2b2f3a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterPillSpacing: {
    marginRight: 10,
  },
  filterPillActive: {
    backgroundColor: themeVariables.primaryColor,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475467',
  },
  filterPillTextDark: {
    color: 'rgba(241, 244, 255, 0.76)',
  },
  filterPillTextActive: {
    color: BADGE_ICON_COLOR,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderSecondary: {
    marginTop: 18,
    marginBottom: 10,
  },
  badgesCard: {
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  badgesCardDark: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#172033',
  },
  sectionTitleDark: {
    color: themeVariables.textSoftInverseColor,
  },
  sectionCaption: {
    marginTop: 4,
    fontSize: 13,
    color: '#667085',
  },
  sectionCaptionDark: {
    color: 'rgba(241, 244, 255, 0.62)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    alignSelf: 'center',
  },
  badgeIconWrapLockedDark: {
    backgroundColor: '#343946',
  },
  badgeTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  ruhiBadgeInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumberBubble: {
    position: 'absolute',
    bottom: -7,
    alignSelf: 'center',
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: '#D7DDEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNumberBubbleDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  badgeNumberText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4A148C',
  },
  badgeNumberTextDark: {
    color: BADGE_ICON_COLOR,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    paddingRight: 8,
  },
  badgeTitleEarnedDark: {
    color: themeVariables.textSoftInverseColor,
  },
  badgeTitleLockedDark: {
    color: 'rgba(241, 244, 255, 0.62)',
  },
  badgeDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#667085',
  },
  badgeDescriptionDark: {
    color: 'rgba(241, 244, 255, 0.58)',
  },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipEarned: {
    backgroundColor: '#E8F7ED',
  },
  statusChipLocked: {
    backgroundColor: '#EEF2F7',
  },
  statusChipEarnedDark: {
    backgroundColor: 'rgba(34, 122, 58, 0.2)',
  },
  statusChipLockedDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipTextEarned: {
    color: '#227A3A',
  },
  statusChipTextLocked: {
    color: '#667085',
  },
  statusChipTextEarnedDark: {
    color: '#8ee0a3',
  },
  statusChipTextLockedDark: {
    color: 'rgba(241, 244, 255, 0.68)',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9EDF5',
  },
  dividerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
});

export default Badges;
