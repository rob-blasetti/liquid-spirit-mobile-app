import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import UserBadge from '../components/UserBadge';

/**
 * BadgeModal
 * A generic modal to display a list of user badges (e.g., facilitators, participants).
 * Props:
 *  - visible: boolean to show/hide
 *  - onClose: function to call when backdrop or close pressed
 *  - list: array of items; each item may have details or refId or direct user fields
 *  - title: string title of modal
 */
const BadgeModal = ({ visible, onClose, list = [], title = '' }) => {
  const navigation = useNavigation();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <Text style={styles.title}>{title}</Text>
              <ScrollView contentContainerStyle={styles.listContainer}>
                {list.map((item, idx) => {
                  // item may embed user in details or refId, fallback to item itself
                  const user = item.details || item.refId || item;
                  const key = user._id || user.id || idx;
                  return (
                    <UserBadge key={key} user={user} />
                  );
                })}
              </ScrollView>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 12,
    padding: 16,
    width: '85%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: themeVariables.primaryColor,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  closeButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: themeVariables.primaryColor,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default BadgeModal;