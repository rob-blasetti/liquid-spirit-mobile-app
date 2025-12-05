import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import UserCell from '../../../../components/UserCell';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../../../../styles/theme';

const AttendanceSection = ({ attendees = [], styles, onJoin, hasJoined }) => (
  <>
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.mapTitle, { marginTop: 0, marginBottom: 0 }]}>Attendees ({attendees.length})</Text>
      {!hasJoined && onJoin ? (
        <TouchableOpacity style={styles.requestButton} onPress={onJoin} activeOpacity={0.8}>
          <Ionicons name="add-circle-outline" size={18} color={themeVariables.whiteColor} />
          <Text style={styles.requestButtonText}>Attend</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    <View style={styles.attendeeList}>
      {Array.isArray(attendees) && attendees.length > 0 ? (
        attendees.map((a, idx) => (
          <UserCell
            key={a._id || idx}
            user={a.details || a}
            hideRole
            containerStyle={styles.attendeeItem}
          />
        ))
      ) : (
        <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
          No attendees yet.
        </Text>
      )}
    </View>
    <View style={styles.divider} />
  </>
);

export default AttendanceSection;
