import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../contexts/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthService } from '../services/AuthService';
import { CommonActions } from '@react-navigation/native';
import themeVariables from '../styles/theme';
import { useNavigation } from '@react-navigation/native';

const Settings = ({ navigation }) => {
  const { user, token, logout } = useContext(UserContext);
  const nav = useNavigation();
  const { deleteAccount } = useAuthService();

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteText, setDeleteText] = useState('');

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
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
        navigation.dispatch(
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
      <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom back chevron */}
      <View style={styles.chevronContainer}>
        <TouchableOpacity style={styles.chevronButton} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={20} color={themeVariables.blackColor} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Screen title */}
        <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EditProfile')}>
          <Ionicons name="person-outline" size={20} color="#312783" />
          <Text style={styles.itemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity>
{/* 
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePassword')}>
          <Ionicons name="lock-closed-outline" size={20} color="#312783" />
          <Text style={styles.itemText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color="#ccc" />
        </TouchableOpacity> */}

        {/* <View style={styles.item}>
          <Ionicons name="notifications-outline" size={20} color="#312783" />
          <Text style={styles.itemText}>Notifications</Text>
          <Switch value={true} />
        </View> */}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.item} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#d9534f" />
          <Text style={[styles.itemText, { color: '#d9534f' }]}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={openModal}>
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.darkGreyColor,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  // Custom back chevron container (replaces default header)
  chevronContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 16,
  },
  // Header text style for Settings title
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeVariables.blackColor,
    marginVertical: 20,
  },
  chevronButton: {
    backgroundColor: themeVariables.greyColor,
    borderRadius: themeVariables.borderRadiusPill,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
