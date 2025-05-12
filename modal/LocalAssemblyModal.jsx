import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import Avatar from '@flipxyz/react-native-boring-avatars';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 32;
const GUTTER = 22;
// Calculate item size to fit 3 columns
const ITEM_SIZE = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - GUTTER * 2) / 3;

/**
 * Modal to display Local Spiritual Assembly members in a bottom sheet.
 * Props:
 *  visible: boolean
 *  onClose: () => void
 *  members: Array<{ _id: string, firstName: string, lastName: string, profilePicture?: string }>
 */
const LocalAssemblyModal = ({ visible, onClose, members = [] }) => {
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
                  <View key={member._id} style={styles.memberItem}>
                    {member.userId.profilePicture ? (
                      <Image
                        source={{ uri: member.userId.profilePicture }}
                        style={styles.avatar}
                      />
                    ) : (
                      <Avatar
                        size={ITEM_SIZE}
                        name={`${member.userId.firstName} ${member.userId.lastName}`}
                        variant="beam"
                        colors={[
                          '#1B263B', '#0A74DA', '#6C7A89', '#F8F9FA', '#0C0C0C'
                        ]}
                      />
                    )}
                    <Text style={styles.name} numberOfLines={2}>
                      {member.userId.firstName} {member.userId.lastName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    marginBottom: 6,
    backgroundColor: '#eee',
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LocalAssemblyModal;