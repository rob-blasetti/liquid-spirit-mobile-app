import React, { useContext } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import themeVariables from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Avatar from '@liquidspirit/react-native-boring-avatars';
import { Button } from 'liquid-spirit-styleguide';
import { CommunityContext } from '../contexts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 32;
const GUTTER = 22;
// Calculate item size to fit 3 columns
const ITEM_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GUTTER * 2) / 3;
// Avatar size (smaller than item container)
const AVATAR_SIZE = ITEM_SIZE * 0.75;

// LocalAssemblyModal now consumes assembly member data from CommunityContext
const LocalAssemblyModal = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { homeOverview } = useContext(CommunityContext);
  const members = homeOverview?.localSpiritualAssembly || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              <Text style={styles.title}>Local Spiritual Assembly</Text>
              <ScrollView contentContainerStyle={styles.grid}>
                {members.map((member) => (
                  <View key={member.id || `${member.firstName}-${member.lastName}`} style={styles.memberItem}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        if (member.id) {
                          navigation.navigate('PublicUserProfile', { userId: member.id });
                          onClose();
                        } else {
                          console.warn('Cannot navigate: member.id is missing', member);
                        }
                      }}
                    >
                    {member.profilePicture ? (
                      <FastImage
                        source={{ uri: member.profilePicture }}
                        style={styles.avatar}
                      />
                    ) : (
                      <Avatar
                        size={AVATAR_SIZE}
                        style={styles.avatar}
                        name={`${member.firstName} ${member.lastName}`}
                        variant="beam"
                        colors={[
                          '#1B263B',
                          '#0A74DA',
                          '#6C7A89',
                          '#F8F9FA',
                          '#0C0C0C',
                        ]}
                      />
                    )}
                    </TouchableOpacity>                    
                    <Text style={styles.name} numberOfLines={2}>
                      {member.firstName} {member.lastName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <Button secondary onPress={onClose} label="Close" />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberItem: {
    width: ITEM_SIZE,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 4,
    backgroundColor: '#eee',
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  // Close button at bottom of modal
  modalCloseButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
    borderRadius: themeVariables.borderRadiusPill,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  modalCloseText: {
    color: themeVariables.primaryColor,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LocalAssemblyModal;