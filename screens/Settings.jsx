import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { UserContext } from '../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSignOutAlt, faTrash, faBell, faLock, faUser, faMoon, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useAuthService } from '../services/AuthService';

const Settings = ({ navigation }) => {
  const { user, token, logout } = useContext(UserContext);
  const { deleteAccount } = useAuthService();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' }],
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteText === 'DELETE') {
      try {
        await deleteAccount(user.id, token);
        
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

  const openModal = () => setDeleteModalVisible(true);
  const closeModal = () => {
    setDeleteModalVisible(false);
    setDeleteText('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EditProfile')}>
          <FontAwesomeIcon icon={faUser} size={20} color="#312783" />
          <Text style={styles.itemText}>Edit Profile</Text>
          <FontAwesomeIcon icon={faChevronRight} size={18} color="#ccc" />
        </TouchableOpacity>
{/* 
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePassword')}>
          <FontAwesomeIcon icon={faLock} size={20} color="#312783" />
          <Text style={styles.itemText}>Change Password</Text>
          <FontAwesomeIcon icon={faChevronRight} size={18} color="#ccc" />
        </TouchableOpacity> */}

        {/* <View style={styles.item}>
          <FontAwesomeIcon icon={faBell} size={20} color="#312783" />
          <Text style={styles.itemText}>Notifications</Text>
          <Switch value={true} />
        </View> */}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} size={20} color="#d9534f" />
          <Text style={[styles.itemText, { color: '#d9534f' }]}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={openModal}>
          <FontAwesomeIcon icon={faTrash} size={20} color="#e74c3c" />
          <Text style={[styles.itemText, { color: '#e74c3c' }]}>Delete Account</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#312783',
    marginVertical: 20,
  },
  section: {
    marginBottom: 30,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#312783',
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 20,
    color: '#555',
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
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
    borderRadius: 20 
  },
  cancelButton: { 
    backgroundColor: '#312783',
    borderRadius: 20 
  },
  modalButtonText: { 
    color: '#fff', 
    fontWeight: '600' 
  }
});

export default Settings;
