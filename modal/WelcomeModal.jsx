import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import WelcomeScreen from '../screens/Welcome';

const WelcomeModal = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
    >
      {/* Touch outside the modal container to close */}
      <TouchableOpacity
        style={styles.modalBackground}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <WelcomeScreen closeModal={onClose} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Slight background dimming
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
});

export default WelcomeModal;
