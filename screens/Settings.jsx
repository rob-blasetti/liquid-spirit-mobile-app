import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
// no-op

const Settings = ({ navigation }) => {
  return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="person-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>My Account</Text>
          <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
        </TouchableOpacity>

        {/* <View style={styles.item}>
          <Ionicons name="notifications-outline" size={20} color="#312783" />
          <Text style={styles.itemText}>Notifications</Text>
          <Switch value={true} />
        </View> */}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('NotificationSettings')}>
          <Ionicons name="notifications-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Security')}>
          <Ionicons name="shield-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Security</Text>
          <Ionicons name="chevron-forward" size={18} color={themeVariables.blackColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionDivider} />
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
    height: StyleSheet.hairlineWidth,
    backgroundColor: themeVariables.borderLightColor,
    marginVertical: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: themeVariables.blackColor,
  },
});

export default Settings;
