import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import { UserContext } from '../contexts/UserContext';
import { getPushPreferences, updatePushPreferences } from '../services/PushPreferencesService.jsx';

const NotificationSettings = () => {
  const nav = useNavigation();
  const { user, token } = useContext(UserContext);
  const insets = useSafeAreaInsets();

  const [pushPrefs, setPushPrefs] = useState(null);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingKey, setSavingKey] = useState(null);

  // Group definitions with concise labels and per-section hints
  const groups = [
    {
      title: 'Posts',
      hint: 'Tell me about:',
      items: [
        { key: 'post_created', label: 'New posts' },
        { key: 'post_media', label: 'Comments or likes on my posts' },
      ],
    },
    {
      title: 'Activities',
      hint: 'Tell me when:',
      items: [
        { key: 'new_activity', label: 'A new activity is created' },
        { key: 'join_activity', label: 'Someone joins an activity' },
        { key: 'activity_updated', label: 'An activity is updated' },
        { key: 'activity_deleted', label: 'An activity is deleted' },
        { key: 'activity_completed', label: 'An activity is completed' },
      ],
    },
    {
      title: 'Sessions',
      hint: 'Tell me when:',
      items: [
        { key: 'session_created', label: 'A new session is created' },
        { key: 'session_reminder', label: 'A session is coming soon' },
        { key: 'session_cancelled', label: 'An session is cancelled' },
      ],
    },
    {
      title: 'Events',
      hint: 'Tell me when:',
      items: [
        { key: 'join_event', label: 'Someone joins an event' },
      ],
    },
    {
      title: 'Announcements',
      hint: 'Tell me about:',
      items: [
        { key: 'signup', label: 'Someone new signs up' },
      ],
    },
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token || !user?.id) return;
      setLoadingPrefs(true);
      try {
        const prefs = await getPushPreferences(token, user.id);
        if (mounted) setPushPrefs(prefs);
      } catch (e) {
        console.warn('Failed to load push preferences', e);
      } finally {
        if (mounted) setLoadingPrefs(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token, user?.id]);

  const togglePref = async (key, value) => {
    if (!token || !user?.id) return;
    setSavingKey(key);
    const prev = pushPrefs || {};
    const next = { ...prev, [key]: value };
    setPushPrefs(next);
    try {
      const server = await updatePushPreferences(token, user.id, { [key]: value });
      setPushPrefs(server);
    } catch (e) {
      console.warn('Failed to update preference', key, e);
      Alert.alert('Save failed', e?.message || 'Could not update preference.');
      setPushPrefs(prev);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back chevron above content */}
      <View style={styles.chevronContainer}>
        <TouchableOpacity style={styles.chevronButton} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={20} color={themeVariables.blackColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 40 + insets.bottom }]}
      >
        <Text style={styles.header}>Notification Settings</Text>
        {groups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <Text style={styles.sectionHint}>{group.hint}</Text>
            <View style={styles.groupContainer}>
              {group.items.map((item, idx) => (
                <View key={item.key}>
                  <View style={styles.groupRow}>
                    <Ionicons name="notifications-outline" size={20} color="#312783" />
                    <Text style={styles.itemText}>{item.label}</Text>
                    <Switch
                      value={pushPrefs ? !!pushPrefs[item.key] : true}
                      onValueChange={(val) => togglePref(item.key, val)}
                      disabled={loadingPrefs || savingKey === item.key}
                    />
                  </View>
                  {idx < group.items.length - 1 && <View style={styles.groupSeparator} />}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.darkGreyColor,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  chevronContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  chevronButton: {
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    marginTop: 10,
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
    marginLeft: 4,
  },
  groupContainer: {
    backgroundColor: themeVariables.whiteColor,
    borderWidth: 1,
    borderColor: themeVariables.blackColor,
    borderRadius: 8,
    overflow: 'hidden',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  groupSeparator: {
    height: 1,
    backgroundColor: themeVariables.blackColor,
  },
  itemText: {
    flex: 1,
    marginLeft: 12,
    color: themeVariables.blackColor,
    fontSize: 16,
  },
});

export default NotificationSettings;
