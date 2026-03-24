import React, { useContext, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import { UserContext } from '../contexts/UserContext';
import themeVariables from '../styles/theme';
import { STUDY_CIRCLE_BOOKS } from './CreateActivity/constants';

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
  const [activeFilter, setActiveFilter] = useState('all');
  const routeCertifications = route.params?.certifications;
  const profileName = route.params?.profileName || 'My';
  const certData = routeCertifications || userDetails?.certifications || {};
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
            ]}
          >
            <Ionicons
              name={badge.icon}
              size={22}
              color={themeVariables.whiteColor}
            />
          </View>
          <View style={styles.badgeTextContainer}>
            <View style={styles.badgeTitleRow}>
              <Text style={[styles.badgeTitle, { color: badge.earned ? '#172033' : '#667085' }]}>
                {badge.label}
              </Text>
              <View style={[styles.statusChip, badge.earned ? styles.statusChipEarned : styles.statusChipLocked]}>
                <Text style={[styles.statusChipText, badge.earned ? styles.statusChipTextEarned : styles.statusChipTextLocked]}>
                  {badge.earned ? 'Earned' : 'Locked'}
                </Text>
              </View>
            </View>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </View>
        </View>
        {idx < list.length - 1 && <View style={styles.divider} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {routeCertifications ? (
          <View style={styles.profileHeading}>
            <Text style={styles.profileHeadingTitle}>{profileName} Badges</Text>
            <Text style={styles.profileHeadingSubtitle}>
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
                  isActive && styles.filterPillActive,
                ]}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showCommunity && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Badges</Text>
              <Text style={styles.sectionCaption}>Recognition for verification, safety, and service.</Text>
            </View>

            <View style={styles.badgesCard}>
              {badgeItems.map((badge, idx, list) => renderBadgeRow(badge, idx, list))}
            </View>
          </>
        )}

        {showRuhi && (
          <>
            <View style={showCommunity ? styles.sectionHeaderSecondary : styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ruhi Sequence</Text>
              <Text style={styles.sectionCaption}>Study milestones completed through the Ruhi institute books.</Text>
            </View>

            <View style={styles.badgesCard}>
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
  profileHeadingSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#667085',
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
  filterPillTextActive: {
    color: themeVariables.whiteColor,
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
    borderWidth: 1,
    borderColor: '#E3E8F2',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#172033',
  },
  sectionCaption: {
    marginTop: 4,
    fontSize: 13,
    color: '#667085',
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
  badgeTextContainer: {
    flex: 1,
    justifyContent: 'center',
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
  badgeDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#667085',
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
  divider: {
    height: 1,
    backgroundColor: '#E9EDF5',
  },
});

export default Badges;
