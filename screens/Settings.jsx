import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { UserContext } from '../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserEdit, faSignOutAlt, faTrash } from '@fortawesome/free-solid-svg-icons'; // add faTrash icon
import { useAuthService } from '../services/AuthService';

const Settings = ({ navigation }) => {
  const { user, token, logout } = useContext(UserContext);
  const { deleteAccount } = useAuthService();

  // State for delete account modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  // State to store the user’s input text
  const [deleteText, setDeleteText] = useState('');

  const handleLogout = async () => {
    await logout(); // Ensure logout process completes
    navigation.reset({
      index: 0,
      routes: [{ name: 'SocialMedia' }], // Adjust to your actual screen name
    });
  };

  const handleDeleteAccountButton = () => {
    // Open the modal
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    // Check if user typed "DELETE"
    if (deleteText === 'DELETE') {
      try {
        await deleteAccount(user.id, token);
        // Optionally log user out or navigate them away:
        // - If the account is gone, there's no reason to stay in the app:
        //   e.g., you could log them out or reset navigation.
        
        await logout(); 
        navigation.reset({
          index: 0,
          routes: [{ name: 'SocialMedia' }], 
        });
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

  const closeModal = () => {
    setDeleteModalVisible(false);
    setDeleteText('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity 
        style={[styles.button, styles.deleteButton]} 
        onPress={handleDeleteAccountButton}
      >
        <FontAwesomeIcon icon={faTrash} size={20} color="#fff" />
        <Text style={[styles.buttonText, styles.deleteButtonText]}>
          Delete Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]} 
        onPress={handleLogout}
      >
        <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#fff" />
        <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Enter "DELETE" to permanently delete the account.
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type DELETE here"
              placeholderTextColor="#999"
              value={deleteText}
              onChangeText={setDeleteText}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.modalButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '80%',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 2,
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#312783',
  },
  logoutButton: {
    backgroundColor: '#d9534f',
  },
  logoutText: {
    color: '#fff',
  },
  // New styling for Delete Account
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#fff',
  },
  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#312783',
    fontWeight: 'bold',
  },
  textInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default Settings;
