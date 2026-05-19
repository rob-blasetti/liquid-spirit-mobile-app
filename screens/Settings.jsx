import React, { useContext } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { useTheme } from '../contexts';
import { UserContext } from '../contexts/UserContext';
import Toggle from '../components/Toggle';
import packageJson from '../package.json';

const BUILD_NUMBER = Platform.select({
  ios: '178',
  android: '25',
  default: '178',
});

const Settings = ({ navigation }) => {
  const { isDarkMode, setDarkMode } = useTheme();
  const { householdSettings } = useContext(UserContext);
  const versionLabel = `${packageJson.version} (${BUILD_NUMBER})`;
  const dividerStyle = {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.42)' : 'rgba(0, 0, 0, 0.24)',
  };
  const showHouseholdSettings = Boolean(householdSettings?.primaryContact);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="person-outline" size={20} color={themeVariables.blackColor} />
            <Text style={styles.itemText}>My Account</Text>
            <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
          </TouchableOpacity>

          {showHouseholdSettings ? (
            <TouchableOpacity
              style={styles.item}
              onPress={() => navigation.navigate('HouseholdSettings', { household: householdSettings })}
            >
              <Ionicons name="home-outline" size={20} color={themeVariables.blackColor} />
              <Text style={styles.itemText}>Household</Text>
              <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('NotificationSettings')}>
            <Ionicons name="notifications-outline" size={20} color={themeVariables.blackColor} />
            <Text style={styles.itemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Security')}>
            <Ionicons name="shield-outline" size={20} color={themeVariables.blackColor} />
            <Text style={styles.itemText}>Login & Security</Text>
            <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionDivider, dividerStyle]} />

        <View style={styles.section}>
          <View style={styles.item}>
            <Ionicons name={isDarkMode ? 'moon' : 'moon-outline'} size={20} color={themeVariables.blackColor} />
            <View style={styles.itemTextBlock}>
              <Text style={styles.itemTitle}>Dark Mode</Text>
            </View>
            <Toggle
              value={isDarkMode}
              onValueChange={setDarkMode}
              accessibilityLabel="Dark Mode"
            />
          </View>
        </View>

        <View style={[styles.sectionDivider, dividerStyle]} />

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Version {versionLabel}</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: themeVariables.blackColor,
    marginBottom: 8,
    marginLeft: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 0,
    elevation: 0,
    marginBottom: 0,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: themeVariables.blackColor,
  },
  itemTitle: {
    color: themeVariables.blackColor,
    fontSize: 16,
  },
  itemTextBlock: {
    flex: 1,
    marginLeft: 15,
    marginRight: 12,
  },
  versionRow: {
    paddingVertical: 15,
  },
  versionText: {
    color: themeVariables.textMutedStrongColor || '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Settings;
