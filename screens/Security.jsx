import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CommonActions } from '@react-navigation/native';
import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import themeVariables from '../styles/theme';

const Security = ({ navigation }) => {
  const { user, token, logout } = useContext(UserContext);
  const { deleteAccount } = useAuthService();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  const getRootNavigation = () => {
    let currentNav = navigation;
    // walk up to the top-most navigator so reset targets the root stack (where Welcome exists)
    while (currentNav?.getParent && currentNav.getParent()) {
      currentNav = currentNav.getParent();
    }
    return currentNav || navigation;
  };

  const handleLogout = async () => {
    await logout();
    const rootNav = getRootNavigation();
    rootNav?.dispatch?.(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      })
    );
  };

  const handleConfirmDelete = async () => {
    if (deleteText === 'DELETE') {
      try {
        await deleteAccount(user.id, token);
        await logout();
        const rootNav = getRootNavigation();
        rootNav?.dispatch?.(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          })
        );
      } catch (error) {
        console.error('Error deleting account:', error);
        Alert.alert('Error', 'Could not delete account. Please try again.');
      } finally {
        setDeleteModalVisible(false);
        setDeleteText('');
      }
    } else {
      Alert.alert('Confirmation Required', 'Please enter "DELETE" exactly to confirm.');
    }
  };

  const openModal = () => setDeleteModalVisible(true);
  const closeModal = () => {
    setDeleteModalVisible(false);
    setDeleteText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={openModal}>
          <Ionicons name="trash-outline" size={20} color={themeVariables.blackColor} />
          <Text style={styles.itemText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={deleteModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Account Deletion</Text>
            <Text style={styles.modalMessage}>Type "DELETE" to permanently delete your account.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="DELETE"
              value={deleteText}
              onChangeText={setDeleteText}
              autoCapitalize="characters"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleConfirmDelete}>
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.screenBackgroundColor,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: themeVariables.whiteColor,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeVariables.borderLightColor,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: themeVariables.blackColor,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: themeVariables.blackColor,
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 20,
  },
  cancelButton: {
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 20,
  },
  modalButtonText: {
    color: themeVariables.whiteColor,
    fontWeight: '600',
  },
});

export default Security;
