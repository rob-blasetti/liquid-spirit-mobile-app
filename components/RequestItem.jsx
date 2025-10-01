import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import resolveImageSource from '../utils/imageSource';

/**
 * RequestItem displays an activity request with action buttons.
 * Props:
 *  - request: { user: { firstName, lastName, profilePicture? }, type: 'participant'|'facilitator', activity: { title, imageUrl?, media? } }
 *  - onAccept: function to call when Accept is pressed
 *  - onDecline: function to call when Decline is pressed
 */

const RequestItem = ({ request: reqItem, onAccept, onDecline }) => {
  const navigation = useNavigation();
  const { activity, type, request: pendingUser } = reqItem;
  const imageSource = resolveImageSource(activity?.imageUrl || activity?.media?.[0], {
    priority: 'high',
    fallback: '/img/events/Event_Placeholder.png',
  });
  // Pending user data
  const user = pendingUser || {};
  const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

  const handlePress = () => {
    navigation.navigate('ActivityDetailCard', {
      activityId: activity?._id,
      activityPreload: activity,
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.8}>
      {imageSource && <FastImage source={imageSource} style={styles.image} />}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {activity?.title || 'Activity'}
        </Text>
        <View style={styles.requestRow}>
          {user.profilePicture && (
            <FastImage
              source={resolveImageSource(user.profilePicture, { priority: 'normal' })}
              style={styles.userAvatar}
            />
          )}
          <View style={styles.requestTextContainer}>
            <Text style={styles.requestTitle} numberOfLines={1}>
              {type === 'participant' ? 'Participation Request:' : 'Facilitator Request:'}
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={() => onAccept(reqItem)}>
          <Ionicons name="checkmark-circle" size={24} color={themeVariables.secondaryColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => onDecline(reqItem)}>
          <Ionicons name="close-circle" size={24} color={themeVariables.redColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.primaryColor,
    marginBottom: 4,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: themeVariables.blackColor,
    flexShrink: 1,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  requestTextContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    flexShrink: 1,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  userName: {
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default RequestItem;
