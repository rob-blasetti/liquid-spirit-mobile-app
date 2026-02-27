import React, { useContext, useMemo } from 'react';
import { SafeAreaView, StyleSheet, View, Text, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../contexts/UserContext';
import themeVariables from '../styles/theme';

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
  },
];

const Badges = () => {
  const { userDetails } = useContext(UserContext);
  const certData = userDetails?.certifications || {};
  const ruhiBadges = normalizeRuhiBadges(certData.ruhiBadges);

  const badgeItems = useMemo(
    () =>
      BADGE_DEFS.map((def) => ({
        ...def,
        earned: Boolean(certData?.[def.key]),
      })),
    [certData],
  );

  const ruhiList = useMemo(
    () =>
      ruhiBadges.map((badge) => ({
        key: `ruhi:${badge}`,
        label: `RUHI: ${badge}`,
        description: 'Registered RUHI badge.',
        icon: 'book-outline',
        color: '#4A148C',
        earned: true,
      })),
    [ruhiBadges],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>My Badges</Text>
        <View style={styles.badgesCard}>
          {[...badgeItems, ...ruhiList].map((badge, idx, list) => {
            const activeColor = badge.color;
            const inactiveColor = '#b0b0b0';
            const color = badge.earned ? activeColor : inactiveColor;
            return (
              <View key={badge.key}>
                <View style={styles.badgeRow}>
                  <Ionicons name={badge.icon} size={24} color={color} style={styles.badgeIcon} />
                  <View style={styles.badgeTextContainer}>
                    <Text style={[styles.badgeTitle, { color }]}>{badge.label}</Text>
                    <Text style={styles.badgeDescription}>{badge.description}</Text>
                  </View>
                </View>
                {idx < list.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 12,
  },
  badgesCard: {
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.blackColor,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  badgeIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: themeVariables.blackColor,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default Badges;
