import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import themeVariables from '../styles/theme';
import UserBadge from './UserBadge';

const OversightBadges = ({ committees = [] }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const openModal = (committee) => {
    setSelectedCommittee(committee);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedCommittee(null);
  };
  if (committees.length === 0) {
    return <Text style={styles.noDataText}>No oversight available</Text>;
  }
  return (
    <>
      <View style={styles.badgesContainer}>
        {committees.map((committee, idx) => (
          <TouchableOpacity
            key={committee._id || idx}
            style={styles.badgeTouchable}
            onPress={() => openModal(committee)}
            activeOpacity={0.7}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{committee.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {selectedCommittee && (
        <Modal visible={modalVisible} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedCommittee.name}</Text>
                  <ScrollView contentContainerStyle={styles.modalList}>
                    {(selectedCommittee.members || selectedCommittee.users || []).map((item, idx) => {
                      const key = item._id || item.user?._id || idx;
                      const user = item.user || item;
                      const certs = item.certifications;
                      return (
                        <View key={key} style={styles.modalBadgeWrap}>
                          <UserBadge user={user} userCertifications={certs} />
                        </View>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton} activeOpacity={0.8}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badgeTouchable: {
    margin: 4,
  },
  badge: {
    backgroundColor: themeVariables.primaryColor,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: themeVariables.whiteColor,
    fontSize: 12,
  },
  noDataText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeVariables.whiteColor,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: themeVariables.blackColor,
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
    padding: 12,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default OversightBadges;
