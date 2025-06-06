import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FastImage from 'react-native-fast-image';
import Avatar from '@flipxyz/react-native-boring-avatars';
import { useNavigation } from '@react-navigation/native';

const truncateText = (text, maxLength) => {
  return text?.length > maxLength ? `${text?.substring(0, maxLength - 3)}...` : text;
};

const UserCell = ({ user, type }) => {
  const navigation = useNavigation();
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;

  const navigateToProfile = () => {
    navigation.navigate('PublicUserProfile', { userId: user._id });
  };

  return (
    <TouchableOpacity style={styles.userItem} onPress={navigateToProfile} activeOpacity={0.7}>
      {user.profilePicture ? (
        <FastImage source={{ uri: user.profilePicture }} style={styles.smallAvatar} />
      ) : (
        <Avatar
          size={styles.smallAvatar.width}
          name={name}
          variant="beam"
          colors={['#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C']}
          style={styles.smallAvatar}
        />
      )}
      <View style={styles.userInfo}>
        <Text style={styles.avatarName} numberOfLines={1}>{truncateText(name, 18)}</Text>
        <Text style={styles.avatarType} numberOfLines={1}>{type}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 12,
    marginBottom: 10,
  },
  userInfo: {
    marginLeft: 6,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  smallAvatar: {
    width: 42,
    height: 42,
    borderRadius: 28,
  },
  avatarName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  avatarType: {
    fontSize: 12,
    color: '#999',
  },
});

export default UserCell;
