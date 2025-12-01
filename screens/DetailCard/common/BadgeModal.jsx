import React from 'react';
import {
  Modal,
  TouchableWithoutFeedback,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import UserBadge from '../../../components/UserBadge';
import themeVariables from '../../../styles/theme';

const BadgeModal = ({ visible, onClose, list = [], title = 'People' }) => {
  const navigation = useNavigation();
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{title}</Text>
              <ScrollView contentContainerStyle={styles.modalList}>
                {list.map((user = {}, idx) => {
                  const key = user._id || user.id || `user-${idx}`;
                  const certs = user.certifications || [];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.modalBadgeWrap}
                      activeOpacity={0.8}
                      onPress={() => navigation.navigate('PublicUserProfile', { userId: user._id || user.id })}
                    >
                      <UserBadge user={user} userCertifications={certs} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                onPress={onClose}
                style={styles.modalCloseButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeVariables.whiteColor || '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '65%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 12,
  },
  modalList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  modalBadgeWrap: {
    width: 100,
    alignItems: 'center',
    margin: 8,
  },
  modalCloseButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: themeVariables.primaryColor,
  },
  modalCloseText: {
    color: themeVariables.whiteColor || '#fff',
    fontWeight: '600',
  },
});

export default BadgeModal;
