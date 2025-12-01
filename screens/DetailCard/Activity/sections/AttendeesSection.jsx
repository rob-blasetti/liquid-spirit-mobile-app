import React from 'react';
import { View, Text } from 'react-native';

const AttendeesSection = ({ facilitators, participants, renderUserList, styles }) => (
  <>
    <Text style={styles.mapTitle}>Facilitators</Text>
    <View style={styles.userListContainer}>
      {renderUserList(facilitators)}
    </View>

    <Text style={styles.mapTitle}>Participants</Text>
    <View style={styles.userListContainer}>
      {renderUserList(participants)}
    </View>
  </>
);

export default AttendeesSection;
