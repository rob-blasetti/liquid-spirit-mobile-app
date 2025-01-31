import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import themeVariables from '../styles/theme';

const ActivityDetail = ({ route, navigation }) => {
  const { activity } = route.params; // Get activity data from navigation parameters

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Activity Banner */}
      <Image source={{ uri: activity.imageUrl }} style={styles.banner} />

      {/* Activity Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.type}>Type: {activity.activityType?.name || 'Unknown'}</Text>
        <Text style={styles.date}>
          📅 Starts: {new Date(activity.startDate).toLocaleDateString()}
        </Text>
        <Text style={styles.schedule}>
          ⏰ {activity.groupDetails?.day || 'N/A'} - {activity.groupDetails?.time || 'N/A'} (
          {activity.groupDetails?.frequency || 'One-time'})
        </Text>
        <Text style={styles.location}>
          📍 {activity.address?.streetAddress}, {activity.address?.suburb}, {activity.address?.city}
        </Text>

        <Text style={styles.descriptionHeader}>Facilitators:</Text>
        <Text style={styles.description}>
          {activity.facilitators.length > 0
            ? activity.facilitators.join(', ')
            : 'No facilitators assigned.'}
        </Text>

        <Text style={styles.descriptionHeader}>Participants:</Text>
        <Text style={styles.description}>
          {activity.participants.length > 0
            ? `${activity.participants.length} participants`
            : 'No participants yet.'}
        </Text>

        {/* Join Button */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => alert('You have joined this activity!')}
        >
          <Text style={styles.joinButtonText}>Join Activity</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: themeVariables.whiteColor,
    flexGrow: 1,
  },
  banner: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    marginBottom: 10,
  },
  type: {
    fontSize: 16,
    color: themeVariables.primaryColor,
    marginBottom: 5,
  },
  date: {
    fontSize: 16,
    color: themeVariables.primaryColor,
    marginBottom: 5,
  },
  schedule: {
    fontSize: 16,
    color: themeVariables.primaryColor,
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    color: themeVariables.primaryColor,
    marginBottom: 20,
  },
  descriptionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: themeVariables.blackColor,
  },
  description: {
    fontSize: 16,
    color: themeVariables.blackColor,
    lineHeight: 22,
    marginBottom: 20,
  },
  joinButton: {
    backgroundColor: themeVariables.primaryColor,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActivityDetail;
